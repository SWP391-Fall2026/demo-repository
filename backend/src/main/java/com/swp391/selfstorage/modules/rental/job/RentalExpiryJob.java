package com.swp391.selfstorage.modules.rental.job;

import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
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

  public RentalExpiryJob(ContractRepository c, UnitRepository u, Clock cl) {
    contracts = c;
    units = u;
    clock = cl;
  }

  @Scheduled(fixedDelayString = "${app.rental-monitor-ms:60000}")
  @Transactional
  public void monitor() {
    var now = LocalDateTime.now(clock);
    for (var found : contracts.findAll()) {
      if (
        Set.of("ACTIVE", "EXPIRING_SOON").contains(found.getStatus()) &&
        found.getEndAt() != null &&
        now.isAfter(found.getEndAt())
      ) {
        var c = contracts.lockById(found.getId()).orElseThrow();
        if (
          !Set.of("ACTIVE", "EXPIRING_SOON").contains(c.getStatus()) ||
          !now.isAfter(c.getEndAt())
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
}
