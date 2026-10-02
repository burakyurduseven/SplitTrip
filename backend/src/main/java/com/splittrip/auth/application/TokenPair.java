package com.splittrip.auth.application;

import java.time.Instant;

public record TokenPair(String accessToken, Instant accessTokenExpiresAt, String refreshToken) {
}
