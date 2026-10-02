package com.splittrip.trip.domain;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "settlement")
public class Settlement {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trip_id") private Trip trip;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "from_user_id") private UserAccount fromUser;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "to_user_id") private UserAccount toUser;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(name = "settlement_date", nullable = false) private LocalDate settlementDate;
    @Column(length = 500) private String note;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private SettlementStatus status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "voided_at") private Instant voidedAt;

    protected Settlement() {}
    private Settlement(Trip trip, UserAccount fromUser, UserAccount toUser, UserAccount createdBy, BigDecimal amount, LocalDate date, String note) {
        id = UUID.randomUUID(); this.trip = trip; this.fromUser = fromUser; this.toUser = toUser; this.createdBy = createdBy;
        this.amount = amount; settlementDate = date; this.note = note; status = SettlementStatus.ACTIVE; createdAt = Instant.now();
    }
    public static Settlement create(Trip trip, UserAccount fromUser, UserAccount toUser, UserAccount createdBy, BigDecimal amount, LocalDate date, String note) { return new Settlement(trip, fromUser, toUser, createdBy, amount, date, note); }
    public void voidPayment() { status = SettlementStatus.VOIDED; voidedAt = Instant.now(); }
    public UUID getId() { return id; } public UserAccount getFromUser() { return fromUser; } public UserAccount getToUser() { return toUser; }
    public UserAccount getCreatedBy() { return createdBy; } public BigDecimal getAmount() { return amount; } public LocalDate getSettlementDate() { return settlementDate; }
    public String getNote() { return note; } public SettlementStatus getStatus() { return status; } public Instant getCreatedAt() { return createdAt; } public Instant getVoidedAt() { return voidedAt; }
}
