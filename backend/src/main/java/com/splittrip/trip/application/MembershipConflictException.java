package com.splittrip.trip.application;

public class MembershipConflictException extends RuntimeException {
    public MembershipConflictException(String message) { super(message); }
}
