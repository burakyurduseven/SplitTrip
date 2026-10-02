package com.splittrip.auth.application;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.splittrip.user.domain.UserAccount;
import com.splittrip.user.infrastructure.UserAccountRepository;

@Service
public class RegistrationService {

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UserAccountRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisteredUser register(RegisterUserCommand command) {
        var normalizedEmail = command.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyInUseException();
        }

        var user = UserAccount.create(
                normalizedEmail,
                passwordEncoder.encode(command.password()),
                command.displayName().trim());

        try {
            var savedUser = userRepository.saveAndFlush(user);
            return new RegisteredUser(
                    savedUser.getId(),
                    savedUser.getDisplayName(),
                    savedUser.getEmail(),
                    savedUser.getCreatedAt());
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyInUseException();
        }
    }
}
