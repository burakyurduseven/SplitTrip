package com.splittrip.status.api;

import java.time.Instant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/status")
public class StatusController {

    @GetMapping
    ResponseEntity<StatusResponse> status() {
        return ResponseEntity.ok(new StatusResponse("ok", Instant.now()));
    }

    record StatusResponse(String status, Instant timestamp) {
    }
}
