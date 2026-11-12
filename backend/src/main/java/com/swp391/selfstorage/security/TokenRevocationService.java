package com.swp391.selfstorage.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Tracks revoked bearer tokens by SHA-256 digest until their JWT expiration instant.
 * Raw tokens are never retained or logged.
 */
@Service
public class TokenRevocationService {

  private final Map<String, Instant> revokedUntil = new ConcurrentHashMap<>();
  private final Clock clock;

  public TokenRevocationService(Clock clock) {
    this.clock = clock;
  }

  public void revoke(String token, Instant expiresAt) {
    if (token == null || token.isBlank() || expiresAt == null) return;
    Instant now = clock.instant();
    purgeExpired(now);
    if (expiresAt.isAfter(now)) {
      revokedUntil.put(fingerprint(token), expiresAt);
    }
  }

  public boolean isRevoked(String token) {
    if (token == null || token.isBlank()) return false;
    String key = fingerprint(token);
    Instant until = revokedUntil.get(key);
    if (until == null) return false;
    if (!clock.instant().isBefore(until)) {
      revokedUntil.remove(key, until);
      return false;
    }
    return true;
  }

  private void purgeExpired(Instant now) {
    revokedUntil.entrySet().removeIf(entry -> !now.isBefore(entry.getValue()));
  }

  private static String fingerprint(String token) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256")
          .digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }
}

