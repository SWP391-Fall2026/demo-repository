package com.swp391.selfstorage.modules.identity.service;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.identity.dto.*;
import com.swp391.selfstorage.modules.identity.entity.LoginHistory;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.LoginHistoryRepository;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.security.JwtUtil;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private static final Logger log = LoggerFactory.getLogger(AuthService.class);
  private static final Duration OTP_LIFETIME = Duration.ofMinutes(5);
  private static final Duration RESEND_DELAY = Duration.ofSeconds(30);
  private static final int MAX_ATTEMPTS = 5;
  private final UserRepository users;
  private final LoginHistoryRepository history;
  private final JwtUtil jwt;
  private final PasswordEncoder encoder;
  private final PasswordPolicy passwords;
  private final RegistrationValidator validator;
  private final RegistrationAccountService accounts;
  private final OtpDeliveryService delivery;
  private final Clock clock;
  private final OtpGenerator otpGenerator;
  // One challenge per email, single-process storage. Persisted User holds only BCrypt.
  private final Map<String, PendingOtpData> pending = new ConcurrentHashMap<>();

  public AuthService(UserRepository users, LoginHistoryRepository history, JwtUtil jwt,
      PasswordEncoder encoder, PasswordPolicy passwords, RegistrationValidator validator,
      RegistrationAccountService accounts, OtpDeliveryService delivery, OtpGenerator otpGenerator,
      Clock clock) {
    this.users = users;
    this.history = history;
    this.jwt = jwt;
    this.encoder = encoder;
    this.passwords = passwords;
    this.validator = validator;
    this.accounts = accounts;
    this.delivery = delivery;
    this.otpGenerator = otpGenerator;
    this.clock = clock;
  }

  public ApiResponse<UserDto> login(LoginRequest request, String ip, String device) {
    if (request == null || request.getUsername() == null || request.getUsername().isBlank()
        || !passwords.canAuthenticate(request.getPassword())) {
      throw invalidLogin();
    }
    String identity = cleanIdentity(request.getUsername());
    User user = users.findByUsernameIgnoreCaseOrEmailIgnoreCase(identity, identity).orElse(null);
    if (user == null || !encoder.matches(request.getPassword(), user.getPassword())) {
      recordLogin(user == null ? identity : user.getUsername(),
          user == null ? "Khách vãng lai" : user.getName(),
          user == null ? "UNKNOWN" : user.getRole(), ip, device, "FAILED");
      throw invalidLogin();
    }
    if (!"ACTIVE".equalsIgnoreCase(user.getStatus())
        || user.getRole() == null
        || !Set.of("CUSTOMER", "STAFF", "FMANAGER", "FACILITY_MANAGER",
            "OPS_MGR", "OPS_MANAGER", "ADMIN", "SYSTEM_ADMIN").contains(user.getRole())
        || (Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(user.getRole())
            && (user.getFacilityCode() == null || user.getFacilityCode().isBlank()))) {
      recordLogin(user.getUsername(), user.getName(), user.getRole(), ip, device, "BLOCKED");
      throw invalidLogin();
    }
    recordLogin(user.getUsername(), user.getName(), user.getRole(), ip, device, "SUCCESS");
    return ApiResponse.ok("Đăng nhập thành công", new UserDto(user),
        jwt.generateToken(user.getUsername(), user.getRole(), user.getFacilityCode()));
  }

  public ApiResponse<OtpChallengeResponse> generateAndSendOtp(RegisterRequest request) {
    validator.validateRegistrationData(request);
    var facility = accounts.requireActiveFacility(request.getFacilityCode());
    purgeExpired();
    if (pending.size() >= 1000) {
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Hệ thống xác minh đang bận");
    }
    String email = cleanIdentity(request.getEmail());
    // Encode the exact validated input. Raw passwords never enter the pending map.
    User candidate = new User();
    candidate.setId("USR-" + UUID.randomUUID());
    candidate.setName(request.getName().trim());
    candidate.setUsername(cleanIdentity(request.getUsername()));
    candidate.setEmail(email);
    candidate.setPhone(request.getPhone().replaceAll("[\\s.-]", ""));
    candidate.setCccd(request.getCccd().replaceAll("\\s", ""));
    candidate.setPassword(encoder.encode(request.getPassword()));
    candidate.setRole("CUSTOMER");
    candidate.setRoleTitle("Khách hàng thuê kho");
    candidate.setStatus("ACTIVE");
    candidate.setFacility(facility == null ? null : facility.getName());
    candidate.setFacilityCode(facility == null ? null : facility.getCode());
    PendingOtpData challenge = pending.compute(email, (key, previous) -> {
      Instant now = clock.instant();
      if (previous != null && now.isBefore(previous.resendAt)) throw cooldown();
      String code = otpGenerator.generate();
      delivery.send(email, code);
      return new PendingOtpData(candidate, code, now.plus(OTP_LIFETIME),
          now.plus(RESEND_DELAY));
    });
    return ApiResponse.ok("Vui lòng xác minh mã để hoàn tất đăng ký", response(challenge));
  }

  public ApiResponse<RegistrationResult> verifyOtpAndRegister(String email, String code, String ip) {
    if (email == null || code == null || !code.matches("[0-9]{6}")) {
      throw new IllegalArgumentException("Email hoặc mã xác minh không hợp lệ");
    }
    purgeExpired();
    AtomicReference<User> created = new AtomicReference<>();
    String identity = cleanIdentity(email);
    pending.compute(identity, (key, challenge) -> {
      requireChallenge(challenge);
      if (challenge.failures >= MAX_ATTEMPTS) throw cooldown();
      if (!MessageDigest.isEqual(challenge.code.getBytes(StandardCharsets.UTF_8),
          code.getBytes(StandardCharsets.UTF_8))) {
        challenge.failures++;
        throw new IllegalArgumentException("Mã xác minh không đúng");
      }
      challenge.candidate.setCreatedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
      // The separate service returns only after the registration transaction commits.
      created.set(accounts.create(challenge.candidate));
      return null;
    });
    return ApiResponse.ok("Đăng ký thành công. Vui lòng đăng nhập.",
        new RegistrationResult(true, created.get().getEmail()));
  }

  public ApiResponse<OtpChallengeResponse> resendOtp(String email) {
    if (email == null || email.isBlank()) throw new IllegalArgumentException("Thiếu email");
    purgeExpired();
    PendingOtpData challenge = pending.compute(cleanIdentity(email), (key, current) -> {
      requireChallenge(current);
      if (current.failures >= MAX_ATTEMPTS) throw cooldown();
      Instant now = clock.instant();
      if (now.isBefore(current.resendAt)) throw cooldown();
      // Preserve the existing code and original absolute expiry; no silent TTL extension.
      delivery.send(current.candidate.getEmail(), current.code);
      current.resendAt = now.plus(RESEND_DELAY);
      return current;
    });
    return ApiResponse.ok("Đã gửi lại mã xác minh", response(challenge));
  }

  private OtpChallengeResponse response(PendingOtpData challenge) {
    return new OtpChallengeResponse(challenge.candidate.getEmail(), challenge.expiresAt,
        challenge.resendAt, "email");
  }

  private void requireChallenge(PendingOtpData challenge) {
    if (challenge == null || !clock.instant().isBefore(challenge.expiresAt)) {
      throw new IllegalArgumentException("Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.");
    }
  }

  private void purgeExpired() {
    Instant now = clock.instant();
    pending.entrySet().removeIf(e -> !now.isBefore(e.getValue().expiresAt));
  }

  private static String cleanIdentity(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private static ResponseStatusException invalidLogin() {
    return new ResponseStatusException(HttpStatus.UNAUTHORIZED,
        "Thông tin đăng nhập không hợp lệ");
  }

  private static ResponseStatusException cooldown() {
    return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
        "Vui lòng đợi trước khi thử lại hoặc yêu cầu mã xác minh mới");
  }

  private void recordLogin(String username, String name, String role,
      String ip, String device, String status) {
    try {
      Instant eventTime = clock.instant();
      LocalDateTime now = LocalDateTime.ofInstant(eventTime, ZoneOffset.UTC);
      LoginHistory entry = new LoginHistory(username, name, role, eventTime.toString(),
          ip, device == null ? "Web" : device.substring(0, Math.min(device.length(), 255)), status);
      entry.setCreatedAt(now);
      history.save(entry);
    } catch (Exception ex) {
      // No exception/provider text, credentials or identifying request fields in logs.
      log.warn("Login history could not be persisted");
    }
  }

  private static final class PendingOtpData {
    final User candidate;
    final String code;
    final Instant expiresAt;
    Instant resendAt;
    int failures;
    PendingOtpData(User candidate, String code, Instant expiresAt, Instant resendAt) {
      this.candidate = candidate;
      this.code = code;
      this.expiresAt = expiresAt;
      this.resendAt = resendAt;
    }
  }
}
