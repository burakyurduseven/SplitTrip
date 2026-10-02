package com.splittrip.trip.api;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.trip.application.InvitationView;

public record InvitationResponse(UUID tripId, String tripTitle, String destination, Instant expiresAt) {
    static InvitationResponse from(InvitationView view) {
        return new InvitationResponse(view.tripId(), view.tripTitle(), view.destination(), view.expiresAt());
    }
}
