package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.modules.identity.dto.RegisterRequest;
import com.swp391.selfstorage.modules.identity.service.*;
import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RegistrationValidatorTest {
  private final RegistrationAccountService accounts = mock(RegistrationAccountService.class);
  private final RegistrationValidator validator = new RegistrationValidator(accounts, new PasswordPolicy(72),
      Clock.fixed(Instant.parse("2026-10-19T00:00:00Z"), ZoneOffset.UTC));

  private RegisterRequest fixture() {
    RegisterRequest r = new RegisterRequest();
    r.setName(" Khach Thu Nghiem ");
    r.setUsername(" Synthetic_User ");
    r.setEmail(" Auth@Example.invalid ");
    r.setPhone("09 " + "1".repeat(4) + "-" + "1".repeat(4));
    r.setCccd("001 " + "2".repeat(9));
    r.setFacilityCode("HN-CG");
    r.setPassword(" " + UUID.randomUUID() + " ");
    r.setConfirmPassword(r.getPassword());
    return r;
  }

  @Test void validatesRawCredentialAndPrechecksCanonicalIdentity() {
    RegisterRequest r = fixture();
    String raw = r.getPassword();
    assertDoesNotThrow(() -> validator.validateRegistrationData(r));
    assertEquals(raw, r.getPassword());
    verify(accounts).requireAvailable("synthetic_user", "auth@example.invalid", "09" + "1".repeat(8));
  }

  @Test void facilitySelectionIsOptional() {
    RegisterRequest r = fixture();
    r.setFacilityCode(" ");
    assertDoesNotThrow(() -> validator.validateRegistrationData(r));
    verify(accounts).requireAvailable("synthetic_user", "auth@example.invalid", "09" + "1".repeat(8));
  }

  @Test void confirmationMismatchStopsBeforeDatabaseChecks() {
    RegisterRequest r = fixture();
    r.setConfirmPassword(r.getPassword().trim());
    assertThrows(IllegalArgumentException.class, () -> validator.validateRegistrationData(r));
    verifyNoInteractions(accounts);
  }

  @Test void jacksonKeepsRawInputButNeverSerializesCredentialFields() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RegisterRequest original = fixture();
    String payload = mapper.writeValueAsString(java.util.Map.of(
        "password", original.getPassword(), "confirmPassword", original.getConfirmPassword()));
    RegisterRequest decoded = mapper.readValue(payload, RegisterRequest.class);
    assertEquals(original.getPassword(), decoded.getPassword());
    assertEquals(original.getConfirmPassword(), decoded.getConfirmPassword());
    var serialized = mapper.readTree(mapper.writeValueAsString(decoded));
    assertFalse(serialized.has("password"));
    assertFalse(serialized.has("confirmPassword"));
  }
}
