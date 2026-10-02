package com.splittrip.trip.infrastructure;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.splittrip.trip.domain.TripInvitation;

public interface TripInvitationRepository extends JpaRepository<TripInvitation, UUID> {

    @Query("select invitation from TripInvitation invitation join fetch invitation.trip where invitation.tokenHash = :tokenHash")
    Optional<TripInvitation> findByTokenHashWithTrip(@Param("tokenHash") String tokenHash);
}
