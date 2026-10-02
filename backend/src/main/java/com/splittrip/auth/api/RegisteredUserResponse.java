package com.splittrip.auth.api;

import java.time.Instant;
import java.util.UUID;

import com.splittrip.auth.application.RegisteredUser;

public record RegisteredUserResponse(UUID id, String displayName, String email, Instant createdAt) {

    static RegisteredUserResponse from(RegisteredUser user) {
        return new RegisteredUserResponse(user.id(), user.displayName(), user.email(), user.createdAt());
    }
}
