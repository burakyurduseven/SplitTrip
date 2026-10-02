package com.splittrip.auth.api;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.splittrip.auth.application.RegisterUserCommand;
import com.splittrip.auth.application.RegistrationService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    ResponseEntity<RegisteredUserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        var registeredUser = registrationService.register(new RegisterUserCommand(
                request.displayName(),
                request.email(),
                request.password()));
        var response = RegisteredUserResponse.from(registeredUser);
        return ResponseEntity.created(URI.create("/api/v1/users/" + response.id())).body(response);
    }
}
