package com.splittrip.trip.api;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.splittrip.trip.application.TripView;
import com.splittrip.trip.domain.TripMemberRole;
import com.splittrip.trip.domain.TripStatus;

public record TripResponse(
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

    static TripResponse from(TripView trip) {
        return new TripResponse(
                trip.id(), trip.ownerId(), trip.title(), trip.destination(), trip.description(),
                trip.startDate(), trip.endDate(), trip.defaultCurrency(), trip.status(),
                trip.currentUserRole(), trip.createdAt());
    }
}
