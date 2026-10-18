package com.swp391.selfstorage.modules.billing.service;

import java.math.*;
import org.springframework.stereotype.Component;

@Component
public class RefundLimitCalculator {

  public BigDecimal available(
    BigDecimal actualPaid,
    BigDecimal completed,
    BigDecimal reserved
  ) {
    if (
      actualPaid.signum() < 0 || completed.signum() < 0 || reserved.signum() < 0
    ) throw new IllegalArgumentException("Negative refund inputs");
    return actualPaid
      .subtract(completed)
      .subtract(reserved)
      .max(BigDecimal.ZERO);
  }

  public void require(BigDecimal requested, BigDecimal available) {
    if (
      requested == null ||
      requested.signum() <= 0 ||
      requested.compareTo(available) > 0
    ) throw new IllegalArgumentException("Số tiền hoàn vượt hạn mức còn lại");
  }
}
