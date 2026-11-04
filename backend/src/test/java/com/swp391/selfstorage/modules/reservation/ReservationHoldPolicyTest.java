package com.swp391.selfstorage.modules.reservation;

import static org.junit.jupiter.api.Assertions.*;

import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.time.Duration;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class ReservationHoldPolicyTest {

  @Test
  void defaultsToFiveMinutePendingDepositHold() {
    assertEquals(Duration.ofMinutes(5), new ReservationHoldPolicy(5).pendingPaymentHold());
  }

  @Test
  void rejectsNonPositiveHoldDuration() {
    assertThrows(IllegalArgumentException.class, () -> new ReservationHoldPolicy(0));
  }

  @Test
  void usesConfiguredReservationHoldDaysAfterPayment() {
    var policy = new ReservationHoldPolicy(5);
    var paidAt = LocalDateTime.of(2026, 10, 31, 12, 0);

    assertEquals(paidAt.plusDays(5), policy.reservationExpiry(paidAt, 5));
    assertNull(policy.reservationExpiry(paidAt, null));
  }
}
