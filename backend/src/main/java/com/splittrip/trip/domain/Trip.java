package com.splittrip.trip.domain;

import java.time.Instant;
import java.time.LocalDate;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip")
public class Trip {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserAccount owner;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 160)
    private String destination;

    @Column(length = 1000)
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "default_currency", nullable = false, length = 3)
    private String defaultCurrency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TripStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Trip() {
    }

    private Trip(UserAccount owner, String title, String destination, String description,
            LocalDate startDate, LocalDate endDate, String defaultCurrency) {
        this.id = UUID.randomUUID();
        this.owner = owner;
        this.title = title;
        this.destination = destination;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.defaultCurrency = defaultCurrency;
        this.status = TripStatus.ACTIVE;
    }

    public static Trip create(UserAccount owner, String title, String destination, String description,
            LocalDate startDate, LocalDate endDate, String defaultCurrency) {
        return new Trip(owner, title, destination, description, startDate, endDate, defaultCurrency);
    }

    @PrePersist
    void onCreate() {
        var now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UserAccount getOwner() { return owner; }
    public String getTitle() { return title; }
    public String getDestination() { return destination; }
    public String getDescription() { return description; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getDefaultCurrency() { return defaultCurrency; }
    public TripStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
