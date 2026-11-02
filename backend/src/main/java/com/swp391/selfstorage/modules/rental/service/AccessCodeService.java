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
        List.of("ACTIVE", "EXPIRING_SOON")
      )
      .orElse(null);
    var now = LocalDateTime.now(clock);
    var unit = units.findById(code).orElse(null);
    boolean credentialMatches = c != null && (Objects.equals(pin, c.getPinCode()) ||
      unit != null && unit.getTemporaryPinExpiresAt() != null &&
      now.isBefore(unit.getTemporaryPinExpiresAt()) && Objects.equals(pin, unit.getTemporaryPin()));
    boolean allowed =
      c != null &&
      c.getEndAt() != null &&
      now.isBefore(c.getEndAt()) &&
      (c.getStartAt() == null || !now.isBefore(c.getStartAt())) &&
      unit != null && "occupied".equalsIgnoreCase(unit.getStatus()) &&
      Objects.equals(unit.getFacilityCode(), c.getFacilityCode()) &&
      actor.visible(a, c.getUserId(), c.getFacilityCode()) &&
      credentialMatches;
    return Map.of("authorized", allowed, "mode", "SOFTWARE_SIMULATION");
  }

  @Transactional
  public void update(String code, Map<String, Object> d) {
    var a = actor.require("CUSTOMER");
    var c = contracts
      .findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(
        code,
        List.of("ACTIVE", "EXPIRING_SOON")
      )
      .filter(v -> a.getId().equals(v.getUserId()))
      .orElseThrow(Inputs::missing);
    String pin = Inputs.text(d, "newPin");
    if (!pin.matches("[0-9]{6}")) throw Inputs.bad("PIN phải có 6 chữ số");
    var u = units.lockByCode(code).orElseThrow(Inputs::missing);
    var now = LocalDateTime.now(clock);
    if (!Set.of("ACTIVE", "EXPIRING_SOON").contains(c.getStatus()) ||
        c.getEndAt() == null || !now.isBefore(c.getEndAt()) ||
        c.getStartAt() != null && now.isBefore(c.getStartAt()))
      throw Inputs.conflict("Hợp đồng không còn quyền đổi PIN");
    if (!"occupied".equalsIgnoreCase(u.getStatus()) || !Objects.equals(u.getFacilityCode(), c.getFacilityCode()))
      throw Inputs.conflict("Kho không ở trạng thái đang thuê hợp lệ");
    c.setPinCode(pin);
    contracts.save(c);
    u.setPinCode(pin);
    u.setTemporaryPin(null);
    u.setTemporaryPinExpiresAt(null);
    units.save(u);
    audit.record("UPDATE_PIN", code, "Đổi PIN mô phỏng");
  }
}
