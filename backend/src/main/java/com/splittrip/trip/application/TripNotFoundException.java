package com.splittrip.trip.application;

public class TripNotFoundException extends RuntimeException {

    public TripNotFoundException() {
        super("The requested trip was not found.");
    }
}
