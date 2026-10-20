package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.identity.service.RegistrationAccountService;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class RegistrationAccountServiceTest {
  @Test void createsCustomerWithoutFacilityWhenSelectionWasSkipped() {
    UserRepository users = mock(UserRepository.class);
    FacilityRepository facilities = mock(FacilityRepository.class);
    RegistrationAccountService accounts = new RegistrationAccountService(users, facilities, true);
    User candidate = new User();
    candidate.setUsername("synthetic_user");
    candidate.setEmail("auth@example.invalid");
    candidate.setPhone("09" + "1".repeat(8));
    candidate.setFacilityCode(" ");
    when(users.saveAndFlush(candidate)).thenReturn(candidate);

    User saved = accounts.create(candidate);

    assertSame(candidate, saved);
    assertNull(saved.getFacilityCode());
    assertNull(saved.getFacility());
    verify(users).saveAndFlush(candidate);
    verifyNoInteractions(facilities);
  }

  @Test void unreviewedSchemaRejectsBeforeAnyDatabaseOperation() {
    UserRepository users = mock(UserRepository.class);
    RegistrationAccountService accounts = new RegistrationAccountService(users, mock(FacilityRepository.class), false);
    assertEquals(503, assertThrows(ResponseStatusException.class,
        () -> accounts.requireAvailable("synthetic_user", "auth@example.invalid", "09" + "1".repeat(8)))
        .getStatusCode().value());
    verifyNoInteractions(users);
  }

  @Test void duplicatePhoneDoesNotSaveAccount() {
    UserRepository users = mock(UserRepository.class);
    FacilityRepository facilities = mock(FacilityRepository.class);
    RegistrationAccountService accounts = new RegistrationAccountService(users, facilities, true);
    User candidate = new User();
    candidate.setUsername("synthetic_user");
    candidate.setEmail("auth@example.invalid");
    candidate.setPhone("09" + "1".repeat(8));
    candidate.setFacilityCode("HN-CG");
    Facility facility = new Facility();
    facility.setCode("HN-CG");
    facility.setName("Hà Nội - Cầu Giấy");
    facility.setStatus("ACTIVE");
    when(facilities.findById("HN-CG")).thenReturn(java.util.Optional.of(facility));
    when(users.existsByNormalizedPhone(candidate.getPhone())).thenReturn(true);
    assertThrows(IllegalArgumentException.class, () -> accounts.create(candidate));
    verify(users, never()).saveAndFlush(any());
  }

}
