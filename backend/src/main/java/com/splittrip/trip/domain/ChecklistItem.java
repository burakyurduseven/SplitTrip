package com.splittrip.trip.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "checklist_item")
public class ChecklistItem {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "trip_id") private Trip trip;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assignee_id") private UserAccount assignee;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
    @Column(nullable = false, length = 120) private String title;
    @Column(length = 1000) private String description;
    @Column(name = "assigned_to_everyone", nullable = false) private boolean assignedToEveryone;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ChecklistStatus status;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ChecklistPriority priority;
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "completed_at") private Instant completedAt;

    protected ChecklistItem() {}

    private ChecklistItem(Trip trip, UserAccount createdBy, String title, String description,
            UserAccount assignee, boolean assignedToEveryone, ChecklistPriority priority, LocalDate dueDate) {
        this.id = UUID.randomUUID();
        this.trip = trip;
        this.createdBy = createdBy;
        this.title = title;
        this.description = description;
        this.assignee = assignee;
        this.assignedToEveryone = assignedToEveryone;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = ChecklistStatus.TODO;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    public static ChecklistItem create(Trip trip, UserAccount createdBy, String title, String description,
            UserAccount assignee, boolean assignedToEveryone, ChecklistPriority priority, LocalDate dueDate) {
        return new ChecklistItem(trip, createdBy, title, description, assignee, assignedToEveryone, priority, dueDate);
    }

    public void update(String title, String description, UserAccount assignee, boolean assignedToEveryone,
            ChecklistPriority priority, LocalDate dueDate) {
        this.title = title;
        this.description = description;
        this.assignee = assignee;
        this.assignedToEveryone = assignedToEveryone;
        this.priority = priority;
        this.dueDate = dueDate;
        this.updatedAt = Instant.now();
    }

    public void changeStatus(ChecklistStatus status) {
        this.status = status;
        this.completedAt = status == ChecklistStatus.COMPLETED ? Instant.now() : null;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Trip getTrip() { return trip; }
    public UserAccount getAssignee() { return assignee; }
    public UserAccount getCreatedBy() { return createdBy; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public boolean isAssignedToEveryone() { return assignedToEveryone; }
    public ChecklistStatus getStatus() { return status; }
    public ChecklistPriority getPriority() { return priority; }
    public LocalDate getDueDate() { return dueDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
