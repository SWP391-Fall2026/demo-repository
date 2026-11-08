package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.entity.CustomerAccessLog;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.CustomerAccessLogRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerAccessService {

  private final CustomerAccessLogRepository accessLogs;
  private final ContractRepository contracts;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;

  public CustomerAccessService(
    CustomerAccessLogRepository accessLogs,
    ContractRepository contracts,
    ActorContext actor,
    AuditLogService audit,
    Clock clock
  ) {
    this.accessLogs = accessLogs;
    this.contracts = contracts;
    this.actor = actor;
    this.audit = audit;
    this.clock = clock;
  }

  private String textOrDefault(Map<String, ?> d, String k, String defaultValue) {
    String val = Inputs.optional(d, k);
    return (val == null || val.isBlank()) ? defaultValue : val;
  }

  @Transactional
  public CustomerAccessLog checkin(String contractId, Map<String, Object> body) {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    Contract c = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(u, c.getUserId(), c.getFacilityCode())) {
      throw Inputs.missing();
    }

    LocalDateTime now = LocalDateTime.now(clock);
    boolean activeStatus = Set.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED").contains(c.getStatus());
    LocalDateTime effectiveEnd = c.getEndAt() != null
      ? c.getEndAt()
      : (c.getEndDate() != null ? c.getEndDate().atTime(23, 59, 59) : null);
    boolean notExpired = effectiveEnd == null || !now.isAfter(effectiveEnd);

    String pin = Inputs.optional(body, "pin");
    boolean pinProvided = !pin.isBlank();
    boolean pinValid = !pinProvided || Objects.equals(pin, c.getPinCode());

    if (!activeStatus || !notExpired || !pinValid) {
      String denyReason = !activeStatus
        ? ("OVERDUE".equals(c.getStatus()) ? "OVERDUE_LOCKED" : "CONTRACT_NOT_ACTIVE")
        : (!notExpired ? "CONTRACT_EXPIRED" : "WRONG_PIN");

      CustomerAccessLog failedLog = new CustomerAccessLog();
      failedLog.setId("ACC-" + UUID.randomUUID().toString().substring(0, 8));
      failedLog.setContractId(c.getId());
      failedLog.setUnitCode(c.getUnitCode());
      failedLog.setFacilityCode(c.getFacilityCode());
      failedLog.setUserId(c.getUserId());
      failedLog.setCustomerName(c.getCustomerName());
      failedLog.setCustomerPhone(c.getCustomerPhone());
      failedLog.setAccessType("ENTRY");
      failedLog.setAccessMethod(textOrDefault(body, "method", "PIN_CODE"));
      failedLog.setStatus("DENIED");
      failedLog.setDenyReason(denyReason);
      failedLog.setCheckinAt(now);
      failedLog.setNotes(textOrDefault(body, "notes", "Check-in thất bại: " + denyReason));
      failedLog.setCreatedAt(now);
      accessLogs.save(failedLog);

      if (!pinValid) {
        throw Inputs.conflict("Mã PIN không chính xác");
      }
      throw Inputs.conflict("Hợp đồng chưa sẵn sàng để vào kho: " + denyReason);
    }

    // Close any previous open check-in for this contract automatically
    accessLogs.findFirstByContractIdAndCheckoutAtIsNullOrderByCheckinAtDesc(c.getId())
      .ifPresent(openLog -> {
        openLog.setCheckoutAt(now);
        long diff = Duration.between(openLog.getCheckinAt(), now).toMinutes();
        openLog.setDurationMinutes(Math.max(1, (int) diff));
        accessLogs.save(openLog);
      });

    CustomerAccessLog log = new CustomerAccessLog();
    log.setId("ACC-" + UUID.randomUUID().toString().substring(0, 8));
    log.setContractId(c.getId());
    log.setUnitCode(c.getUnitCode());
    log.setFacilityCode(c.getFacilityCode());
    log.setUserId(c.getUserId());
    log.setCustomerName(c.getCustomerName());
    log.setCustomerPhone(c.getCustomerPhone());
    log.setAccessType("ENTRY");
    log.setAccessMethod(textOrDefault(body, "method", "PIN_CODE"));
    log.setStatus("GRANTED");
    log.setCheckinAt(now);
    log.setNotes(textOrDefault(body, "notes", "Check-in mở cửa vào kho tự phục vụ"));
    log.setCreatedAt(now);

    accessLogs.save(log);
    audit.record("CUSTOMER_ACCESS_CHECKIN", c.getId(), c.getUnitCode());
    return log;
  }

  @Transactional
  public CustomerAccessLog checkout(String contractId, Map<String, Object> body) {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    Contract c = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(u, c.getUserId(), c.getFacilityCode())) {
      throw Inputs.missing();
    }

    LocalDateTime now = LocalDateTime.now(clock);
    var openLog = accessLogs.findFirstByContractIdAndCheckoutAtIsNullOrderByCheckinAtDesc(c.getId());

    CustomerAccessLog log;
    if (openLog.isPresent()) {
      log = openLog.get();
      log.setCheckoutAt(now);
      long diff = Duration.between(log.getCheckinAt(), now).toMinutes();
      log.setDurationMinutes(Math.max(1, (int) diff));
      String notes = Inputs.optional(body, "notes");
      if (!notes.isBlank()) {
        log.setNotes(notes);
      }
    } else {
      log = new CustomerAccessLog();
      log.setId("ACC-" + UUID.randomUUID().toString().substring(0, 8));
      log.setContractId(c.getId());
      log.setUnitCode(c.getUnitCode());
      log.setFacilityCode(c.getFacilityCode());
      log.setUserId(c.getUserId());
      log.setCustomerName(c.getCustomerName());
      log.setCustomerPhone(c.getCustomerPhone());
      log.setAccessType("EXIT");
      log.setAccessMethod(textOrDefault(body, "method", "PIN_CODE"));
      log.setStatus("GRANTED");
      log.setCheckinAt(now.minusMinutes(15));
      log.setCheckoutAt(now);
      log.setDurationMinutes(15);
      log.setNotes(textOrDefault(body, "notes", "Check-out rời kho tự phục vụ"));
      log.setCreatedAt(now);
    }

    accessLogs.save(log);
    audit.record("CUSTOMER_ACCESS_CHECKOUT", c.getId(), c.getUnitCode());
    return log;
  }

  public List<CustomerAccessLog> history(String contractId) {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN");
    Contract c = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(u, c.getUserId(), c.getFacilityCode())) {
      throw Inputs.missing();
    }
    return accessLogs.findByContractIdOrderByCreatedAtDesc(contractId);
  }

  public List<CustomerAccessLog> facilityLogs(String facilityCode) {
    var u = actor.require("STAFF", "FMANAGER", "OPS_MGR", "ADMIN");
    actor.facility(u, facilityCode);
    return accessLogs.findByFacilityCodeOrderByCreatedAtDesc(facilityCode);
  }

  @Transactional
  public void recordSimulation(String unitCode, String pin, boolean authorized, String reason) {
    var c = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        unitCode,
        List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED", "OVERDUE", "TERMINATED")
      )
      .orElse(null);

    CustomerAccessLog log = new CustomerAccessLog();
    log.setId("ACC-" + UUID.randomUUID().toString().substring(0, 8));
    log.setUnitCode(unitCode);
    log.setContractId(c != null ? c.getId() : "N/A");
    log.setFacilityCode(c != null ? c.getFacilityCode() : (unitCode.contains("-") ? unitCode.split("-")[0] : "HN-CG"));
    log.setUserId(c != null ? c.getUserId() : "SYSTEM");
    log.setCustomerName(c != null ? c.getCustomerName() : "Mô phỏng truy cập");
    log.setCustomerPhone(c != null ? c.getCustomerPhone() : null);
    log.setAccessType("SIMULATION");
    log.setAccessMethod("PIN_CODE");
    log.setStatus(authorized ? "GRANTED" : "DENIED");
    log.setDenyReason(authorized ? null : reason);
    LocalDateTime now = LocalDateTime.now(clock);
    log.setCheckinAt(now);
    log.setCheckoutAt(authorized ? now.plusMinutes(5) : null);
    log.setDurationMinutes(authorized ? 5 : null);
    log.setNotes("Mô phỏng nhập PIN mở cửa: " + (authorized ? "Thành công" : reason));
    log.setCreatedAt(now);
    accessLogs.save(log);
  }
}

