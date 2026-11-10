package com.swp391.selfstorage.common.util;

import java.security.SecureRandom;
import java.util.Objects;

/**
 * Generates short, readable entity identifiers with a domain prefix (e.g. RSV-7K3P9M).
 * Uses unambiguous Crockford-style characters (no 0/O/1/I) so staff and customers can read and type codes easily.
 */
public final class ShortIds {

  private static final char[] ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".toCharArray();
  private static final int CODE_LENGTH = 6;
  private static final SecureRandom RANDOM = new SecureRandom();

  private ShortIds() {}

  public static String next(String prefix) {
    String clean = Objects.requireNonNull(prefix, "prefix").trim();
    StringBuilder out = new StringBuilder(clean.length() + 1 + CODE_LENGTH);
    out.append(clean).append('-');
    for (int i = 0; i < CODE_LENGTH; i++) {
      out.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
    }
    return out.toString();
  }
}

