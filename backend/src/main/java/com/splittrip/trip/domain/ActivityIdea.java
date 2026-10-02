package com.splittrip.trip.domain;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;

import jakarta.persistence.*;

@Entity
@Table(name = "activity_idea")
public class ActivityIdea {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trip_id") private Trip trip;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @Column(nullable = false, length = 120) private String title;
    @Column(length = 1000) private String description;
    @Column(length = 160) private String location;
    @Column(name = "estimated_duration_minutes", nullable = false) private int estimatedDurationMinutes;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private ActivityIdeaStatus status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected ActivityIdea() {}
    private ActivityIdea(Trip trip, UserAccount createdBy, String title, String description, String location, int duration) {
        this.id = UUID.randomUUID(); this.trip = trip; this.createdBy = createdBy; this.title = title;
        this.description = description; this.location = location; this.estimatedDurationMinutes = duration;
        this.status = ActivityIdeaStatus.PROPOSED; this.createdAt = Instant.now(); this.updatedAt = createdAt;
    }
    public static ActivityIdea create(Trip trip, UserAccount user, String title, String description, String location, int duration) {
        return new ActivityIdea(trip, user, title, description, location, duration);
    }
    public void schedule() { status = ActivityIdeaStatus.SCHEDULED; updatedAt = Instant.now(); }
    public UUID getId() { return id; } public Trip getTrip() { return trip; } public UserAccount getCreatedBy() { return createdBy; }
    public String getTitle() { return title; } public String getDescription() { return description; } public String getLocation() { return location; }
    public int getEstimatedDurationMinutes() { return estimatedDurationMinutes; } public ActivityIdeaStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
