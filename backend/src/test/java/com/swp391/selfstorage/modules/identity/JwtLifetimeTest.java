package com.swp391.selfstorage.modules.identity;

import static org.junit.jupiter.api.Assertions.*;
import com.swp391.selfstorage.security.JwtUtil;
import java.security.SecureRandom;
import java.time.*;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class JwtLifetimeTest {
  @Test void lifetimeIsExactly24HoursAndExpiresAtBoundary() {
    byte[] bytes = new byte[64];
    new SecureRandom().nextBytes(bytes);
    String ephemeralKey = Base64.getEncoder().encodeToString(bytes);
    Instant issued = Instant.parse("2026-10-19T00:00:00Z");
    Clock start = Clock.fixed(issued, ZoneOffset.UTC);
    JwtUtil jwt = new JwtUtil(ephemeralKey, 86400000, start);
    String token = jwt.generateToken("synthetic_user", "CUSTOMER", null);
    assertEquals(issued.plusSeconds(86400), jwt.extractExpiration(token).toInstant());
    assertTrue(jwt.validateToken(token, "synthetic_user"));
    JwtUtil before = new JwtUtil(ephemeralKey, 86400000,
        Clock.fixed(issued.plusSeconds(86399), ZoneOffset.UTC));
    assertTrue(before.validateToken(token, "synthetic_user"));
    JwtUtil at = new JwtUtil(ephemeralKey, 86400000,
        Clock.fixed(issued.plusSeconds(86400), ZoneOffset.UTC));
    assertFalse(at.validateToken(token, "synthetic_user"));
    JwtUtil after = new JwtUtil(ephemeralKey, 86400000,
        Clock.fixed(issued.plusSeconds(86401), ZoneOffset.UTC));
    assertFalse(after.validateToken(token, "synthetic_user"));
  }
}
