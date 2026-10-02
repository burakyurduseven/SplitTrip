package com.splittrip.trip.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.splittrip.trip.application.MembershipService;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/v1")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @PostMapping("/trips/{tripId}/invitations")
    @Operation(summary = "Create a single-use trip invitation")
    CreatedInvitationResponse createInvitation(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return CreatedInvitationResponse.from(membershipService.createInvitation(tripId, userId(jwt)));
    }

    @GetMapping("/invitations/{token}")
    @Operation(summary = "Preview a trip invitation")
    InvitationResponse previewInvitation(@PathVariable String token) {
        return InvitationResponse.from(membershipService.preview(token));
    }

    @PostMapping("/invitations/{token}/accept")
    @Operation(summary = "Join a trip using an invitation")
    TripMemberResponse acceptInvitation(@AuthenticationPrincipal Jwt jwt, @PathVariable String token) {
        return TripMemberResponse.from(membershipService.accept(token, userId(jwt)));
    }

    @GetMapping("/trips/{tripId}/members")
    @Operation(summary = "List active trip members")
    List<TripMemberResponse> listMembers(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        return membershipService.listMembers(tripId, userId(jwt)).stream().map(TripMemberResponse::from).toList();
    }

    @DeleteMapping("/trips/{tripId}/members/{memberUserId}")
    @Operation(summary = "Remove a member from a trip")
    ResponseEntity<Void> removeMember(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId,
            @PathVariable UUID memberUserId) {
        membershipService.removeMember(tripId, memberUserId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/trips/{tripId}/members/me")
    @Operation(summary = "Leave a trip")
    ResponseEntity<Void> leaveTrip(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID tripId) {
        membershipService.leave(tripId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
