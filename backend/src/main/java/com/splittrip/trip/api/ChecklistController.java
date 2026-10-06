package com.splittrip.trip.api;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.splittrip.trip.application.ChecklistService;
import com.splittrip.trip.application.ChecklistService.ChecklistItemView;
import com.splittrip.trip.domain.ChecklistPriority;
import com.splittrip.trip.domain.ChecklistStatus;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/checklist")
public class ChecklistController {
    private final ChecklistService service;
    public ChecklistController(ChecklistService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "List checklist tasks")
    List<ChecklistItemView> list(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return service.list(tripId, userId(jwt));
    }

    @PostMapping
    @Operation(summary = "Create a checklist task")
    ChecklistItemView create(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId,
            @Valid @RequestBody SaveChecklistItemRequest request) {
        return service.create(tripId, userId(jwt), request.title(), request.description(), request.assigneeId(),
                request.assignedToEveryone(), request.priority(), request.dueDate());
    }

    @PutMapping("/{itemId}")
    @Operation(summary = "Update a checklist task")
    ChecklistItemView update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID itemId,
            @Valid @RequestBody SaveChecklistItemRequest request) {
        return service.update(tripId, itemId, userId(jwt), request.title(), request.description(), request.assigneeId(),
                request.assignedToEveryone(), request.priority(), request.dueDate());
    }

    @PatchMapping("/{itemId}/status")
    @Operation(summary = "Change a checklist task status")
    ChecklistItemView changeStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID itemId,
            @Valid @RequestBody ChangeChecklistStatusRequest request) {
        return service.changeStatus(tripId, itemId, userId(jwt), request.status());
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Delete a checklist task")
    ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID itemId) {
        service.delete(tripId, itemId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }

    public record SaveChecklistItemRequest(@NotBlank @Size(max = 120) String title,
            @Size(max = 1000) String description, UUID assigneeId, boolean assignedToEveryone,
            @NotNull ChecklistPriority priority, LocalDate dueDate) {}
    public record ChangeChecklistStatusRequest(@NotNull ChecklistStatus status) {}
}
