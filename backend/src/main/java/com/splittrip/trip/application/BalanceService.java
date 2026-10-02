package com.splittrip.trip.application;

import java.math.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.splittrip.trip.infrastructure.*;

@Service
public class BalanceService {
    private final ExpenseRepository expenseRepository;
    private final TripMemberRepository memberRepository;
    public BalanceService(ExpenseRepository expenseRepository, TripMemberRepository memberRepository) { this.expenseRepository = expenseRepository; this.memberRepository = memberRepository; }

    @Transactional(readOnly = true)
    public BalanceSummary calculate(UUID tripId, UUID userId) {
        memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new);
        var members = memberRepository.findActiveByTripId(tripId);
        var net = new LinkedHashMap<UUID, BigDecimal>();
        var paid = new HashMap<UUID, BigDecimal>();
        var owed = new HashMap<UUID, BigDecimal>();
        members.forEach(member -> { net.put(member.getUser().getId(), BigDecimal.ZERO.setScale(2)); paid.put(member.getUser().getId(), BigDecimal.ZERO.setScale(2)); owed.put(member.getUser().getId(), BigDecimal.ZERO.setScale(2)); });
        var expenses = expenseRepository.findByTripIdWithShares(tripId);
        for (var expense : expenses) {
            var payerId = expense.getPaidBy().getId();
            paid.computeIfPresent(payerId, (id, value) -> value.add(expense.getAmount()));
            net.computeIfPresent(payerId, (id, value) -> value.add(expense.getAmount()));
            for (var share : expense.getShares()) {
                var participantId = share.getUser().getId();
                owed.computeIfPresent(participantId, (id, value) -> value.add(share.getAmount()));
                net.computeIfPresent(participantId, (id, value) -> value.subtract(share.getAmount()));
            }
        }
        var names = members.stream().collect(java.util.stream.Collectors.toMap(member -> member.getUser().getId(), member -> member.getUser().getDisplayName()));
        var balances = members.stream().map(member -> {
            var id = member.getUser().getId();
            return new MemberBalance(id, member.getUser().getDisplayName(), paid.get(id), owed.get(id), net.get(id));
        }).toList();
        return new BalanceSummary(expenses.stream().map(expense -> expense.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2), balances, simplify(net, names));
    }

    private List<TransferSuggestion> simplify(Map<UUID, BigDecimal> net, Map<UUID, String> names) {
        var debtors = net.entrySet().stream().filter(entry -> entry.getValue().signum() < 0).map(entry -> new MutableBalance(entry.getKey(), entry.getValue().negate())).sorted(Comparator.comparing(MutableBalance::amount).reversed()).toList();
        var creditors = net.entrySet().stream().filter(entry -> entry.getValue().signum() > 0).map(entry -> new MutableBalance(entry.getKey(), entry.getValue())).sorted(Comparator.comparing(MutableBalance::amount).reversed()).toList();
        var mutableDebtors = new ArrayList<>(debtors); var mutableCreditors = new ArrayList<>(creditors); var transfers = new ArrayList<TransferSuggestion>();
        int debtorIndex = 0, creditorIndex = 0;
        while (debtorIndex < mutableDebtors.size() && creditorIndex < mutableCreditors.size()) {
            var debtor = mutableDebtors.get(debtorIndex); var creditor = mutableCreditors.get(creditorIndex); var amount = debtor.amount().min(creditor.amount()).setScale(2);
            if (amount.signum() > 0) transfers.add(new TransferSuggestion(debtor.userId(), names.get(debtor.userId()), creditor.userId(), names.get(creditor.userId()), amount));
            mutableDebtors.set(debtorIndex, new MutableBalance(debtor.userId(), debtor.amount().subtract(amount)));
            mutableCreditors.set(creditorIndex, new MutableBalance(creditor.userId(), creditor.amount().subtract(amount)));
            if (mutableDebtors.get(debtorIndex).amount().signum() == 0) debtorIndex++;
            if (mutableCreditors.get(creditorIndex).amount().signum() == 0) creditorIndex++;
        }
        return transfers;
    }
    private record MutableBalance(UUID userId, BigDecimal amount) {}
    public record MemberBalance(UUID userId, String displayName, BigDecimal paid, BigDecimal owed, BigDecimal netBalance) {}
    public record TransferSuggestion(UUID fromUserId, String fromName, UUID toUserId, String toName, BigDecimal amount) {}
    public record BalanceSummary(BigDecimal totalSpent, List<MemberBalance> members, List<TransferSuggestion> suggestedTransfers) {}
}
