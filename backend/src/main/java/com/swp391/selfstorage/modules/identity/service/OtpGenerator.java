package com.swp391.selfstorage.modules.identity.service;

import java.security.SecureRandom;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class OtpGenerator {
  private static final int OTP_RANGE = 1_000_000;
  private final SecureRandom random = new SecureRandom();

  public String generate() {
    return String.format(Locale.ROOT, "%06d", random.nextInt(OTP_RANGE));
  }
}
