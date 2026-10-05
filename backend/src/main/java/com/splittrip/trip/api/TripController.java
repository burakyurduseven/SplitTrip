package com.splittrip.trip.api;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.splittrip.trip.application.CreateTripCommand;
import com.splittrip.trip.application.TripService;
import com.splittrip.trip.application.UpdateTripCommand;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    @Operation(summary = "Create a trip owned by the authenticated user")
    ResponseEntity<TripResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTripRequest request) {
        var trip = tripService.create(userId(jwt), new CreateTripCommand(
                request.title(),
                request.destination(),
                request.description(),
                request.startDate(),
                request.endDate(),
                request.defaultCurrency()));
        return ResponseEntity.created(URI.create("/api/v1/trips/" + trip.id()))
                .body(TripResponse.from(trip));
    }

    @GetMapping
    @Operation(summary = "List trips where the authenticated user is an active member")
    List<TripResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return tripService.list(userId(jwt)).stream().map(TripResponse::from).toList();
    }

    @GetMapping("/{tripId}")
    @Operation(summary = "Get a trip visible to the authenticated user")
    TripResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return TripResponse.from(tripService.get(tripId, userId(jwt)));
    }

    @PutMapping("/{tripId}")
    @Operation(summary = "Update a trip owned by the authenticated user")
    TripResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tripId,
            @Valid @RequestBody UpdateTripRequest request) {
        return TripResponse.from(tripService.update(tripId, userId(jwt), new UpdateTripCommand(
                request.title(),
                request.destination(),
                request.description(),
                request.startDate(),
                request.endDate(),
                request.defaultCurrency())));
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
