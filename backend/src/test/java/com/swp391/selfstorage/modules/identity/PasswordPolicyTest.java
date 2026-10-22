package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import com.swp391.selfstorage.modules.identity.service.PasswordPolicy;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PasswordPolicyTest {
  private final PasswordPolicy policy = new PasswordPolicy(72);

  @Test void preservesEdgesForValidationAndComparesConfirmationExactly() {
    String raw = " " + UUID.randomUUID() + " ";
    assertDoesNotThrow(() -> policy.validateRegistration(raw, raw));
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration(raw, raw.trim()));
    assertDoesNotThrow(() -> policy.validateRegistration(" abcd ", " abcd "));
  }

  @Test void rejectsBlankShortOrMissingConfirmation() {
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration(" ".repeat(6), " ".repeat(6)));
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration("a".repeat(5), "a".repeat(5)));
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration(UUID.randomUUID().toString(), null));
  }

  @Test void countsUtf8BytesRatherThanCharacters() {
    String malformed = String.valueOf((char) 0xD800) + "a".repeat(6);
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration(malformed, malformed));
    assertDoesNotThrow(() -> policy.validateRegistration("đ".repeat(36), "đ".repeat(36)));
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration("đ".repeat(37), "đ".repeat(37)));
    assertDoesNotThrow(() -> policy.validateRegistration("a".repeat(72), "a".repeat(72)));
    assertThrows(IllegalArgumentException.class, () -> policy.validateRegistration("a".repeat(73), "a".repeat(73)));
  }

  @Test void configurationCannotSilentlyChangeTheApprovedByteLimit() {
    assertThrows(IllegalArgumentException.class, () -> new PasswordPolicy(0));
    assertThrows(IllegalArgumentException.class, () -> new PasswordPolicy(73));
  }

  @Test void loginDoesNotApplyRegistrationMinimumToExistingAccounts() {
    assertTrue(policy.canAuthenticate(" " + UUID.randomUUID() + " "));
    assertTrue(policy.canAuthenticate("x"));
    assertFalse(policy.canAuthenticate(" ".repeat(6)));
    assertFalse(policy.canAuthenticate("a".repeat(73)));
  }
}
