package com.splittrip.auth.api;

import java.time.Instant;

import com.splittrip.auth.application.TokenPair;

public record AccessTokenResponse(String accessToken, String tokenType, Instant expiresAt) {

    static AccessTokenResponse from(TokenPair tokens) {
        return new AccessTokenResponse(tokens.accessToken(), "Bearer", tokens.accessTokenExpiresAt());
    }
}
