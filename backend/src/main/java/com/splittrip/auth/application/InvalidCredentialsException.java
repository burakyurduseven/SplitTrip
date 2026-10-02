package com.splittrip.auth.application;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("The email or password is incorrect.");
    }
}
