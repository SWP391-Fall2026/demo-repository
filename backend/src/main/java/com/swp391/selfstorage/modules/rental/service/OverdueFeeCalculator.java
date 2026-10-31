package com.swp391.selfstorage.modules.rental.service;

import java.math.*;
import java.time.*;
import org.springframework.stereotype.Component;

@Component
public class OverdueFeeCalculator {

  public long days(LocalDateTime deadline, LocalDateTime actual) {
    if (!actual.isAfter(deadline)) return 0;
    Duration d = Duration.between(deadline, actual);
    long n = d.toDays();
    return d.minusDays(n).isZero() ? n : n + 1;
  }

  public BigDecimal calculate(
    LocalDateTime deadline,
    LocalDateTime actual,
    BigDecimal dailyRate,
    BigDecimal currentMonthlyRate,
    BigDecimal capPercent
  ) {
    return calculate(deadline, actual, dailyRate, currentMonthlyRate, capPercent, 0);
  }

  public BigDecimal calculate(
    LocalDateTime deadline,
    LocalDateTime actual,
    BigDecimal dailyRate,
    BigDecimal currentMonthlyRate,
    BigDecimal capPercent,
    long gracePeriodDays
  ) {
    if (
      dailyRate.signum() < 0 ||
      currentMonthlyRate.signum() < 0 ||
      capPercent.signum() < 0 ||
      capPercent.compareTo(BigDecimal.valueOf(100)) > 0
    ) throw new IllegalArgumentException("Invalid fee inputs");
    LocalDateTime effectiveDeadline = deadline.plusDays(Math.max(0, gracePeriodDays));
    BigDecimal raw = dailyRate.multiply(
      BigDecimal.valueOf(days(effectiveDeadline, actual))
    );
    BigDecimal cap = currentMonthlyRate
      .multiply(capPercent)
      .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    return raw.min(cap);
  }
}
