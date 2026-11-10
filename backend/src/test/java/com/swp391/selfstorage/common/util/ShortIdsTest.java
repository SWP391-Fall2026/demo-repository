package com.swp391.selfstorage.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ShortIdsTest {

  @Test
  void generatesReadableShortCodesWithoutAmbiguousCharacters() {
    Set<String> generated = new HashSet<>();
    for (int i = 0; i < 200; i++) {
      String id = ShortIds.next("RSV");
      assertTrue(id.matches("^RSV-[2-9A-HJ-NP-Z]{6}$"), "Unexpected format: " + id);
      generated.add(id);
    }
    assertEquals(200, generated.size());
  }
}

