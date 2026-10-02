package com.splittrip.trip.domain;

import java.math.BigDecimal;
import java.util.UUID;
import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "expense_share")
public class ExpenseShare {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "expense_id") private Expense expense;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private UserAccount user;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(precision = 5, scale = 2) private BigDecimal percentage;
    protected ExpenseShare() {}
    private ExpenseShare(Expense expense, UserAccount user, BigDecimal amount, BigDecimal percentage) { id = UUID.randomUUID(); this.expense = expense; this.user = user; this.amount = amount; this.percentage = percentage; }
    public static ExpenseShare create(Expense expense, UserAccount user, BigDecimal amount, BigDecimal percentage) { return new ExpenseShare(expense, user, amount, percentage); }
    public UserAccount getUser() { return user; } public BigDecimal getAmount() { return amount; } public BigDecimal getPercentage() { return percentage; }
}
