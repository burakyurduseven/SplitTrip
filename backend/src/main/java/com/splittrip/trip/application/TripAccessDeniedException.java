package com.splittrip.trip.application;

public class TripAccessDeniedException extends RuntimeException {
    public TripAccessDeniedException(String message) { super(message); }
}
