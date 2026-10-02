package com.splittrip.trip.api;

import java.time.*;
import java.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.splittrip.trip.application.ActivityService;
import com.splittrip.trip.application.ActivityService.IdeaView;
import com.splittrip.trip.application.ActivityService.ItineraryView;
import com.splittrip.trip.domain.ActivityVoteValue;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@RestController
@RequestMapping("/api/v1/trips/{tripId}")
public class ActivityController {
    private final ActivityService service;
    public ActivityController(ActivityService service) { this.service = service; }

    @GetMapping("/activity-ideas")
    @Operation(summary = "List activity ideas with vote totals")
    List<IdeaView> listIdeas(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return service.listIdeas(tripId, userId(jwt));
    }

    @PostMapping("/activity-ideas")
    @Operation(summary = "Suggest an activity")
    IdeaView createIdea(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @Valid @RequestBody CreateIdeaRequest request) {
        return service.createIdea(tripId, userId(jwt), request.title(), request.description(), request.location(), request.estimatedDurationMinutes());
    }

    @PutMapping("/activity-ideas/{ideaId}/vote")
    @Operation(summary = "Create or replace the current user's vote")
    IdeaView vote(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID ideaId,
            @Valid @RequestBody VoteRequest request) {
        return service.vote(tripId, ideaId, userId(jwt), request.value());
    }

    @DeleteMapping("/activity-ideas/{ideaId}/vote")
    ResponseEntity<Void> removeVote(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID ideaId) {
        service.removeVote(tripId, ideaId, userId(jwt)); return ResponseEntity.noContent().build();
    }

    @GetMapping("/itinerary")
    @Operation(summary = "List the scheduled itinerary")
    List<ItineraryView> listItinerary(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return service.listItinerary(tripId, userId(jwt));
    }

    @PostMapping("/itinerary")
    @Operation(summary = "Schedule an activity idea")
    ItineraryView schedule(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @Valid @RequestBody ScheduleRequest request) {
        return service.schedule(tripId, request.activityIdeaId(), userId(jwt), request.scheduledDate(), request.startTime(), request.endTime(), request.note());
    }

    @PutMapping("/itinerary/{itemId}")
    @Operation(summary = "Update a scheduled activity")
    ItineraryView updateSchedule(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID itemId,
            @Valid @RequestBody UpdateScheduleRequest request) {
        return service.updateSchedule(tripId, itemId, userId(jwt), request.scheduledDate(), request.startTime(), request.endTime(), request.note());
    }

    @DeleteMapping("/itinerary/{itemId}")
    @Operation(summary = "Return a scheduled activity to the idea pool")
    ResponseEntity<Void> removeFromSchedule(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID itemId) {
        service.removeFromSchedule(tripId, itemId, userId(jwt)); return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    public record CreateIdeaRequest(@NotBlank @Size(max=120) String title, @Size(max=1000) String description,
            @Size(max=160) String location, @Min(15) @Max(1440) int estimatedDurationMinutes) {}
    public record VoteRequest(@NotNull ActivityVoteValue value) {}
    public record ScheduleRequest(@NotNull UUID activityIdeaId, @NotNull LocalDate scheduledDate,
            @NotNull LocalTime startTime, @NotNull LocalTime endTime, @Size(max=500) String note) {}
    public record UpdateScheduleRequest(@NotNull LocalDate scheduledDate, @NotNull LocalTime startTime,
            @NotNull LocalTime endTime, @Size(max=500) String note) {}
}
