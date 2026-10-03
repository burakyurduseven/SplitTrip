package com.splittrip.trip.domain;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.domain.UserAccount;
import jakarta.persistence.*;

@Entity
@Table(name = "activity_vote")
public class ActivityVote {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "activity_idea_id") private ActivityIdea activityIdea;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private UserAccount user;
    @Enumerated(EnumType.STRING) @Column(name = "vote_value", nullable = false, length = 16) private ActivityVoteValue value;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected ActivityVote() {}
    private ActivityVote(ActivityIdea idea, UserAccount user, ActivityVoteValue value) {
        id = UUID.randomUUID(); activityIdea = idea; this.user = user; this.value = value; createdAt = Instant.now(); updatedAt = createdAt;
    }
    public static ActivityVote create(ActivityIdea idea, UserAccount user, ActivityVoteValue value) { return new ActivityVote(idea, user, value); }
    public void changeTo(ActivityVoteValue value) { this.value = value; updatedAt = Instant.now(); }
    public UUID getActivityIdeaId() { return activityIdea.getId(); } public UUID getUserId() { return user.getId(); } public ActivityVoteValue getValue() { return value; }
}
