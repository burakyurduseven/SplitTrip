package com.splittrip.trip.domain;

import java.time.*;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "itinerary_item")
public class ItineraryItem {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trip_id") private Trip trip;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "activity_idea_id") private ActivityIdea activityIdea;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "scheduled_by") private UserAccount scheduledBy;
    @Column(name = "scheduled_date", nullable = false) private LocalDate scheduledDate;
    @Column(name = "start_time", nullable = false) private LocalTime startTime;
    @Column(name = "end_time", nullable = false) private LocalTime endTime;
    @Column(length = 500) private String note;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected ItineraryItem() {}
    private ItineraryItem(Trip trip, ActivityIdea idea, UserAccount user, LocalDate date, LocalTime start, LocalTime end, String note) {
        id = UUID.randomUUID(); this.trip = trip; activityIdea = idea; scheduledBy = user; scheduledDate = date;
        startTime = start; endTime = end; this.note = note; createdAt = Instant.now(); updatedAt = createdAt;
    }
    public static ItineraryItem create(Trip trip, ActivityIdea idea, UserAccount user, LocalDate date, LocalTime start, LocalTime end, String note) {
        return new ItineraryItem(trip, idea, user, date, start, end, note);
    }
    public UUID getId() { return id; } public ActivityIdea getActivityIdea() { return activityIdea; } public UserAccount getScheduledBy() { return scheduledBy; }
    public LocalDate getScheduledDate() { return scheduledDate; } public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; } public String getNote() { return note; }
}
