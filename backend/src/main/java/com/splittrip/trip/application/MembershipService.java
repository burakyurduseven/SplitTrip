package com.splittrip.trip.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.auth.application.InvalidCredentialsException;
import com.splittrip.trip.domain.TripInvitation;
import com.splittrip.trip.domain.TripMember;
import com.splittrip.trip.domain.TripMemberRole;
import com.splittrip.trip.infrastructure.TripInvitationRepository;
import com.splittrip.trip.infrastructure.TripMemberRepository;
import com.splittrip.user.domain.UserStatus;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class MembershipService {

    private final TripMemberRepository memberRepository;
    private final TripInvitationRepository invitationRepository;
    private final UserAccountRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public MembershipService(TripMemberRepository memberRepository,
            TripInvitationRepository invitationRepository,
            UserAccountRepository userRepository) {
        this.memberRepository = memberRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CreatedInvitation createInvitation(UUID tripId, UUID userId) {
        var ownerMembership = requireActiveMembership(tripId, userId);
        if (ownerMembership.getRole() != TripMemberRole.OWNER) {
            throw new TripAccessDeniedException("Only the trip owner can create invitations.");
        }
        var raw = new byte[32];
        secureRandom.nextBytes(raw);
        var token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        var invitation = invitationRepository.save(TripInvitation.create(
                ownerMembership.getTrip(), ownerMembership.getUser(), hash(token)));
        return new CreatedInvitation(token, invitation.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public InvitationView preview(String token) {
        var invitation = requireAvailableInvitation(token);
        var trip = invitation.getTrip();
        return new InvitationView(trip.getId(), trip.getTitle(), trip.getDestination(), invitation.getExpiresAt());
    }

    @Transactional
    public TripMemberView accept(String token, UUID userId) {
        var invitation = requireAvailableInvitation(token);
        var user = userRepository.findById(userId)
                .filter(account -> account.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(InvalidCredentialsException::new);
        var trip = invitation.getTrip();
        var existing = memberRepository.findByTripIdAndUserId(trip.getId(), userId);
        if (existing.isPresent() && existing.get().getStatus() == com.splittrip.trip.domain.TripMemberStatus.ACTIVE) {
            throw new MembershipConflictException("You are already a member of this trip.");
        }
        var membership = existing.orElseGet(() -> TripMember.member(trip, user));
        if (existing.isPresent()) membership.rejoin();
        memberRepository.save(membership);
        invitation.accept(user);
        return toView(membership);
    }

    @Transactional(readOnly = true)
    public List<TripMemberView> listMembers(UUID tripId, UUID userId) {
        requireActiveMembership(tripId, userId);
        return memberRepository.findActiveByTripId(tripId).stream().map(this::toView).toList();
    }

    @Transactional
    public void removeMember(UUID tripId, UUID targetUserId, UUID actorUserId) {
        var actor = requireActiveMembership(tripId, actorUserId);
        if (actor.getRole() != TripMemberRole.OWNER) {
            throw new TripAccessDeniedException("Only the trip owner can remove members.");
        }
        var target = memberRepository.findActiveMembership(tripId, targetUserId)
                .orElseThrow(TripNotFoundException::new);
        if (target.getRole() == TripMemberRole.OWNER) {
            throw new MembershipConflictException("The trip owner cannot be removed.");
        }
        target.remove();
    }

    @Transactional
    public void leave(UUID tripId, UUID userId) {
        var membership = requireActiveMembership(tripId, userId);
        if (membership.getRole() == TripMemberRole.OWNER) {
            throw new MembershipConflictException("The trip owner cannot leave the trip.");
        }
        membership.leave();
    }

    private TripMember requireActiveMembership(UUID tripId, UUID userId) {
        return memberRepository.findActiveMembership(tripId, userId)
                .orElseThrow(TripNotFoundException::new);
    }

    private TripInvitation requireAvailableInvitation(String token) {
        return invitationRepository.findByTokenHashWithTrip(hash(token))
                .filter(invitation -> invitation.isAvailable(Instant.now()))
                .orElseThrow(InvitationNotFoundException::new);
    }

    private TripMemberView toView(TripMember membership) {
        var user = membership.getUser();
        return new TripMemberView(user.getId(), user.getDisplayName(), user.getEmail(), membership.getRole(), membership.getJoinedAt());
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
