package com.splittrip.auth.api;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordValidatorTest {

    private final PasswordValidator validator = new PasswordValidator();

    @Test
    void acceptsAValidPassword() {
        assertTrue(validator.isValid("correct-horse-battery-staple", null));
    }

    @Test
    void rejectsPasswordsShorterThanEightCharacters() {
        assertFalse(validator.isValid("short", null));
    }

    @Test
    void rejectsPasswordsLongerThanSeventyTwoUtf8Bytes() {
        assertFalse(validator.isValid("ş".repeat(37), null));
    }
}
