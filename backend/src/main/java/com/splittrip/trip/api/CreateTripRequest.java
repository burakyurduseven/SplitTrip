package com.splittrip.trip.api;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTripRequest(
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 160) String destination,
        @Size(max = 1000) String description,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank @Pattern(regexp = "[A-Za-z]{3}", message = "must be a three-letter ISO 4217 code")
        String defaultCurrency) {
}
