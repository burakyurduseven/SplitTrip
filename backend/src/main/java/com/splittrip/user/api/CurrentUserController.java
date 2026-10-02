package com.splittrip.user.api;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.splittrip.user.application.CurrentUserService;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/v1/users")
public class CurrentUserController {

    private final CurrentUserService currentUserService;

    public CurrentUserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get the authenticated user's profile")
    CurrentUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return CurrentUserResponse.from(currentUserService.get(UUID.fromString(jwt.getSubject())));
    }
}
