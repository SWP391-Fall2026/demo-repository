package com.swp391.selfstorage.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
  private final SecretKey key;
  private final long expiration;
  private final Clock clock;

  public JwtUtil(@Value("${jwt.secret}") String secret,
      @Value("${jwt.expiration:86400000}") long expiration, Clock clock) {
    if (expiration != Duration.ofHours(24).toMillis()) {
      throw new IllegalArgumentException("JWT lifetime must be 24 hours (BR-001)");
    }
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiration = expiration;
    this.clock = clock;
  }

  public String generateToken(String username, String role, String facilityCode) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", role);
    if (facilityCode != null) claims.put("facilityCode", facilityCode);
    Instant issued = clock.instant();
    return Jwts.builder().subject(username).claims(claims)
        .issuedAt(Date.from(issued)).expiration(Date.from(issued.plusMillis(expiration)))
        .signWith(key).compact();
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public String extractRole(String token) {
    return extractClaim(token, c -> (String) c.get("role"));
  }

  public Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  public <T> T extractClaim(String token, Function<Claims, T> resolver) {
    return resolver.apply(Jwts.parser().verifyWith(key)
        .clock(() -> Date.from(clock.instant())).build().parseSignedClaims(token).getPayload());
  }

  public boolean isTokenExpired(String token) {
    try {
      return !clock.instant().isBefore(extractExpiration(token).toInstant());
    } catch (RuntimeException ex) {
      return true;
    }
  }

  public boolean validateToken(String token, String username) {
    try {
      return username.equalsIgnoreCase(extractUsername(token)) && !isTokenExpired(token);
    } catch (RuntimeException ex) {
      return false;
    }
  }
}
