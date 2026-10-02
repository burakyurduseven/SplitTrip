package com.splittrip.trip.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.splittrip.trip.domain.TripMemberRole;
import com.splittrip.trip.domain.TripStatus;

public record TripView(
        UUID id,
        UUID ownerId,
        String title,
        String destination,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String defaultCurrency,
        TripStatus status,
        TripMemberRole currentUserRole,
        Instant createdAt) {
}
