package com.splittrip.trip.infrastructure;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.splittrip.trip.domain.ActivityIdea;

public interface ActivityIdeaRepository extends JpaRepository<ActivityIdea, UUID> {
    @Query("select idea from ActivityIdea idea join fetch idea.createdBy where idea.trip.id = :tripId and idea.status <> 'ARCHIVED' order by idea.createdAt desc")
    List<ActivityIdea> findVisibleByTripId(@Param("tripId") UUID tripId);
    Optional<ActivityIdea> findByIdAndTripId(UUID id, UUID tripId);
}
