package com.splittrip.auth.application;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.auth.domain.RefreshSession;
import com.splittrip.auth.infrastructure.RefreshSessionRepository;
import com.splittrip.common.config.SecurityProperties;
import com.splittrip.user.domain.UserAccount;
import com.splittrip.user.domain.UserStatus;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class AuthenticationService {

    private final UserAccountRepository userRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final SecurityProperties properties;

    public AuthenticationService(
            UserAccountRepository userRepository,
            RefreshSessionRepository refreshSessionRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            SecurityProperties properties) {
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.properties = properties;
    }

    @Transactional
    public TokenPair signIn(String email, String password) {
        var normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        var user = userRepository.findByEmail(normalizedEmail)
                .filter(account -> account.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return createSession(user, Instant.now());
    }

    @Transactional
    public TokenPair refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        var now = Instant.now();
        var session = refreshSessionRepository.findByTokenHashForUpdate(tokenService.hashRefreshToken(rawRefreshToken))
                .filter(candidate -> candidate.isUsableAt(now)
                        && candidate.getUser().getStatus() == UserStatus.ACTIVE)
                .orElseThrow(InvalidRefreshTokenException::new);

        session.revoke(now);
        return createSession(session.getUser(), now);
    }

    @Transactional
    public void signOut(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshSessionRepository.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
                .ifPresent(session -> session.revoke(Instant.now()));
    }

    private TokenPair createSession(UserAccount user, Instant now) {
        var refreshToken = tokenService.newRefreshToken();
        var session = RefreshSession.create(
                user,
                tokenService.hashRefreshToken(refreshToken),
                now.plus(properties.refreshTokenTtl()),
                now);
        refreshSessionRepository.save(session);
        var accessToken = tokenService.issueAccessToken(user, now);
        return new TokenPair(accessToken.value(), accessToken.expiresAt(), refreshToken);
    }
}
