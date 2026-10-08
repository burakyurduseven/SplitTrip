package com.splittrip.auth.api;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.jayway.jsonpath.JsonPath;
import com.splittrip.auth.infrastructure.RefreshSessionRepository;
import com.splittrip.user.infrastructure.UserAccountRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthenticationIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshSessionRepository refreshSessionRepository;

    @Autowired
    private UserAccountRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        refreshSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void allowsPublicSpaRoutesToReachTheFrontend() throws Exception {
        mockMvc.perform(get("/trips/19f19030-0946-4416-89be-bb1f130591cf"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void signsInAndReadsTheProtectedProfile() throws Exception {
        register();

        var login = login("correct-horse-battery-staple")
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly(AuthenticationController.REFRESH_COOKIE, true))
                .andExpect(cookie().value(AuthenticationController.REFRESH_COOKIE, not(blankOrNullString())))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();

        String accessToken = JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.email").value("ada@example.com"));
    }

    @Test
    void rejectsAnIncorrectPasswordWithoutRevealingWhichCredentialFailed() throws Exception {
        register();

        login("incorrect-password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Authentication failed"))
                .andExpect(jsonPath("$.detail").value("The email or password is incorrect."));
    }

    @Test
    void rotatesRefreshTokensAndRejectsThePreviousToken() throws Exception {
        register();
        var firstLogin = login("correct-horse-battery-staple").andReturn();
        var oldCookie = firstLogin.getResponse().getCookie(AuthenticationController.REFRESH_COOKIE);

        var refresh = mockMvc.perform(post("/api/v1/auth/refresh").cookie(oldCookie))
                .andExpect(status().isOk())
                .andReturn();
        var newCookie = refresh.getResponse().getCookie(AuthenticationController.REFRESH_COOKIE);

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(oldCookie))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(newCookie))
                .andExpect(status().isOk());
    }

    @Test
    void revokesTheRefreshSessionOnLogout() throws Exception {
        register();
        var login = login("correct-horse-battery-staple").andReturn();
        Cookie refreshCookie = login.getResponse().getCookie(AuthenticationController.REFRESH_COOKIE);

        mockMvc.perform(delete("/api/v1/auth/logout").cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge(AuthenticationController.REFRESH_COOKIE, 0));

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsProfileAccessWithoutAnAccessToken() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }

    private void register() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "displayName": "Ada Lovelace",
                                  "email": "ada@example.com",
                                  "password": "correct-horse-battery-staple"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    private org.springframework.test.web.servlet.ResultActions login(String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "email": "ada@example.com",
                          "password": "%s"
                        }
                        """.formatted(password)));
    }

}
