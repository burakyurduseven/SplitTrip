package com.splittrip.trip.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.splittrip.trip.domain.TripMember;

public interface TripMemberRepository extends JpaRepository<TripMember, UUID> {

    @Query("""
            select membership from TripMember membership
            join fetch membership.trip trip
            join fetch trip.owner
            where membership.user.id = :userId
              and membership.user.status = 'ACTIVE'
              and membership.status = 'ACTIVE'
            order by trip.startDate desc, trip.createdAt desc
            """)
    List<TripMember> findActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            select membership from TripMember membership
            join fetch membership.trip trip
            join fetch trip.owner
            where membership.user.id = :userId
              and membership.trip.id = :tripId
              and membership.user.status = 'ACTIVE'
              and membership.status = 'ACTIVE'
            """)
    Optional<TripMember> findActiveMembership(
            @Param("tripId") UUID tripId,
            @Param("userId") UUID userId);

    @Query("""
            select membership from TripMember membership
            join fetch membership.user
            where membership.trip.id = :tripId and membership.status = 'ACTIVE'
            order by membership.role desc, membership.joinedAt
            """)
    List<TripMember> findActiveByTripId(@Param("tripId") UUID tripId);

    Optional<TripMember> findByTripIdAndUserId(UUID tripId, UUID userId);

    @Query("select count(membership) from TripMember membership where membership.trip.id = :tripId and membership.status = 'ACTIVE'")
    long countActiveByTripId(@Param("tripId") UUID tripId);
}
