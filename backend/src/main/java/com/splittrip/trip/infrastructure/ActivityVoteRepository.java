package com.splittrip.trip.infrastructure;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.splittrip.trip.domain.ActivityVote;

public interface ActivityVoteRepository extends JpaRepository<ActivityVote, UUID> {
    List<ActivityVote> findByActivityIdea_Id(UUID activityIdeaId);
    Optional<ActivityVote> findByActivityIdea_IdAndUser_Id(UUID activityIdeaId, UUID userId);
    @Query("select vote from ActivityVote vote join fetch vote.user join vote.activityIdea idea where idea.trip.id = :tripId")
    List<ActivityVote> findByTripId(@Param("tripId") UUID tripId);
}
