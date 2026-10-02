package com.splittrip.trip.application;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.auth.application.InvalidCredentialsException;
import com.splittrip.trip.domain.Trip;
import com.splittrip.trip.domain.TripMember;
import com.splittrip.trip.infrastructure.TripMemberRepository;
import com.splittrip.trip.infrastructure.TripRepository;
import com.splittrip.user.domain.UserStatus;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserAccountRepository userRepository;

    public TripService(
            TripRepository tripRepository,
            TripMemberRepository tripMemberRepository,
            UserAccountRepository userRepository) {
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TripView create(UUID userId, CreateTripCommand command) {
        if (command.startDate().isAfter(command.endDate())) {
            throw new InvalidTripDateRangeException();
        }
        var owner = userRepository.findById(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(InvalidCredentialsException::new);
        var description = command.description() == null || command.description().isBlank()
                ? null
                : command.description().trim();
        var trip = Trip.create(
                owner,
                command.title().trim(),
                command.destination().trim(),
                description,
                command.startDate(),
                command.endDate(),
                command.defaultCurrency().trim().toUpperCase(Locale.ROOT));
        tripRepository.save(trip);
        var membership = tripMemberRepository.save(TripMember.owner(trip, owner));
        return toView(membership);
    }

    @Transactional(readOnly = true)
    public List<TripView> list(UUID userId) {
        return tripMemberRepository.findActiveByUserId(userId).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripView get(UUID tripId, UUID userId) {
        return tripMemberRepository.findActiveMembership(tripId, userId)
                .map(this::toView)
                .orElseThrow(TripNotFoundException::new);
    }

    private TripView toView(TripMember membership) {
        var trip = membership.getTrip();
        return new TripView(
                trip.getId(),
                trip.getOwner().getId(),
                trip.getTitle(),
                trip.getDestination(),
                trip.getDescription(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getDefaultCurrency(),
                trip.getStatus(),
                membership.getRole(),
                trip.getCreatedAt());
    }
}
