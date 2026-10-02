package com.splittrip.trip.application;

import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.splittrip.trip.domain.*;
import com.splittrip.trip.infrastructure.*;

@Service
public class SettlementService {
    private final SettlementRepository repository;
    private final TripMemberRepository memberRepository;
    private final BalanceService balanceService;
    public SettlementService(SettlementRepository repository, TripMemberRepository memberRepository, BalanceService balanceService) { this.repository = repository; this.memberRepository = memberRepository; this.balanceService = balanceService; }

    @Transactional(readOnly = true)
    public List<SettlementView> list(UUID tripId, UUID userId) { requireMembership(tripId, userId); return repository.findByTripId(tripId).stream().map(this::view).toList(); }

    @Transactional
    public SettlementView create(UUID tripId, UUID userId, SettlementInput input) {
        var membership = requireMembership(tripId, userId);
        if (input.fromUserId().equals(input.toUserId())) throw new InvalidExpenseException("A payment needs two different members.");
        if (!userId.equals(input.fromUserId()) && !userId.equals(membership.getTrip().getOwner().getId())) throw new InvalidExpenseException("Only the payer or trip owner can record this payment.");
        var members = memberRepository.findActiveByTripId(tripId);
        var from = requireMember(members, input.fromUserId()); var to = requireMember(members, input.toUserId());
        BigDecimal amount;
        try { amount = input.amount().setScale(2, RoundingMode.UNNECESSARY); } catch (ArithmeticException exception) { throw new InvalidExpenseException("Money values can have at most two decimal places."); }
        if (amount.signum() <= 0) throw new InvalidExpenseException("Payment amount must be greater than zero.");
        var suggestion = balanceService.calculate(tripId, userId).suggestedTransfers().stream()
                .filter(value -> value.fromUserId().equals(input.fromUserId()) && value.toUserId().equals(input.toUserId())).findFirst()
                .orElseThrow(() -> new InvalidExpenseException("There is no outstanding suggested payment between these members."));
        if (amount.compareTo(suggestion.amount()) > 0) throw new InvalidExpenseException("Payment cannot exceed the outstanding suggested amount.");
        var settlement = Settlement.create(membership.getTrip(), from.getUser(), to.getUser(), membership.getUser(), amount, input.settlementDate(), clean(input.note()));
        return view(repository.save(settlement));
    }

    @Transactional
    public SettlementView voidPayment(UUID tripId, UUID settlementId, UUID userId) {
        var membership = requireMembership(tripId, userId);
        var settlement = repository.findByIdAndTripId(settlementId, tripId).orElseThrow(() -> new InvalidExpenseException("Payment not found."));
        if (!userId.equals(settlement.getCreatedBy().getId()) && !userId.equals(membership.getTrip().getOwner().getId())) throw new InvalidExpenseException("Only the recorder or trip owner can void this payment.");
        if (settlement.getStatus() == SettlementStatus.VOIDED) throw new InvalidExpenseException("Payment is already voided.");
        settlement.voidPayment(); return view(settlement);
    }

    private com.splittrip.trip.domain.TripMember requireMembership(UUID tripId, UUID userId) { return memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new); }
    private com.splittrip.trip.domain.TripMember requireMember(List<com.splittrip.trip.domain.TripMember> members, UUID id) { return members.stream().filter(member -> member.getUser().getId().equals(id)).findFirst().orElseThrow(() -> new InvalidExpenseException("Both people must be active trip members.")); }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private SettlementView view(Settlement value) { return new SettlementView(value.getId(), value.getFromUser().getId(), value.getFromUser().getDisplayName(), value.getToUser().getId(), value.getToUser().getDisplayName(), value.getAmount(), value.getSettlementDate(), value.getNote(), value.getStatus(), value.getCreatedBy().getDisplayName(), value.getCreatedAt(), value.getVoidedAt()); }
    public record SettlementInput(UUID fromUserId, UUID toUserId, BigDecimal amount, LocalDate settlementDate, String note) {}
    public record SettlementView(UUID id, UUID fromUserId, String fromName, UUID toUserId, String toName, BigDecimal amount, LocalDate settlementDate, String note, SettlementStatus status, String createdByName, Instant createdAt, Instant voidedAt) {}
}
