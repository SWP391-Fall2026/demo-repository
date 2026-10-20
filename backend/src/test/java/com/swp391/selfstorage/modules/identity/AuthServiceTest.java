package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.swp391.selfstorage.modules.identity.dto.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.identity.repository.*;
import com.swp391.selfstorage.modules.identity.service.*;
import com.swp391.selfstorage.security.JwtUtil;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

/** Isolated service tests: no Spring context, DB, filesystem, SMTP or HTTP. */
class AuthServiceTest {
  private final UserRepository users = mock(UserRepository.class);
  private final LoginHistoryRepository history = mock(LoginHistoryRepository.class);
  private final JwtUtil jwt = mock(JwtUtil.class);
  private final PasswordEncoder encoder = mock(PasswordEncoder.class);
  private final RegistrationValidator validator = mock(RegistrationValidator.class);
  private final RegistrationAccountService accounts = mock(RegistrationAccountService.class);
  private final OtpDeliveryService delivery = mock(OtpDeliveryService.class);
  private final OtpGenerator otpGenerator = new OtpGenerator();
  private final MutableClock clock = new MutableClock();
  private String lastOtpCode;
  private AuthService auth;

  @BeforeEach void setUp() {
    auth = service(encoder);
  }

  private AuthService service(PasswordEncoder passwordEncoder) {
    return new AuthService(users, history, jwt, passwordEncoder, new PasswordPolicy(72),
        validator, accounts, delivery, otpGenerator, clock);
  }

