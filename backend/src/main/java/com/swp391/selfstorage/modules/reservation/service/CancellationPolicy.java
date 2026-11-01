package com.swp391.selfstorage.modules.reservation.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.swp391.selfstorage.modules.policy.service.PolicyService;

@Component
public class CancellationPolicy {

  private final PolicyService policies;

  /** Used by focused unit tests that exercise the default 24-hour rule. */
  public CancellationPolicy() {
    policies = null;
  }

  @Autowired
  public CancellationPolicy(PolicyService policies) {
    this.policies = policies;
  }

  public boolean fullDepositRefund(
    LocalDateTime rentalStart,
    LocalDateTime cancelledAt
  ) {
    return (
      Duration.between(cancelledAt, rentalStart).compareTo(
        Duration.ofHours(refundWindowHours())
      ) >= 0
    );
  }

  private long refundWindowHours() {
    if (policies == null) return 24L;
    return policies
      .value("cancellation.fullRefundHours", BigDecimal.valueOf(24))
      .max(BigDecimal.ONE)
      .min(BigDecimal.valueOf(168))
      .longValue();
  }
}
