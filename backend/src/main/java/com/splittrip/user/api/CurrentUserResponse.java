package com.splittrip.user.api;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.user.application.CurrentUser;

public record CurrentUserResponse(UUID id, String displayName, String email, Instant createdAt) {

    static CurrentUserResponse from(CurrentUser user) {
        return new CurrentUserResponse(user.id(), user.displayName(), user.email(), user.createdAt());
    }
}
