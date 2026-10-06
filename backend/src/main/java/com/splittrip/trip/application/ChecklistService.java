package com.splittrip.trip.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.trip.domain.*;
import com.splittrip.trip.infrastructure.ChecklistItemRepository;
import com.splittrip.trip.infrastructure.TripMemberRepository;
import com.splittrip.user.domain.UserAccount;

@Service
public class ChecklistService {
    private final ChecklistItemRepository repository;
    private final TripMemberRepository memberRepository;

    public ChecklistService(ChecklistItemRepository repository, TripMemberRepository memberRepository) {
        this.repository = repository;
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public List<ChecklistItemView> list(UUID tripId, UUID userId) {
        requireMembership(tripId, userId);
        return repository.findByTripId(tripId).stream()
                .sorted(checklistOrder())
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ChecklistItemView create(UUID tripId, UUID userId, String title, String description,
            UUID assigneeId, boolean assignedToEveryone, ChecklistPriority priority, LocalDate dueDate) {
        var actor = requireMembership(tripId, userId);
        var assignee = resolveAssignee(tripId, assigneeId, assignedToEveryone);
        var item = repository.save(ChecklistItem.create(actor.getTrip(), actor.getUser(), title.trim(), clean(description),
                assignee, assignedToEveryone, priority, dueDate));
        return toView(item);
    }

    @Transactional
    public ChecklistItemView update(UUID tripId, UUID itemId, UUID userId, String title, String description,
            UUID assigneeId, boolean assignedToEveryone, ChecklistPriority priority, LocalDate dueDate) {
        var actor = requireMembership(tripId, userId);
        var item = requireItem(tripId, itemId);
        requireManager(actor, item);
        var assignee = resolveAssignee(tripId, assigneeId, assignedToEveryone);
        item.update(title.trim(), clean(description), assignee, assignedToEveryone, priority, dueDate);
        return toView(item);
    }

    @Transactional
    public ChecklistItemView changeStatus(UUID tripId, UUID itemId, UUID userId, ChecklistStatus status) {
        var actor = requireMembership(tripId, userId);
        var item = requireItem(tripId, itemId);
        var canChange = actor.getRole() == TripMemberRole.OWNER
                || item.isAssignedToEveryone()
                || item.getCreatedBy().getId().equals(userId)
                || item.getAssignee().getId().equals(userId);
        if (!canChange) throw new TripAccessDeniedException("Only the assignee, task creator, or trip owner can change this task's status.");
        item.changeStatus(status);
        return toView(item);
    }

    @Transactional
    public void delete(UUID tripId, UUID itemId, UUID userId) {
        var actor = requireMembership(tripId, userId);
        var item = requireItem(tripId, itemId);
        requireManager(actor, item);
        repository.delete(item);
    }

    private TripMember requireMembership(UUID tripId, UUID userId) {
        return memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new);
    }

    private ChecklistItem requireItem(UUID tripId, UUID itemId) {
        return repository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new InvalidChecklistException("Checklist task not found."));
    }

    private UserAccount resolveAssignee(UUID tripId, UUID assigneeId, boolean everyone) {
        if (everyone) {
            if (assigneeId != null) throw new InvalidChecklistException("An everyone task cannot also have an individual assignee.");
            return null;
        }
        if (assigneeId == null) throw new InvalidChecklistException("Choose an assignee or assign the task to everyone.");
        return memberRepository.findActiveMembership(tripId, assigneeId)
                .map(TripMember::getUser)
                .orElseThrow(() -> new InvalidChecklistException("The assignee must be an active trip member."));
    }

    private void requireManager(TripMember actor, ChecklistItem item) {
        if (actor.getRole() != TripMemberRole.OWNER && !item.getCreatedBy().getId().equals(actor.getUser().getId()))
            throw new TripAccessDeniedException("Only the task creator or trip owner can change this task.");
    }

    private Comparator<ChecklistItem> checklistOrder() {
        var status = Comparator.comparing((ChecklistItem item) -> item.getStatus() == ChecklistStatus.COMPLETED);
        var overdue = Comparator.comparing((ChecklistItem item) -> item.getDueDate() == null
                || !item.getDueDate().isBefore(LocalDate.now()) || item.getStatus() == ChecklistStatus.COMPLETED);
        var priority = Comparator.comparingInt((ChecklistItem item) -> switch (item.getPriority()) {
            case HIGH -> 0; case MEDIUM -> 1; case LOW -> 2;
        });
        var dueDate = Comparator.comparing(ChecklistItem::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()));
        return status.thenComparing(overdue).thenComparing(priority).thenComparing(dueDate)
                .thenComparing(ChecklistItem::getCreatedAt);
    }

    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private ChecklistItemView toView(ChecklistItem item) {
        return new ChecklistItemView(item.getId(), item.getTitle(), item.getDescription(),
                item.getAssignee() == null ? null : item.getAssignee().getId(),
                item.getAssignee() == null ? null : item.getAssignee().getDisplayName(),
                item.isAssignedToEveryone(), item.getStatus(), item.getPriority(), item.getDueDate(),
                item.getCreatedBy().getId(), item.getCreatedBy().getDisplayName(), item.getCreatedAt(),
                item.getUpdatedAt(), item.getCompletedAt());
    }

    public record ChecklistItemView(UUID id, String title, String description, UUID assigneeId,
            String assigneeName, boolean assignedToEveryone, ChecklistStatus status, ChecklistPriority priority,
            LocalDate dueDate, UUID createdById, String createdByName, Instant createdAt, Instant updatedAt,
            Instant completedAt) {}
}
