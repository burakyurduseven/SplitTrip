package com.splittrip.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.splittrip.user.domain.UserAccount;
import com.splittrip.user.infrastructure.UserAccountRepository;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserAccountRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RegistrationService registrationService;

    @Test
    void normalizesEmailAndHashesPassword() {
        when(userRepository.existsByEmail("person@example.com")).thenReturn(false);
        when(passwordEncoder.encode("strong-password")).thenReturn("{bcrypt}hash");
        when(userRepository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = registrationService.register(
                new RegisterUserCommand("  Ada Lovelace  ", "  PERSON@Example.COM ", "strong-password"));

        var userCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        var savedUser = userCaptor.getValue();

        assertEquals("Ada Lovelace", result.displayName());
        assertEquals("person@example.com", result.email());
        assertEquals("{bcrypt}hash", savedUser.getPasswordHash());
    }

    @Test
    void rejectsAnEmailThatAlreadyExists() {
        when(userRepository.existsByEmail("person@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyInUseException.class, () -> registrationService.register(
                new RegisterUserCommand("Ada", "person@example.com", "strong-password")));

        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).saveAndFlush(any());
    }
}
