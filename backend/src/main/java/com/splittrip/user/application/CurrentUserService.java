package com.splittrip.user.application;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.auth.application.InvalidCredentialsException;
import com.splittrip.user.domain.UserStatus;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class CurrentUserService {

    private final UserAccountRepository userRepository;

    public CurrentUserService(UserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CurrentUser get(UUID userId) {
        var user = userRepository.findById(userId)
                .filter(account -> account.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(InvalidCredentialsException::new);
        return new CurrentUser(user.getId(), user.getDisplayName(), user.getEmail(), user.getCreatedAt());
    }
}
