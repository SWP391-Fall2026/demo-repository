package com.swp391.selfstorage.modules.identity.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.identity.dto.*;
import com.swp391.selfstorage.modules.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService auth;

  public AuthController(AuthService a) {
    auth = a;
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
    var pending = auth.getPendingOtp(d.get("email"));
    if (pending == null) throw new IllegalArgumentException(
      "Phiên xác minh đã hết hạn"
    );
    return ApiResponse.ok(pending);
  }
}
