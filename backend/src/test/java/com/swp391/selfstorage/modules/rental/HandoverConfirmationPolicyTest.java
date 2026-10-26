package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;

import com.swp391.selfstorage.modules.rental.service.HandoverConfirmationPolicy;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class HandoverConfirmationPolicyTest {
  private final HandoverConfirmationPolicy policy = new HandoverConfirmationPolicy();

  @Test
  void allowsExactlyTwentyFourHoursFromSendingAcrossDateBoundary() {
    var sent = LocalDateTime.of(2026, 10, 31, 15, 30);
    assertEquals(LocalDateTime.of(2026, 11, 1, 15, 30), policy.deadline(sent));
  }

  @Test
  void expiresAtTheDeadlineButNotImmediatelyBeforeIt() {
    var deadline = LocalDateTime.of(2026, 10, 26, 14, 0);
    assertFalse(policy.expired(deadline, deadline.minusNanos(1)));
    assertTrue(policy.expired(deadline, deadline));
    assertTrue(policy.expired(deadline, deadline.plusNanos(1)));
  }

  @Test
  void doesNotInventADeadlineForRecordsWithoutOne() {
    assertFalse(policy.expired(null, LocalDateTime.of(2026, 10, 26, 14, 0)));
  }

  @Test
  void refundsHalfPaidRentRoundedToWholeDong() {
    assertEquals(new BigDecimal("1350000"), policy.rentRefund(new BigDecimal("2700000")));
    assertEquals(new BigDecimal("451"), policy.rentRefund(new BigDecimal("901")));
  }
}
