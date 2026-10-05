package com.splittrip.trip.application;

import java.time.LocalDate;

public record UpdateTripCommand(
        String title,
        String destination,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String defaultCurrency) {
}
