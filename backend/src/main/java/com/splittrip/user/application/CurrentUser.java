package com.splittrip.user.application;

import java.time.Instant;
import java.util.UUID;

public record CurrentUser(UUID id, String displayName, String email, Instant createdAt) {
}
