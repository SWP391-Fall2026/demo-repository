package com.swp391.selfstorage.modules.reservation.service;

import java.time.Duration;
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
}
