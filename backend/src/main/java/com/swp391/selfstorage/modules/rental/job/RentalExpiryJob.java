package com.swp391.selfstorage.modules.rental.job;

import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RentalExpiryJob {

  private final ContractRepository contracts;
  private final UnitRepository units;
  private final Clock clock;
  private final PolicyService policy;

  public RentalExpiryJob(ContractRepository c, UnitRepository u, Clock cl, PolicyService policy) {
    contracts = c;
    units = u;
    clock = cl;
    this.policy = policy;
  }

  @Scheduled(fixedDelayString = "${app.rental-monitor-ms:60000}")
  @Transactional
  public void monitor() {
    var now = LocalDateTime.now(clock);
    long graceDays = policy.value("gracePeriodDays", BigDecimal.ZERO).longValueExact();
    for (var found : contracts.findByStatusInAndEndAtLessThan(List.of("ACTIVE", "EXPIRING_SOON"), now)) {
      var c = contracts.lockById(found.getId()).orElseThrow();
      if (
        !Set.of("ACTIVE", "EXPIRING_SOON").contains(c.getStatus()) ||
        c.getEndAt() == null ||
        !now.isAfter(c.getEndAt().plusDays(graceDays))
      ) continue;
      c.setStatus("OVERDUE");
      c.setPinCode(null);
      contracts.save(c);
      units.lockByCode(c.getUnitCode()).ifPresent(u -> {
        u.setPinCode(null);
        u.setTemporaryPin(null);
        u.setTemporaryPinExpiresAt(null);
        units.save(u);
      });
    }
  }
}
