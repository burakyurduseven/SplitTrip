package com.splittrip.trip.api;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.trip.application.TripMemberView;
import com.splittrip.trip.domain.TripMemberRole;

public record TripMemberResponse(UUID userId, String displayName, String email, TripMemberRole role, Instant joinedAt) {
    static TripMemberResponse from(TripMemberView view) {
        return new TripMemberResponse(view.userId(), view.displayName(), view.email(), view.role(), view.joinedAt());
    }
}
