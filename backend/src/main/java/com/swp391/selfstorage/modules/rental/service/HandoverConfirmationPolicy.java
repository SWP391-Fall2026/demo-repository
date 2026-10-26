package com.swp391.selfstorage.modules.rental.service;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

/** Agreed handover policy; confirmation and expiry monitoring share the same boundary. */
@Component
public class HandoverConfirmationPolicy {
  public static final String VERSION = "HANDOVER-CANCELLATION-2026-10";

  public LocalDateTime deadline(LocalDateTime sentAt) {
    return sentAt.plusHours(24);
  }

  public boolean expired(LocalDateTime deadline, LocalDateTime now) {
    return deadline != null && !now.isBefore(deadline);
  }

  public BigDecimal rentRefund(BigDecimal paidRent) {
    return paidRent.multiply(new BigDecimal("0.5")).setScale(0, RoundingMode.HALF_UP);
  }
}
