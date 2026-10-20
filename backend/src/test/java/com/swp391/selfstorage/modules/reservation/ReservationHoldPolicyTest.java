package com.swp391.selfstorage.modules.reservation;

import static org.junit.jupiter.api.Assertions.*;

import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class ReservationHoldPolicyTest {

  @Test
  void defaultsToFiveMinutePendingDepositHold() {
    assertEquals(Duration.ofMinutes(5), new ReservationHoldPolicy(5).pendingPaymentHold());
  }

  @Test
  void rejectsNonPositiveHoldDuration() {
    assertThrows(IllegalArgumentException.class, () -> new ReservationHoldPolicy(0));
  }
}
