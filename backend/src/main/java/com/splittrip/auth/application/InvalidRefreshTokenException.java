package com.splittrip.auth.application;

public class InvalidRefreshTokenException extends RuntimeException {

    public InvalidRefreshTokenException() {
        super("The refresh session is missing, expired, or invalid.");
    }
}
