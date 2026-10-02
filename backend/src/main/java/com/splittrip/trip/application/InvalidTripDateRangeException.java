package com.splittrip.trip.application;

public class InvalidTripDateRangeException extends RuntimeException {

    public InvalidTripDateRangeException() {
        super("The trip start date cannot be after its end date.");
    }
}
