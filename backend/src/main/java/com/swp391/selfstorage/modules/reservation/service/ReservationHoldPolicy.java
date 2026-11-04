package com.swp391.selfstorage.modules.reservation.service;

import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ReservationHoldPolicy {
  private final Duration pendingPaymentHold;

  public ReservationHoldPolicy(@Value("${app.reservation.pending-payment-minutes:5}") long minutes) {
    if (minutes < 1) throw new IllegalArgumentException("app.reservation.pending-payment-minutes must be positive");
    pendingPaymentHold = Duration.ofMinutes(minutes);
  }

  public Duration pendingPaymentHold() { return pendingPaymentHold; }

  public LocalDateTime reservationExpiry(LocalDateTime paidAt, Integer holdDaysSnapshot) {
    if (holdDaysSnapshot != null && holdDaysSnapshot < 1) {
      throw new IllegalStateException("reservationHoldDays snapshot must be positive");
    }
    return holdDaysSnapshot == null ? null : paidAt.plusDays(holdDaysSnapshot);
  }
}
