package com.splittrip.trip.domain;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "expense")
public class Expense {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trip_id") private Trip trip;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paid_by") private UserAccount paidBy;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @Column(nullable = false, length = 120) private String title;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(name = "expense_date", nullable = false) private LocalDate expenseDate;
    @Enumerated(EnumType.STRING) @Column(name = "split_method", nullable = false, length = 20) private ExpenseSplitMethod splitMethod;
    @Column(length = 500) private String note;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true) private List<ExpenseShare> shares = new ArrayList<>();

    protected Expense() {}
    private Expense(Trip trip, UserAccount paidBy, UserAccount createdBy, String title, BigDecimal amount,
            LocalDate date, ExpenseSplitMethod method, String note) {
        id = UUID.randomUUID(); this.trip = trip; this.paidBy = paidBy; this.createdBy = createdBy; this.title = title;
        this.amount = amount; expenseDate = date; splitMethod = method; this.note = note; createdAt = Instant.now(); updatedAt = createdAt;
    }
    public static Expense create(Trip trip, UserAccount paidBy, UserAccount createdBy, String title, BigDecimal amount,
            LocalDate date, ExpenseSplitMethod method, String note) { return new Expense(trip, paidBy, createdBy, title, amount, date, method, note); }
    public void update(UserAccount paidBy, String title, BigDecimal amount, LocalDate date, ExpenseSplitMethod method, String note) {
        this.paidBy = paidBy; this.title = title; this.amount = amount; expenseDate = date; splitMethod = method; this.note = note; updatedAt = Instant.now(); shares.clear();
    }
    public void addShare(UserAccount user, BigDecimal amount, BigDecimal percentage) { shares.add(ExpenseShare.create(this, user, amount, percentage)); }
    public UUID getId() { return id; } public UserAccount getPaidBy() { return paidBy; } public UserAccount getCreatedBy() { return createdBy; }
    public String getTitle() { return title; } public BigDecimal getAmount() { return amount; } public LocalDate getExpenseDate() { return expenseDate; }
    public ExpenseSplitMethod getSplitMethod() { return splitMethod; } public String getNote() { return note; } public Instant getCreatedAt() { return createdAt; }
    public List<ExpenseShare> getShares() { return shares; }
}
