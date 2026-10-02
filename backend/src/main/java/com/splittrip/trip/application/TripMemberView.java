package com.splittrip.trip.application;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.trip.domain.TripMemberRole;

public record TripMemberView(
        UUID userId,
        String displayName,
        String email,
        TripMemberRole role,
        Instant joinedAt) {
}
