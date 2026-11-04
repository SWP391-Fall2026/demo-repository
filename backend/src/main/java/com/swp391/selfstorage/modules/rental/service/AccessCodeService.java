package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccessCodeService {

  private final ContractRepository contracts;
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;

  public AccessCodeService(
    ContractRepository c,
    UnitRepository u,
    ActorContext a,
    AuditLogService au,
    Clock cl
  ) {
    contracts = c;
    units = u;
    actor = a;
    audit = au;
    clock = cl;
  }

  public Map<String, Object> verify(Map<String, Object> d) {
    var a = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    String code = Inputs.text(d, "unitCode"),
      pin = Inputs.text(d, "pin");
    var c = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        code,
        List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")
      )
      .orElse(null);
    var overdue = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(code, List.of("OVERDUE"))
      .filter(v -> actor.visible(a, v.getUserId(), v.getFacilityCode()))
      .orElse(null);
    boolean allowed =
      c != null &&
      overdue == null &&
      c.getEndAt() != null &&
      !LocalDateTime.now(clock).isAfter(c.getEndAt()) &&
      actor.visible(a, c.getUserId(), c.getFacilityCode()) &&
      Objects.equals(pin, c.getPinCode());
    String reason = c == null && overdue != null ? "OVERDUE_LOCKED"
      : c == null ? "NO_ACTIVE_CONTRACT"
      : c.getEndAt() == null || LocalDateTime.now(clock).isAfter(c.getEndAt()) ? "CONTRACT_EXPIRED"
      : !actor.visible(a, c.getUserId(), c.getFacilityCode()) ? "OUT_OF_SCOPE"
      : !Objects.equals(pin, c.getPinCode()) ? "WRONG_PIN" : "OK";
    return Map.of("authorized", allowed, "mode", "SOFTWARE_SIMULATION", "reason", reason);
  }
}
