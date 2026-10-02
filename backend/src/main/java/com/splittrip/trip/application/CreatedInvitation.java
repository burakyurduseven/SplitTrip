package com.splittrip.trip.application;

import java.time.Instant;

public record CreatedInvitation(String token, Instant expiresAt) {
}
