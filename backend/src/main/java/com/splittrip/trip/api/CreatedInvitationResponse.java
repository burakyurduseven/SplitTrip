package com.splittrip.trip.api;

import java.time.Instant;

import com.splittrip.trip.application.CreatedInvitation;

public record CreatedInvitationResponse(String token, Instant expiresAt) {
    static CreatedInvitationResponse from(CreatedInvitation invitation) {
        return new CreatedInvitationResponse(invitation.token(), invitation.expiresAt());
    }
}
