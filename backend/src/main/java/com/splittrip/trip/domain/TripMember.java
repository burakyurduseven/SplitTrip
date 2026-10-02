package com.splittrip.trip.domain;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_member")
public class TripMember {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TripMemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TripMemberStatus status;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    protected TripMember() {
    }

    private TripMember(Trip trip, UserAccount user, TripMemberRole role, Instant joinedAt) {
        this.id = UUID.randomUUID();
        this.trip = trip;
        this.user = user;
        this.role = role;
        this.status = TripMemberStatus.ACTIVE;
        this.joinedAt = joinedAt;
    }

    public static TripMember owner(Trip trip, UserAccount user) {
        return new TripMember(trip, user, TripMemberRole.OWNER, Instant.now());
    }

    public static TripMember member(Trip trip, UserAccount user) {
        return new TripMember(trip, user, TripMemberRole.MEMBER, Instant.now());
    }

    public void rejoin() {
        status = TripMemberStatus.ACTIVE;
        joinedAt = Instant.now();
        leftAt = null;
    }

    public void leave() {
        status = TripMemberStatus.LEFT;
        leftAt = Instant.now();
    }

    public void remove() {
        status = TripMemberStatus.REMOVED;
        leftAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public UserAccount getUser() { return user; }
    public TripMemberRole getRole() { return role; }
    public TripMemberStatus getStatus() { return status; }
    public Instant getJoinedAt() { return joinedAt; }
}
