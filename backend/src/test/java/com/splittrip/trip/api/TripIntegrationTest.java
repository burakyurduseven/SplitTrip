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

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private RefreshSessionRepository refreshSessionRepository;

    @Autowired
    private UserAccountRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
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
