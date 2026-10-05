package com.splittrip.trip.application;

public class TripUpdateConflictException extends RuntimeException {
    public TripUpdateConflictException(String message) {
        super(message);
    }
}
