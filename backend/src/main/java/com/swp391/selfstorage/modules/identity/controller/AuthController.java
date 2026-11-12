package com.swp391.selfstorage.modules.identity.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.identity.dto.*;
import com.swp391.selfstorage.modules.identity.service.AuthService;
import com.swp391.selfstorage.security.JwtUtil;
import com.swp391.selfstorage.security.TokenRevocationService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService auth;
  private final com.swp391.selfstorage.common.security.ActorContext actor;
  private final JwtUtil jwtUtil;
  private final TokenRevocationService revocation;
  private final AuditLogService audit;

  public AuthController(
    AuthService a,
    com.swp391.selfstorage.common.security.ActorContext actor,
    JwtUtil jwtUtil,
    TokenRevocationService revocation,
    AuditLogService audit
  ) {
    auth = a;
    this.actor = actor;
    this.jwtUtil = jwtUtil;
    this.revocation = revocation;
    this.audit = audit;
  }

  @PostMapping("/login")
  public ApiResponse<?> login(
    @RequestBody LoginRequest d,
    HttpServletRequest r
  ) {
    return auth.login(
      d,
      r.getRemoteAddr(),
      Objects.toString(r.getHeader("User-Agent"), "Web")
    );
  }

  @PostMapping({ "/send-otp", "/register" })
  public ApiResponse<?> register(@RequestBody RegisterRequest d) {
    return auth.generateAndSendOtp(d);
  }

  @PostMapping("/verify-otp")
  public ApiResponse<?> verify(
    @RequestBody VerifyOtpRequest d,
    HttpServletRequest r
  ) {
    return auth.verifyOtpAndRegister(
      d.getEmail(),
      d.getCode(),
      r.getRemoteAddr()
    );
  }

  @PostMapping("/resend-otp")
  public ApiResponse<?> resend(@RequestBody Map<String, String> d) {
    return auth.resendOtp(d.get("email"));
  }
  @GetMapping("/me")
  public ApiResponse<UserDto> me() {
    return ApiResponse.ok(new UserDto(actor.current()));
  }

  @PostMapping("/logout")
  public ApiResponse<?> logout(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      String jwt = authHeader.substring(7);
      try {
        Date expiresAt = jwtUtil.extractExpiration(jwt);
        if (expiresAt != null) {
          revocation.revoke(jwt, expiresAt.toInstant());
        }
      } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignore) {
        // Invalid or already expired token needs no revocation entry.
      }
    }
    try {
      audit.record("LOGOUT", actor.current().getId(), "Đăng xuất phiên JWT");
    } catch (RuntimeException ignore) {
      // Best-effort audit; never block logout response.
    }
    return ApiResponse.ok("Đăng xuất thành công", Map.of("loggedOut", true));
  }
}
