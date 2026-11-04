package com.swp391.selfstorage.modules.reservation.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class CancellationPolicy {

  private final com.swp391.selfstorage.modules.policy.service.PolicyService policies;

  public CancellationPolicy(com.swp391.selfstorage.modules.policy.service.PolicyService policies) {
    this.policies = policies;
  }

  public boolean fullDepositRefund(
    LocalDateTime rentalStart,
    LocalDateTime cancelledAt
  ) {
    return fullDepositRefund(rentalStart, cancelledAt, null);
  }

  public boolean fullDepositRefund(
    LocalDateTime rentalStart,
    LocalDateTime cancelledAt,
    Integer refundHoursSnapshot
  ) {
    long refundHours = refundHours(refundHoursSnapshot);
    if (refundHours < 0) throw new IllegalStateException("refundCancelHours must not be negative");
    return !cancelledAt.plusHours(refundHours).isAfter(rentalStart);
  }

  public long refundHours(Integer snapshot) {
    return snapshot == null
      ? policies.value("refundCancelHours", BigDecimal.valueOf(24)).longValueExact()
      : snapshot.longValue();
  }
}
