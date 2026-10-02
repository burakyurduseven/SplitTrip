package com.splittrip.auth.application;

public record RegisterUserCommand(String displayName, String email, String password) {
}
