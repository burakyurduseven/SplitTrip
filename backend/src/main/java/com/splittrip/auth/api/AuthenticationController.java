package com.splittrip.auth.api;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.splittrip.auth.application.AuthenticationService;
import com.splittrip.auth.application.TokenPair;
import com.splittrip.common.config.SecurityProperties;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    static final String REFRESH_COOKIE = "splittrip_refresh";

    private final AuthenticationService authenticationService;
    private final SecurityProperties properties;

    public AuthenticationController(AuthenticationService authenticationService, SecurityProperties properties) {
        this.authenticationService = authenticationService;
        this.properties = properties;
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in and create a refresh session")
    ResponseEntity<AccessTokenResponse> signIn(@Valid @RequestBody SignInRequest request) {
        return tokenResponse(authenticationService.signIn(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh session and issue a new access token")
    ResponseEntity<AccessTokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        return tokenResponse(authenticationService.refresh(refreshToken));
    }

    @DeleteMapping("/logout")
    @Operation(summary = "Revoke the current refresh session")
    ResponseEntity<Void> signOut(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        authenticationService.signOut(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .build();
    }

    private ResponseEntity<AccessTokenResponse> tokenResponse(TokenPair tokens) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        refreshCookie(tokens.refreshToken(), properties.refreshTokenTtl()).toString())
                .body(AccessTokenResponse.from(tokens));
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(properties.refreshCookieSecure())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
    }
}
