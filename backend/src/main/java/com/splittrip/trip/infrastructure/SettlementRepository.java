package com.splittrip.trip.infrastructure;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.splittrip.trip.domain.Settlement;

public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    @Query("""
        select settlement from Settlement settlement
        join fetch settlement.fromUser join fetch settlement.toUser join fetch settlement.createdBy
        where settlement.trip.id = :tripId order by settlement.settlementDate desc, settlement.createdAt desc
        """)
    List<Settlement> findByTripId(@Param("tripId") UUID tripId);
    Optional<Settlement> findByIdAndTripId(UUID id, UUID tripId);
}
