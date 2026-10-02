package com.splittrip.trip.domain;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_invitation")
public class TripInvitation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by")
    private UserAccount acceptedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected TripInvitation() {
    }

    private TripInvitation(Trip trip, UserAccount createdBy, String tokenHash, Instant now) {
        this.id = UUID.randomUUID();
        this.trip = trip;
        this.createdBy = createdBy;
        this.tokenHash = tokenHash;
        this.expiresAt = now.plusSeconds(7 * 24 * 60 * 60);
        this.createdAt = now;
    }

    public static TripInvitation create(Trip trip, UserAccount createdBy, String tokenHash) {
        return new TripInvitation(trip, createdBy, tokenHash, Instant.now());
    }

    public void accept(UserAccount user) {
        acceptedAt = Instant.now();
        acceptedBy = user;
    }

    public boolean isAvailable(Instant now) {
        return acceptedAt == null && expiresAt.isAfter(now);
    }

    public Trip getTrip() { return trip; }
    public Instant getExpiresAt() { return expiresAt; }
}
