package com.splittrip.trip.infrastructure;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.splittrip.trip.domain.ActivityVote;

public interface ActivityVoteRepository extends JpaRepository<ActivityVote, UUID> {
    List<ActivityVote> findByActivityIdeaId(UUID activityIdeaId);
    Optional<ActivityVote> findByActivityIdeaIdAndUser_Id(UUID activityIdeaId, UUID userId);
}
