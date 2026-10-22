package com.swp391.selfstorage.modules.reservation.service;

import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class CancellationPolicy {

  public boolean fullDepositRefund(
    LocalDateTime rentalStart,
    LocalDateTime cancelledAt
  ) {
    return (
      Duration.between(cancelledAt, rentalStart).compareTo(
        Duration.ofHours(24)
      ) >= 0
    );
  }
}
