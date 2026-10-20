package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.LoginHistoryRepository;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.identity.service.UserAdminService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserAdminServiceTest {
  private final UserRepository users = mock(UserRepository.class);
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final PasswordEncoder encoder = mock(PasswordEncoder.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final UserAdminService service = new UserAdminService(users,
      mock(LoginHistoryRepository.class), facilities, actor, encoder, audit);

  private Map<String, Object> account(String role, boolean withFacility) {
    var data = new java.util.HashMap<String, Object>();
    data.put("name", "Demo Employee");
    data.put("username", "demo_employee");
    data.put("email", "employee@storage.local");
    data.put("phone", "0912345678");
    data.put("cccd", "001123456789");
    data.put("password", "temporary-password");
    data.put("role", role);
    if (withFacility) data.put("facilityCode", "HN-CG");
    return data;
  }

  @Test void createsFacilityStaffWithValidatedFacilityAndHashedTemporaryPassword() {
    when(users.existsByUsernameIgnoreCase("demo_employee")).thenReturn(false);
    when(users.existsByEmailIgnoreCase("employee@storage.local")).thenReturn(false);
    when(users.existsByNormalizedPhone("0912345678")).thenReturn(false);
    when(users.existsByCccd("001123456789")).thenReturn(false);
    when(encoder.encode("temporary-password")).thenReturn("bcrypt-hash");
    Facility facility = new Facility();
    facility.setCode("HN-CG");
    facility.setName("Cầu Giấy");
    when(facilities.findById("HN-CG")).thenReturn(java.util.Optional.of(facility));
    when(users.existsOtherFacilityManager(eq("HN-CG"), any())).thenReturn(false);
    when(users.saveAndFlush(any(User.class))).thenAnswer(call -> call.getArgument(0));

    var created = service.create(account("STAFF", true));

    assertEquals("STAFF", created.getRole());
    assertEquals("HN-CG", created.getFacilityCode());
    verify(encoder).encode("temporary-password");
    verify(users).saveAndFlush(argThat(user -> "bcrypt-hash".equals(user.getPassword())
        && "0912345678".equals(user.getPhone()) && "001123456789".equals(user.getCccd())));
  }

  @Test void createsAdminWithoutFacility() {
    when(users.existsByUsernameIgnoreCase("demo_employee")).thenReturn(false);
    when(users.existsByEmailIgnoreCase("employee@storage.local")).thenReturn(false);
    when(users.existsByNormalizedPhone("0912345678")).thenReturn(false);
    when(users.existsByCccd("001123456789")).thenReturn(false);
    when(encoder.encode("temporary-password")).thenReturn("bcrypt-hash");
    when(users.saveAndFlush(any(User.class))).thenAnswer(call -> call.getArgument(0));

    var created = service.create(account("ADMIN", false));

    assertEquals("ADMIN", created.getRole());
    assertNull(created.getFacilityCode());
    assertNull(created.getFacility());
    verifyNoInteractions(facilities);
  }

  @Test void rejectsSecondFacilityManagerAtSameFacility() {
    when(users.existsByUsernameIgnoreCase("demo_employee")).thenReturn(false);
    when(users.existsByEmailIgnoreCase("employee@storage.local")).thenReturn(false);
    when(users.existsByNormalizedPhone("0912345678")).thenReturn(false);
    when(users.existsByCccd("001123456789")).thenReturn(false);
    Facility facility = new Facility();
    facility.setCode("HN-CG");
    facility.setName("Cầu Giấy");
    when(facilities.findById("HN-CG")).thenReturn(java.util.Optional.of(facility));
    when(users.existsOtherFacilityManager(eq("HN-CG"), any())).thenReturn(true);

    var error = assertThrows(org.springframework.web.server.ResponseStatusException.class,
        () -> service.create(account("FMANAGER", true)));

    assertEquals(409, error.getStatusCode().value());
    verify(users, never()).saveAndFlush(any());
  }
}
