package com.splittrip.auth.application;

public class EmailAlreadyInUseException extends RuntimeException {

    public EmailAlreadyInUseException() {
        super("An account already exists for this email address.");
    }
}
