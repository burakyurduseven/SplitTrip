package com.splittrip.auth.application;

import java.time.Instant;
import java.util.UUID;

public record RegisteredUser(UUID id, String displayName, String email, Instant createdAt) {
}
