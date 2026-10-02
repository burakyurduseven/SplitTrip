package com.splittrip.trip.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.splittrip.trip.application.SettlementService;
import com.splittrip.trip.application.SettlementService.*;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/settlements")
public class SettlementController {
    private final SettlementService service;
    public SettlementController(SettlementService service) { this.service = service; }
    @GetMapping @Operation(summary = "List settlement history") List<SettlementView> list(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) { return service.list(tripId, userId(jwt)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Operation(summary = "Record a payment") SettlementView create(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @Valid @RequestBody SettlementRequest request) { return service.create(tripId, userId(jwt), request.toInput()); }
    @PostMapping("/{settlementId}/void") @Operation(summary = "Void a payment") SettlementView voidPayment(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId, @PathVariable UUID settlementId) { return service.voidPayment(tripId, settlementId, userId(jwt)); }
    private UUID userId(Jwt jwt) { return UUID.fromString(jwt.getSubject()); }
    public record SettlementRequest(@NotNull UUID fromUserId, @NotNull UUID toUserId, @NotNull @DecimalMin("0.01") @Digits(integer=17, fraction=2) BigDecimal amount, @NotNull LocalDate settlementDate, @Size(max=500) String note) { SettlementInput toInput() { return new SettlementInput(fromUserId, toUserId, amount, settlementDate, note); } }
}
