package com.splittrip.trip.api;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.jayway.jsonpath.JsonPath;
import com.splittrip.auth.infrastructure.RefreshSessionRepository;
import com.splittrip.trip.infrastructure.TripMemberRepository;
import com.splittrip.trip.infrastructure.TripInvitationRepository;
import com.splittrip.trip.infrastructure.ActivityIdeaRepository;
import com.splittrip.trip.infrastructure.ActivityVoteRepository;
import com.splittrip.trip.infrastructure.ItineraryItemRepository;
import com.splittrip.trip.infrastructure.ExpenseRepository;
import com.splittrip.trip.infrastructure.TripRepository;
import com.splittrip.user.infrastructure.UserAccountRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class TripIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private TripInvitationRepository tripInvitationRepository;

    @Autowired private ItineraryItemRepository itineraryItemRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private ActivityVoteRepository activityVoteRepository;
    @Autowired private ActivityIdeaRepository activityIdeaRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private RefreshSessionRepository refreshSessionRepository;

    @Autowired
    private UserAccountRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        expenseRepository.deleteAll();
        itineraryItemRepository.deleteAll();
        activityVoteRepository.deleteAll();
        activityIdeaRepository.deleteAll();
        tripInvitationRepository.deleteAll();
        tripMemberRepository.deleteAll();
        tripRepository.deleteAll();
        refreshSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void createsATripAndMakesTheCreatorItsOwner() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");

        mockMvc.perform(post("/api/v1/trips")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validTrip("Aegean Summer")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/v1/trips/")))
                .andExpect(jsonPath("$.title").value("Aegean Summer"))
                .andExpect(jsonPath("$.destination").value("Kaş, Türkiye"))
                .andExpect(jsonPath("$.defaultCurrency").value("TRY"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.currentUserRole").value("OWNER"))
                .andExpect(jsonPath("$.ownerId").exists());
    }

    @Test
    void listsOnlyTripsWhereTheUserIsAnActiveMember() throws Exception {
        var adaToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var graceToken = registerAndLogin("grace@example.com", "Grace Hopper");
        createTrip(adaToken, "Aegean Summer");
        createTrip(graceToken, "Alpine Weekend");

        mockMvc.perform(get("/api/v1/trips")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adaToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Aegean Summer"));
    }

    @Test
    void hidesATripFromAUserWhoIsNotAMember() throws Exception {
        var adaToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var graceToken = registerAndLogin("grace@example.com", "Grace Hopper");
        var tripId = createTrip(adaToken, "Aegean Summer");

        mockMvc.perform(get("/api/v1/trips/{tripId}", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(graceToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Trip not found"));
    }

    @Test
    void rejectsAnInvalidDateRange() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");

        mockMvc.perform(post("/api/v1/trips")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Time Traveller",
                                  "destination": "London, UK",
                                  "startDate": "2027-08-20",
                                  "endDate": "2027-08-10",
                                  "defaultCurrency": "GBP"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid trip date range"));
    }

    @Test
    void rejectsTripAccessWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/trips"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createsPreviewsAndAcceptsASingleUseInvitation() throws Exception {
        var ownerToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var memberToken = registerAndLogin("grace@example.com", "Grace Hopper");
        var thirdToken = registerAndLogin("linus@example.com", "Linus Torvalds");
        var tripId = createTrip(ownerToken, "Aegean Summer");

        var invitationResult = mockMvc.perform(post("/api/v1/trips/{tripId}/invitations", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expiresAt").exists())
                .andReturn();
        String token = JsonPath.read(invitationResult.getResponse().getContentAsString(), "$.token");

        mockMvc.perform(get("/api/v1/invitations/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(tripId.toString()))
                .andExpect(jsonPath("$.tripTitle").value("Aegean Summer"));

        mockMvc.perform(post("/api/v1/invitations/{token}/accept", token)
                        .header(HttpHeaders.AUTHORIZATION, bearer(memberToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Grace Hopper"))
                .andExpect(jsonPath("$.role").value("MEMBER"));

        mockMvc.perform(get("/api/v1/trips/{tripId}/members", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(post("/api/v1/invitations/{token}/accept", token)
                        .header(HttpHeaders.AUTHORIZATION, bearer(thirdToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Invitation not found"));
    }

    @Test
    void preventsMembersFromInvitingAndAllowsThemToLeave() throws Exception {
        var ownerToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var memberToken = registerAndLogin("grace@example.com", "Grace Hopper");
        var tripId = createTrip(ownerToken, "Aegean Summer");
        var invitation = mockMvc.perform(post("/api/v1/trips/{tripId}/invitations", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andReturn();
        String token = JsonPath.read(invitation.getResponse().getContentAsString(), "$.token");
        mockMvc.perform(post("/api/v1/invitations/{token}/accept", token)
                        .header(HttpHeaders.AUTHORIZATION, bearer(memberToken)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/trips/{tripId}/invitations", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(memberToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/trips/{tripId}/members/me", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(memberToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/trips")
                        .header(HttpHeaders.AUTHORIZATION, bearer(memberToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void letsMembersSuggestAndChangeTheirVote() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var tripId = createTrip(accessToken, "Aegean Summer");
        var idea = mockMvc.perform(post("/api/v1/trips/{tripId}/activity-ideas", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Boat tour","description":"Sunset route","location":"Kaş Marina","estimatedDurationMinutes":120}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likes").value(0))
                .andReturn();
        String ideaId = JsonPath.read(idea.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                        "/api/v1/trips/{tripId}/activity-ideas/{ideaId}/vote", tripId, ideaId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"LIKE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.likes").value(1))
                .andExpect(jsonPath("$.currentUserVote").value("LIKE"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                        "/api/v1/trips/{tripId}/activity-ideas/{ideaId}/vote", tripId, ideaId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"DISLIKE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.likes").value(0))
                .andExpect(jsonPath("$.dislikes").value(1));
    }

    @Test
    void schedulesIdeasAndReportsTimeOverlapWithoutBlocking() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var tripId = createTrip(accessToken, "Aegean Summer");
        var firstIdea = createIdea(accessToken, tripId, "Boat tour");
        var secondIdea = createIdea(accessToken, tripId, "Museum visit");

        mockMvc.perform(post("/api/v1/trips/{tripId}/itinerary", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(firstIdea, "10:00", "12:00")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.overlapsExistingItem").value(false));

        mockMvc.perform(post("/api/v1/trips/{tripId}/itinerary", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(secondIdea, "11:30", "13:00")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.overlapsExistingItem").value(true));

        mockMvc.perform(get("/api/v1/trips/{tripId}/itinerary", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].title").value("Boat tour"));
    }

    @Test
    void updatesAndRemovesAScheduledActivity() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var tripId = createTrip(accessToken, "Aegean Summer");
        var ideaId = createIdea(accessToken, tripId, "Boat tour");
        var scheduled = mockMvc.perform(post("/api/v1/trips/{tripId}/itinerary", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scheduleBody(ideaId, "10:00", "12:00")))
                .andExpect(status().isOk()).andReturn();
        String itemId = JsonPath.read(scheduled.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                        "/api/v1/trips/{tripId}/itinerary/{itemId}", tripId, itemId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledDate":"2027-07-14","startTime":"14:30","endTime":"16:00","note":"Meet outside"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scheduledDate").value("2027-07-14"))
                .andExpect(jsonPath("$.startTime").value("14:30:00"))
                .andExpect(jsonPath("$.note").value("Meet outside"));

        mockMvc.perform(delete("/api/v1/trips/{tripId}/itinerary/{itemId}", tripId, itemId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/trips/{tripId}/activity-ideas", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("PROPOSED"));
    }

    @Test
    void createsAndValidatesSharedExpenses() throws Exception {
        var accessToken = registerAndLogin("ada@example.com", "Ada Lovelace");
        var tripId = createTrip(accessToken, "Aegean Summer");
        var userId = userRepository.findByEmail("ada@example.com").orElseThrow().getId();

        var createdExpense = mockMvc.perform(post("/api/v1/trips/{tripId}/expenses", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Dinner","amount":900.00,"expenseDate":"2027-07-13","paidById":"%s","splitMethod":"EQUAL","participants":[{"userId":"%s"}]}
                                """.formatted(userId, userId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(900.00))
                .andExpect(jsonPath("$.shares[0].amount").value(900.00)).andReturn();
        String expenseId = JsonPath.read(createdExpense.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(post("/api/v1/trips/{tripId}/expenses", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Tickets","amount":100.00,"expenseDate":"2027-07-13","paidById":"%s","splitMethod":"PERCENTAGE","participants":[{"userId":"%s","percentage":90}]}
                                """.formatted(userId, userId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Percentage shares must add up to 100."));

        mockMvc.perform(get("/api/v1/trips/{tripId}/expenses", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                        "/api/v1/trips/{tripId}/expenses/{expenseId}", tripId, expenseId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Updated dinner","amount":750.00,"expenseDate":"2027-07-14","paidById":"%s","splitMethod":"EXACT","participants":[{"userId":"%s","amount":750.00}]}
                                """.formatted(userId, userId)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated dinner"))
                .andExpect(jsonPath("$.shares[0].amount").value(750.00));

        mockMvc.perform(delete("/api/v1/trips/{tripId}/expenses/{expenseId}", tripId, expenseId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isNoContent());
    }

    private String createIdea(String accessToken, UUID tripId, String title) throws Exception {
        var result = mockMvc.perform(post("/api/v1/trips/{tripId}/activity-ideas", tripId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"%s\",\"estimatedDurationMinutes\":90}".formatted(title)))
                .andExpect(status().isOk()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private String scheduleBody(String ideaId, String start, String end) {
        return """
                {"activityIdeaId":"%s","scheduledDate":"2027-07-13","startTime":"%s","endTime":"%s"}
                """.formatted(ideaId, start, end);
    }

    private String registerAndLogin(String email, String displayName) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "%s",
                                  "email": "%s",
                                  "password": "correct-horse-battery-staple"
                                }
                                """.formatted(displayName, email)))
                .andExpect(status().isCreated());

        var login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "correct-horse-battery-staple"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");
    }

    private UUID createTrip(String accessToken, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/trips")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validTrip(title)))
                .andExpect(status().isCreated())
                .andReturn();
        String id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return UUID.fromString(id);
    }

    private String validTrip(String title) {
        return """
                {
                  "title": "%s",
                  "destination": "Kaş, Türkiye",
                  "description": "Our summer escape",
                  "startDate": "2027-07-12",
                  "endDate": "2027-07-18",
                  "defaultCurrency": "try"
                }
                """.formatted(title);
    }

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }
}