  private RegisterRequest registration() {
    RegisterRequest request = new RegisterRequest();
    request.setName("Khach Thu Nghiem");
    request.setUsername("u" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    request.setEmail(request.getUsername() + "@example.invalid");
    request.setPhone("09" + "1".repeat(8));
    request.setCccd("001" + "2".repeat(9));
    request.setPassword(" " + UUID.randomUUID() + " ");
    request.setConfirmPassword(request.getPassword());
    request.setFacilityCode("HN-CG");
    return request;
  }

  private OtpChallengeResponse challenge(RegisterRequest request) {
    when(encoder.encode(anyString())).thenReturn("opaque-fixture");
    Facility facility = new Facility();
    facility.setCode(request.getFacilityCode());
    facility.setName("Hà Nội - Cầu Giấy");
    facility.setStatus("ACTIVE");
    when(accounts.requireActiveFacility(anyString())).thenReturn(facility);
    doAnswer(invocation -> {
      lastOtpCode = invocation.getArgument(1);
      return null;
    }).when(delivery).send(anyString(), anyString());
    return auth.generateAndSendOtp(request).getData();
  }

  @Test void registrationHashesRawPasswordAndDoesNotWriteUserBeforeOtp() {
    RegisterRequest request = registration();
    OtpChallengeResponse challenge = challenge(request);
    verify(encoder).encode(request.getPassword());
    verify(accounts).requireActiveFacility("HN-CG");
    verifyNoMoreInteractions(accounts);
    verifyNoInteractions(history, jwt);
    assertEquals(clock.instant().plusSeconds(300), challenge.expiresAt());
    assertEquals("email", challenge.delivery());
    assertTrue(lastOtpCode.matches("[0-9]{6}"));
  }

  @Test void verificationCreatesCustomerOnceWithoutJwtOrUntrustedFacility() {
    RegisterRequest request = registration();
    OtpChallengeResponse challenge = challenge(request);
    when(accounts.create(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    var result = auth.verifyOtpAndRegister(challenge.email(), lastOtpCode, "test");
    assertTrue(result.getData().registered());
    assertNull(result.getToken());
    ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
    verify(accounts).create(saved.capture());
    assertEquals("CUSTOMER", saved.getValue().getRole());
    assertEquals("ACTIVE", saved.getValue().getStatus());
    assertEquals("HN-CG", saved.getValue().getFacilityCode());
    assertEquals("Hà Nội - Cầu Giấy", saved.getValue().getFacility());
    assertEquals("opaque-fixture", saved.getValue().getPassword());
    assertThrows(IllegalArgumentException.class,
        () -> auth.verifyOtpAndRegister(challenge.email(), lastOtpCode, "test"));
    verify(accounts, times(1)).create(any(User.class));
    verifyNoInteractions(history, jwt);
  }

  @Test void emailDeliveryDoesNotReturnOtp() {
    OtpChallengeResponse challenge = challenge(registration());
    assertEquals("email", challenge.delivery());
    ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
    verify(delivery).send(eq(challenge.email()), code.capture());
    assertTrue(code.getValue().matches("[0-9]{6}"));
  }

  @Test void expiredOtpCannotCreateAccountAtExactDeadline() {
    OtpChallengeResponse challenge = challenge(registration());
    clock.advance(Duration.ofMinutes(5));
    assertThrows(IllegalArgumentException.class,
        () -> auth.verifyOtpAndRegister(challenge.email(), lastOtpCode, "test"));
    verifyNoInteractions(accounts);
  }

  @Test void resendPreservesCodeAndOriginalExpiryAndEnforcesCooldown() {
    OtpChallengeResponse first = challenge(registration());
    assertEquals(429, assertThrows(ResponseStatusException.class,
        () -> auth.resendOtp(first.email())).getStatusCode().value());
    clock.advance(Duration.ofSeconds(30));
    OtpChallengeResponse next = auth.resendOtp(first.email()).getData();
    assertEquals(first.expiresAt(), next.expiresAt());
    verify(delivery, times(2)).send(eq(first.email()), anyString());
  }

  @Test void repeatedWrongOtpLocksChallengeWithoutAccountWrites() {
    OtpChallengeResponse challenge = challenge(registration());
    String wrong = (lastOtpCode.charAt(0) == '0' ? "1" : "0") + lastOtpCode.substring(1);
    for (int attempt = 0; attempt < 5; attempt++) {
      assertThrows(IllegalArgumentException.class,
          () -> auth.verifyOtpAndRegister(challenge.email(), wrong, "test"));
    }
    assertEquals(429, assertThrows(ResponseStatusException.class,
        () -> auth.verifyOtpAndRegister(challenge.email(), lastOtpCode, "test"))
        .getStatusCode().value());
    verifyNoInteractions(accounts);
  }

  @Test void twoVerificationsConsumeSingleChallengeOnlyOnce() throws Exception {
    OtpChallengeResponse challenge = challenge(registration());
    when(accounts.create(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    CountDownLatch start = new CountDownLatch(1);
    Callable<Boolean> call = () -> {
      start.await();
      try {
        auth.verifyOtpAndRegister(challenge.email(), lastOtpCode, "test");
        return true;
      } catch (IllegalArgumentException ex) {
        return false;
      }
    };
    try (var pool = Executors.newFixedThreadPool(2)) {
      Future<Boolean> first = pool.submit(call);
      Future<Boolean> second = pool.submit(call);
      start.countDown();
      assertNotEquals(first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS));
    }
    verify(accounts, times(1)).create(any(User.class));
  }

  @Test void inactiveStatusesOrUnassignedStaffCannotLogIn() {
    User user = new User();
    user.setUsername("synthetic_user");
    user.setName("Khach Thu Nghiem");
    user.setRole("CUSTOMER");
    user.setPassword("opaque-fixture");
    String raw = UUID.randomUUID().toString();
    when(users.findByUsernameIgnoreCaseOrEmailIgnoreCase(anyString(), anyString())).thenReturn(Optional.of(user));
    when(encoder.matches(raw, user.getPassword())).thenReturn(true);
    for (String status : Arrays.asList("LOCKED", "DISABLED", "PENDING", null)) {
      user.setStatus(status);
      assertEquals(401, assertThrows(ResponseStatusException.class,
          () -> auth.login(new LoginRequest("synthetic_user", raw), "test", "test"))
          .getStatusCode().value());
    }
    user.setStatus("ACTIVE");
    user.setRole("STAFF");
    user.setFacilityCode(null);
    assertEquals(401, assertThrows(ResponseStatusException.class,
        () -> auth.login(new LoginRequest("synthetic_user", raw), "test", "test"))
        .getStatusCode().value());
    verifyNoInteractions(jwt);
  }

  @Test void bcryptLoginAcceptsOriginalEdgesAndRejectsTrimmedVariant() {
    PasswordEncoder bcrypt = new BCryptPasswordEncoder();
    auth = service(bcrypt);
    String raw = " " + UUID.randomUUID() + " ";
    User user = new User();
    user.setUsername("synthetic_user");
    user.setRole("CUSTOMER");
    user.setName("Khach Thu Nghiem");
    user.setStatus("ACTIVE");
    user.setPassword(bcrypt.encode(raw));
    when(users.findByUsernameIgnoreCaseOrEmailIgnoreCase(anyString(), anyString())).thenReturn(Optional.of(user));
    when(jwt.generateToken(anyString(), anyString(), isNull())).thenReturn("runtime-token-placeholder");
    assertNotNull(auth.login(new LoginRequest("synthetic_user", raw), "test", "test").getToken());
    assertEquals(401, assertThrows(ResponseStatusException.class,
        () -> auth.login(new LoginRequest("synthetic_user", raw.trim()), "test", "test"))
        .getStatusCode().value());
  }

  @Test void allFiveRolesReceiveCanonicalProfilesWithAssignedStaffFacility() {
    String raw = UUID.randomUUID().toString();
    when(encoder.matches(eq(raw), anyString())).thenReturn(true);
    when(jwt.generateToken(anyString(), anyString(), nullable(String.class))).thenReturn("runtime-token-placeholder");
    String[][] roles = {
      {"CUSTOMER", "CUSTOMER"}, {"STAFF", "STAFF"},
      {"FACILITY_MANAGER", "FMANAGER"}, {"OPS_MANAGER", "OPS_MGR"}, {"SYSTEM_ADMIN", "ADMIN"}
    };
    for (String[] role : roles) {
      User user = new User();
      user.setId("synthetic-" + role[1]);
      user.setName("Khach Thu Nghiem");
      user.setUsername("synthetic_user");
      user.setEmail("auth@example.invalid");
      user.setRole(role[0]);
      user.setStatus("ACTIVE");
      user.setPassword("opaque-fixture");
      if ("STAFF".equals(role[1]) || "FMANAGER".equals(role[1])) user.setFacilityCode("FACILITY-TEST");
      when(users.findByUsernameIgnoreCaseOrEmailIgnoreCase(anyString(), anyString())).thenReturn(Optional.of(user));
      assertEquals(role[1], auth.login(new LoginRequest("synthetic_user", raw), "test", "test").getData().getRole());
    }
  }

  private static class MutableClock extends Clock {
    private Instant now = Instant.parse("2026-10-19T00:00:00Z");
    public ZoneId getZone() { return ZoneOffset.UTC; }
    public Clock withZone(ZoneId zone) { return this; }
    public Instant instant() { return now; }
    void advance(Duration duration) { now = now.plus(duration); }
  }
}
