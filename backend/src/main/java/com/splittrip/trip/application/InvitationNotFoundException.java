package com.splittrip.trip.application;

public class InvitationNotFoundException extends RuntimeException {
    public InvitationNotFoundException() { super("The invitation is invalid, expired, or already used."); }
}
