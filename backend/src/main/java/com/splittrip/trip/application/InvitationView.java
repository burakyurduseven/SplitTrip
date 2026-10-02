package com.splittrip.trip.application;

import java.time.Instant;
import java.util.UUID;

public record InvitationView(UUID tripId, String tripTitle, String destination, Instant expiresAt) {
}
