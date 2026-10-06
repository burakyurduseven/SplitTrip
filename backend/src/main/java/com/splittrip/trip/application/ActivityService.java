package com.splittrip.trip.application;

import java.time.*;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.auth.application.InvalidCredentialsException;
import com.splittrip.trip.domain.*;
import com.splittrip.trip.infrastructure.*;
import com.splittrip.user.domain.UserStatus;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class ActivityService {
    private final ActivityIdeaRepository ideaRepository;
    private final ActivityVoteRepository voteRepository;
    private final ItineraryItemRepository itineraryRepository;
    private final TripMemberRepository memberRepository;
    private final UserAccountRepository userRepository;

    public ActivityService(ActivityIdeaRepository ideaRepository, ActivityVoteRepository voteRepository,
            ItineraryItemRepository itineraryRepository, TripMemberRepository memberRepository,
            UserAccountRepository userRepository) {
        this.ideaRepository = ideaRepository; this.voteRepository = voteRepository;
        this.itineraryRepository = itineraryRepository; this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public IdeaView createIdea(UUID tripId, UUID userId, String title, String description, String location, int duration) {
        var membership = requireMembership(tripId, userId);
        var idea = ideaRepository.save(ActivityIdea.create(membership.getTrip(), membership.getUser(), title.trim(), clean(description), clean(location), duration));
        return toIdeaView(idea, userId, memberRepository.countActiveByTripId(tripId));
    }

    @Transactional(readOnly = true)
    public List<IdeaView> listIdeas(UUID tripId, UUID userId) {
        requireMembership(tripId, userId);
        var votesByIdea = voteRepository.findByTripId(tripId).stream().collect(java.util.stream.Collectors.groupingBy(ActivityVote::getActivityIdeaId));
        var memberCount = memberRepository.countActiveByTripId(tripId);
        return ideaRepository.findVisibleByTripId(tripId).stream().map(idea -> toIdeaView(idea, userId, votesByIdea.getOrDefault(idea.getId(), List.of()), memberCount)).toList();
    }

    @Transactional
    public IdeaView vote(UUID tripId, UUID ideaId, UUID userId, ActivityVoteValue value) {
        requireMembership(tripId, userId);
        var idea = requireIdea(tripId, ideaId);
        var user = activeUser(userId);
        var vote = voteRepository.findByActivityIdea_IdAndUser_Id(ideaId, userId)
                .orElseGet(() -> ActivityVote.create(idea, user, value));
        vote.changeTo(value);
        voteRepository.save(vote);
        return toIdeaView(idea, userId, memberRepository.countActiveByTripId(tripId));
    }

    @Transactional
    public void removeVote(UUID tripId, UUID ideaId, UUID userId) {
        requireMembership(tripId, userId);
        requireIdea(tripId, ideaId);
        voteRepository.findByActivityIdea_IdAndUser_Id(ideaId, userId).ifPresent(voteRepository::delete);
    }

    @Transactional
    public ItineraryView schedule(UUID tripId, UUID ideaId, UUID userId, LocalDate date,
            LocalTime startTime, LocalTime endTime, String note) {
        var membership = requireMembership(tripId, userId);
        var trip = membership.getTrip();
        var idea = requireIdea(tripId, ideaId);
        if (date.isBefore(trip.getStartDate()) || date.isAfter(trip.getEndDate()))
            throw new InvalidItineraryException("The activity date must be within the trip dates.");
        if (!startTime.isBefore(endTime))
            throw new InvalidItineraryException("The activity start time must be before its end time.");
        if (itineraryRepository.existsByActivityIdeaId(ideaId))
            throw new MembershipConflictException("This activity is already in the itinerary.");
        var overlaps = itineraryRepository.hasOverlap(tripId, date, startTime, endTime);
        var item = itineraryRepository.save(ItineraryItem.create(trip, idea, membership.getUser(), date, startTime, endTime, clean(note)));
        idea.schedule();
        return toItineraryView(item, overlaps);
    }

    @Transactional(readOnly = true)
    public List<ItineraryView> listItinerary(UUID tripId, UUID userId) {
        requireMembership(tripId, userId);
        return itineraryRepository.findByTripIdOrdered(tripId).stream().map(item -> toItineraryView(item, false)).toList();
    }

    @Transactional
    public ItineraryView updateSchedule(UUID tripId, UUID itemId, UUID userId, LocalDate date,
            LocalTime startTime, LocalTime endTime, String note) {
        var membership = requireMembership(tripId, userId);
        validateSchedule(membership.getTrip(), date, startTime, endTime);
        var item = itineraryRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new InvalidItineraryException("Scheduled activity not found."));
        var overlaps = itineraryRepository.hasOverlapExcluding(tripId, itemId, date, startTime, endTime);
        item.reschedule(membership.getUser(), date, startTime, endTime, clean(note));
        return toItineraryView(item, overlaps);
    }

    @Transactional
    public void removeFromSchedule(UUID tripId, UUID itemId, UUID userId) {
        requireMembership(tripId, userId);
        var item = itineraryRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new InvalidItineraryException("Scheduled activity not found."));
        item.getActivityIdea().returnToPool();
        itineraryRepository.delete(item);
    }

    private void validateSchedule(Trip trip, LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date.isBefore(trip.getStartDate()) || date.isAfter(trip.getEndDate()))
            throw new InvalidItineraryException("The activity date must be within the trip dates.");
        if (!startTime.isBefore(endTime))
            throw new InvalidItineraryException("The activity start time must be before its end time.");
    }

    private TripMember requireMembership(UUID tripId, UUID userId) {
        return memberRepository.findActiveMembership(tripId, userId).orElseThrow(TripNotFoundException::new);
    }
    private ActivityIdea requireIdea(UUID tripId, UUID ideaId) {
        return ideaRepository.findByIdAndTripId(ideaId, tripId).orElseThrow(() -> new InvalidItineraryException("Activity idea not found."));
    }
    private com.splittrip.user.domain.UserAccount activeUser(UUID userId) {
        return userRepository.findById(userId).filter(user -> user.getStatus() == UserStatus.ACTIVE).orElseThrow(InvalidCredentialsException::new);
    }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private IdeaView toIdeaView(ActivityIdea idea, UUID userId, long memberCount) {
        var votes = voteRepository.findByActivityIdea_Id(idea.getId());
        return toIdeaView(idea, userId, votes, memberCount);
    }
    private IdeaView toIdeaView(ActivityIdea idea, UUID userId, List<ActivityVote> votes, long memberCount) {
        var likes = votes.stream().filter(vote -> vote.getValue() == ActivityVoteValue.LIKE).count();
        var maybes = votes.stream().filter(vote -> vote.getValue() == ActivityVoteValue.MAYBE).count();
        var dislikes = votes.stream().filter(vote -> vote.getValue() == ActivityVoteValue.DISLIKE).count();
        var currentVote = votes.stream().filter(vote -> vote.getUserId().equals(userId)).map(ActivityVote::getValue).findFirst().orElse(null);
        var score = likes * 2 + maybes - dislikes;
        var perfectMatch = memberCount > 0 && likes == memberCount;
        return new IdeaView(idea.getId(), idea.getCreatedBy().getId(), idea.getCreatedBy().getDisplayName(), idea.getTitle(),
                idea.getDescription(), idea.getLocation(), idea.getEstimatedDurationMinutes(), idea.getStatus(), likes, maybes,
                dislikes, votes.size(), memberCount, score, perfectMatch, currentVote, idea.getCreatedAt());
    }
    private ItineraryView toItineraryView(ItineraryItem item, boolean overlaps) {
        var idea = item.getActivityIdea();
        return new ItineraryView(item.getId(), idea.getId(), idea.getTitle(), idea.getLocation(), item.getScheduledDate(),
                item.getStartTime(), item.getEndTime(), item.getNote(), item.getScheduledBy().getDisplayName(), overlaps);
    }

    public record IdeaView(UUID id, UUID createdById, String createdByName, String title, String description,
            String location, int estimatedDurationMinutes, ActivityIdeaStatus status, long likes, long maybes,
            long dislikes, long voteCount, long memberCount, long score, boolean perfectMatch,
            ActivityVoteValue currentUserVote, Instant createdAt) {}
    public record ItineraryView(UUID id, UUID activityIdeaId, String title, String location, LocalDate scheduledDate,
            LocalTime startTime, LocalTime endTime, String note, String scheduledByName, boolean overlapsExistingItem) {}
}
