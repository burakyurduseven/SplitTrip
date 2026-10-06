package com.splittrip.trip.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;

import com.splittrip.trip.domain.ChecklistItem;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, UUID> {
    @Query(value = """
            select count(*) as total,
                   count(*) filter (where status = 'COMPLETED') as completed,
                   count(*) filter (where status <> 'COMPLETED' and due_date < :today) as overdue,
                   count(*) filter (where assignee_id = :userId) as assignedToCurrentUser
            from checklist_item
            where trip_id = :tripId
            """, nativeQuery = true)
    ChecklistSummaryProjection summarize(@Param("tripId") UUID tripId, @Param("userId") UUID userId,
            @Param("today") LocalDate today);

    @Query("""
            select item from ChecklistItem item
            join fetch item.createdBy
            left join fetch item.assignee
            where item.trip.id = :tripId
            """)
    List<ChecklistItem> findByTripId(@Param("tripId") UUID tripId);

    @Query("""
            select item from ChecklistItem item
            join fetch item.createdBy
            left join fetch item.assignee
            where item.id = :itemId and item.trip.id = :tripId
            """)
    Optional<ChecklistItem> findByIdAndTripId(@Param("itemId") UUID itemId, @Param("tripId") UUID tripId);

    interface ChecklistSummaryProjection {
        long getTotal();
        long getCompleted();
        long getOverdue();
        long getAssignedToCurrentUser();
    }
}
