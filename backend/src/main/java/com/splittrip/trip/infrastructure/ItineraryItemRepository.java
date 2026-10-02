package com.splittrip.trip.infrastructure;

import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.splittrip.trip.domain.ItineraryItem;

public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, UUID> {
    @Query("select item from ItineraryItem item join fetch item.activityIdea join fetch item.scheduledBy where item.trip.id = :tripId order by item.scheduledDate, item.startTime")
    List<ItineraryItem> findByTripIdOrdered(@Param("tripId") UUID tripId);
    boolean existsByActivityIdeaId(UUID activityIdeaId);
    Optional<ItineraryItem> findByIdAndTripId(UUID id, UUID tripId);
    @Query("select count(item) > 0 from ItineraryItem item where item.trip.id = :tripId and item.scheduledDate = :date and item.startTime < :endTime and item.endTime > :startTime")
    boolean hasOverlap(@Param("tripId") UUID tripId, @Param("date") LocalDate date, @Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);
    @Query("select count(item) > 0 from ItineraryItem item where item.trip.id = :tripId and item.id <> :itemId and item.scheduledDate = :date and item.startTime < :endTime and item.endTime > :startTime")
    boolean hasOverlapExcluding(@Param("tripId") UUID tripId, @Param("itemId") UUID itemId, @Param("date") LocalDate date, @Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);
}
