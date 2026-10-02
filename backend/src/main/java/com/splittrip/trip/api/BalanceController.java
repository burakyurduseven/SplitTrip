package com.splittrip.trip.api;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.splittrip.trip.application.BalanceService;
import com.splittrip.trip.application.BalanceService.BalanceSummary;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/balances")
public class BalanceController {
    private final BalanceService service;
    public BalanceController(BalanceService service) { this.service = service; }
    @GetMapping @Operation(summary = "Calculate member balances and simplified transfers")
    BalanceSummary balances(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) { return service.calculate(tripId, UUID.fromString(jwt.getSubject())); }
}
