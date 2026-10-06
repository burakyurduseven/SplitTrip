package com.splittrip.trip.application;

import java.math.*;
import java.time.*;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.splittrip.trip.domain.*;
import com.splittrip.trip.infrastructure.*;
import jakarta.persistence.EntityManager;
import com.splittrip.common.storage.FileStorageService;
import com.splittrip.trip.application.ExpenseAttachmentService.AttachmentView;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final TripMemberRepository memberRepository;
    private final EntityManager entityManager;
    private final ExpenseAttachmentRepository attachmentRepository;
    private final FileStorageService storage;

    public ExpenseService(ExpenseRepository expenseRepository, TripMemberRepository memberRepository, EntityManager entityManager,
            ExpenseAttachmentRepository attachmentRepository, FileStorageService storage) {
        this.expenseRepository = expenseRepository; this.memberRepository = memberRepository; this.entityManager = entityManager;
        this.attachmentRepository = attachmentRepository; this.storage = storage;
    }

    @Transactional(readOnly = true)
    public List<ExpenseView> list(UUID tripId, UUID userId) {
        requireMembership(tripId, userId);
        var attachments = attachmentRepository.findByTripId(tripId).stream()
                .collect(java.util.stream.Collectors.groupingBy(value -> value.getExpense().getId()));
        return expenseRepository.findByTripIdWithShares(tripId).stream()
                .map(expense -> toView(expense, attachments.getOrDefault(expense.getId(), List.of()).stream().map(this::toAttachmentView).toList()))
                .toList();
    }

    @Transactional
    public ExpenseView create(UUID tripId, UUID userId, ExpenseInput input) {
        var membership = requireMembership(tripId, userId);
        var members = activeMembers(tripId);
        var paidBy = requireMember(members, input.paidById());
        validateBase(membership.getTrip(), input);
        var expense = Expense.create(membership.getTrip(), paidBy.getUser(), membership.getUser(), input.title().trim(),
                money(input.amount()), input.expenseDate(), input.splitMethod(), clean(input.note()));
        addShares(expense, input, members);
        return toView(expenseRepository.save(expense), List.of());
    }

    @Transactional
    public ExpenseView update(UUID tripId, UUID expenseId, UUID userId, ExpenseInput input) {
        var membership = requireMembership(tripId, userId);
        var expense = expenseRepository.findByIdAndTripIdWithShares(expenseId, tripId)
                .orElseThrow(() -> new InvalidExpenseException("Expense not found."));
        var members = activeMembers(tripId);
        var paidBy = requireMember(members, input.paidById());
        validateBase(membership.getTrip(), input);
        expense.update(paidBy.getUser(), input.title().trim(), money(input.amount()), input.expenseDate(), input.splitMethod(), clean(input.note()));
        entityManager.flush();
        addShares(expense, input, members);
        var saved = expenseRepository.save(expense);
        return toView(saved, attachmentRepository.findByExpenseId(expenseId).stream().map(this::toAttachmentView).toList());
    }

    @Transactional
    public void delete(UUID tripId, UUID expenseId, UUID userId) {
        requireMembership(tripId, userId);
        var expense = expenseRepository.findByIdAndTripIdWithShares(expenseId, tripId)
                .orElseThrow(() -> new InvalidExpenseException("Expense not found."));
        var attachments = attachmentRepository.findByExpenseId(expenseId);
        attachments.forEach(attachment -> storage.delete(attachment.getStorageKey()));
        expenseRepository.delete(expense);
    }

    private void addShares(Expense expense, ExpenseInput input, List<TripMember> members) {
        if (input.participants() == null || input.participants().isEmpty()) throw new InvalidExpenseException("Select at least one participant.");
        var seen = new HashSet<UUID>();
        var participants = input.participants().stream().map(value -> {
            if (!seen.add(value.userId())) throw new InvalidExpenseException("Each participant can only be selected once.");
            return new ResolvedParticipant(requireMember(members, value.userId()), value.amount(), value.percentage());
        }).toList();
        var total = money(input.amount());
        if (input.splitMethod() == ExpenseSplitMethod.EQUAL) {
            var base = total.divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.DOWN);
            var remainder = total.subtract(base.multiply(BigDecimal.valueOf(participants.size())));
            for (int index = 0; index < participants.size(); index++) {
                var share = base.add(index == participants.size() - 1 ? remainder : BigDecimal.ZERO);
                expense.addShare(participants.get(index).member().getUser(), share, null);
            }
            return;
        }
        if (input.splitMethod() == ExpenseSplitMethod.EXACT) {
            var amounts = participants.stream().map(value -> positiveMoney(value.amount(), "Every exact share must be greater than zero.")).toList();
            if (amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add).compareTo(total) != 0)
                throw new InvalidExpenseException("Exact shares must add up to the expense total.");
            for (int index = 0; index < participants.size(); index++) expense.addShare(participants.get(index).member().getUser(), amounts.get(index), null);
            return;
        }
        var percentages = participants.stream().map(value -> positivePercentage(value.percentage())).toList();
        if (percentages.stream().reduce(BigDecimal.ZERO, BigDecimal::add).compareTo(new BigDecimal("100.00")) != 0)
            throw new InvalidExpenseException("Percentage shares must add up to 100.");
        var allocated = BigDecimal.ZERO;
        for (int index = 0; index < participants.size(); index++) {
            var amount = index == participants.size() - 1 ? total.subtract(allocated)
                    : total.multiply(percentages.get(index)).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            allocated = allocated.add(amount);
            expense.addShare(participants.get(index).member().getUser(), amount, percentages.get(index));
        }
    }

    private void validateBase(Trip trip, ExpenseInput input) {
        if (input.expenseDate().isBefore(trip.getStartDate()) || input.expenseDate().isAfter(trip.getEndDate()))
            throw new InvalidExpenseException("Expense date must be within the trip dates.");
        positiveMoney(input.amount(), "Expense amount must be greater than zero.");
    }
    private TripMember requireMembership(UUID tripId, UUID userId) { return memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new); }
    private List<TripMember> activeMembers(UUID tripId) { return memberRepository.findActiveByTripId(tripId); }
    private TripMember requireMember(List<TripMember> members, UUID userId) { return members.stream().filter(member -> member.getUser().getId().equals(userId)).findFirst().orElseThrow(() -> new InvalidExpenseException("Every payer and participant must be an active trip member.")); }
    private BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.UNNECESSARY); }
    private BigDecimal positiveMoney(BigDecimal value, String message) { if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) throw new InvalidExpenseException(message); try { return money(value); } catch (ArithmeticException exception) { throw new InvalidExpenseException("Money values can have at most two decimal places."); } }
    private BigDecimal positivePercentage(BigDecimal value) { if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) throw new InvalidExpenseException("Every percentage must be greater than zero."); try { return value.setScale(2, RoundingMode.UNNECESSARY); } catch (ArithmeticException exception) { throw new InvalidExpenseException("Percentages can have at most two decimal places."); } }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private AttachmentView toAttachmentView(ExpenseAttachment value) { return new AttachmentView(value.getId(), value.getOriginalName(), value.getContentType(), value.getSizeBytes(), value.getUploadedBy().getDisplayName(), value.getCreatedAt()); }
    private ExpenseView toView(Expense expense, List<AttachmentView> attachments) { return new ExpenseView(expense.getId(), expense.getTitle(), expense.getAmount(), expense.getExpenseDate(), expense.getSplitMethod(), expense.getNote(), expense.getPaidBy().getId(), expense.getPaidBy().getDisplayName(), expense.getCreatedBy().getDisplayName(), expense.getShares().stream().map(share -> new ShareView(share.getUser().getId(), share.getUser().getDisplayName(), share.getAmount(), share.getPercentage())).toList(), attachments, expense.getCreatedAt()); }

    public record ParticipantInput(UUID userId, BigDecimal amount, BigDecimal percentage) {}
    public record ExpenseInput(String title, BigDecimal amount, LocalDate expenseDate, UUID paidById, ExpenseSplitMethod splitMethod, String note, List<ParticipantInput> participants) {}
    private record ResolvedParticipant(TripMember member, BigDecimal amount, BigDecimal percentage) {}
    public record ShareView(UUID userId, String displayName, BigDecimal amount, BigDecimal percentage) {}
    public record ExpenseView(UUID id, String title, BigDecimal amount, LocalDate expenseDate, ExpenseSplitMethod splitMethod, String note, UUID paidById, String paidByName, String createdByName, List<ShareView> shares, List<AttachmentView> attachments, Instant createdAt) {}
}
