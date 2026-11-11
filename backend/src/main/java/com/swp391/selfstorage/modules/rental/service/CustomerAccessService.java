package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.util.ShortIds;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
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
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;

  public CustomerAccessService(
    CustomerAccessLogRepository accessLogs,
    ContractRepository contracts,
    UnitRepository units,
    ActorContext actor,
    AuditLogService audit,
    Clock clock
  ) {
    this.accessLogs = accessLogs;
    this.contracts = contracts;
    this.units = units;
    this.actor = actor;
    this.audit = audit;
    this.clock = clock;
  }

  private String textOrDefault(Map<String, ?> d, String k, String defaultValue) {
    String val = Inputs.optional(d, k);
    return (val == null || val.isBlank()) ? defaultValue : val;
  }

  @Transactional
  public CustomerAccessLog createRequest(String contractId, Map<String, Object> body) {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    Contract c = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(u, c.getUserId(), c.getFacilityCode())) {
      throw Inputs.missing();
    }

    if ("OVERDUE".equals(c.getStatus())) {
      throw Inputs.conflict("Hợp đồng đang bị tạm khóa do nợ cước. Vui lòng thanh toán hóa đơn để tạo yêu cầu vào kho.");
    }

    LocalDateTime now = LocalDateTime.now(clock);
    CustomerAccessLog req = new CustomerAccessLog();
    req.setId(ShortIds.next("REQ"));
    req.setContractId(c.getId());
    req.setUnitCode(c.getUnitCode());
    req.setFacilityCode(c.getFacilityCode());
    req.setUserId(c.getUserId());
    req.setCustomerName(c.getCustomerName());
    req.setCustomerPhone(c.getCustomerPhone());
    req.setAccessType("ENTRY");
    req.setAccessMethod(textOrDefault(body, "method", "PIN_CODE"));
    req.setPurpose(textOrDefault(body, "purpose", "Cất/lấy tài sản khoang kho"));
    req.setStatus("PENDING_APPROVAL");
    req.setNotes(textOrDefault(body, "notes", "Khách hàng đăng ký vào kho tự phục vụ"));
    req.setCreatedAt(now);

    String expStr = Inputs.optional(body, "expectedAt");
    if (!expStr.isBlank()) {
      try {
        req.setExpectedAt(LocalDateTime.parse(expStr));
      } catch (Exception ignored) {
        req.setExpectedAt(now);
      }
    } else {
      req.setExpectedAt(now);
    }

    accessLogs.save(req);
    audit.record("CUSTOMER_ACCESS_REQUEST_CREATED", c.getId(), c.getUnitCode());
    return req;
  }

  @Transactional
  public CustomerAccessLog approveRequest(String facilityCode, String requestId, Map<String, Object> body) {
    var u = actor.require("STAFF", "FMANAGER", "OPS_MGR", "ADMIN");
    actor.facility(u, facilityCode);

    CustomerAccessLog req = accessLogs.findById(requestId).orElseThrow(Inputs::missing);
    if (!Objects.equals(req.getFacilityCode(), facilityCode)) {
      throw Inputs.missing();
    }

    String pin = Inputs.optional(body, "pin");
    if (pin.isBlank() || !pin.matches("\\d{6}")) {
      pin = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
    }

    String finalPin = pin;
    LocalDateTime now = LocalDateTime.now(clock);
    req.setAccessPin(finalPin);
    req.setStatus("PIN_ISSUED");
    req.setApprovedBy(u.getUsername() != null ? u.getUsername() : u.getRole());
    req.setApprovedAt(now);

    String note = Inputs.optional(body, "notes");
    if (!note.isBlank()) {
      req.setNotes(req.getNotes() + " | QL: " + note);
    }

    accessLogs.save(req);

    // Sync re-issued PIN to contract and unit so contract sidebar and check-in simulator stay consistent
    if (req.getContractId() != null) {
      contracts.findById(req.getContractId()).ifPresent(contract -> {
        contract.setPinCode(finalPin);
        contracts.save(contract);
      });
    }
    if (req.getUnitCode() != null) {
      units.findById(req.getUnitCode()).ifPresent(unit -> {
        unit.setPinCode(finalPin);
        units.save(unit);
      });
    }

    audit.record("CUSTOMER_ACCESS_REQUEST_APPROVED", req.getContractId(), req.getUnitCode() + ":" + finalPin);
    return req;
  }

  @Transactional
  public CustomerAccessLog rejectRequest(String facilityCode, String requestId, Map<String, Object> body) {
    var u = actor.require("STAFF", "FMANAGER", "OPS_MGR", "ADMIN");
    actor.facility(u, facilityCode);

    CustomerAccessLog req = accessLogs.findById(requestId).orElseThrow(Inputs::missing);
    if (!Objects.equals(req.getFacilityCode(), facilityCode)) {
      throw Inputs.missing();
    }

    LocalDateTime now = LocalDateTime.now(clock);
    req.setStatus("REJECTED");
    req.setDenyReason(textOrDefault(body, "reason", "Quản lý từ chối yêu cầu vào kho lúc này"));
    req.setApprovedBy(u.getUsername() != null ? u.getUsername() : u.getRole());
    req.setApprovedAt(now);

    accessLogs.save(req);
    audit.record("CUSTOMER_ACCESS_REQUEST_REJECTED", req.getContractId(), req.getUnitCode());
    return req;
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

    // Check if there is an issued access PIN request
    Optional<CustomerAccessLog> issuedOpt = accessLogs.findFirstByContractIdAndStatusInOrderByCreatedAtDesc(
      c.getId(),
      List.of("PIN_ISSUED", "PENDING_APPROVAL")
    );

    boolean pinValid = false;
    if (issuedOpt.isPresent() && issuedOpt.get().getAccessPin() != null) {
      pinValid = pinProvided && Objects.equals(pin, issuedOpt.get().getAccessPin());
    } else if (Objects.equals(pin, c.getPinCode()) || !pinProvided) {
      pinValid = true;
    }

    if (!activeStatus || !notExpired || !pinValid) {
      String denyReason = !activeStatus
        ? ("OVERDUE".equals(c.getStatus()) ? "OVERDUE_LOCKED" : "CONTRACT_NOT_ACTIVE")
        : (!notExpired ? "CONTRACT_EXPIRED" : "WRONG_PIN");

      CustomerAccessLog failedLog = new CustomerAccessLog();
      failedLog.setId(ShortIds.next("ACC"));
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
        throw Inputs.conflict("Mã PIN không chính xác hoặc chưa được cấp duyệt");
      }
      throw Inputs.conflict("Hợp đồng chưa sẵn sàng để vào kho: " + denyReason);
    }

    // Auto checkout previous session if still open
    accessLogs.findFirstByContractIdAndCheckinAtIsNotNullAndCheckoutAtIsNullOrderByCheckinAtDesc(c.getId())
      .ifPresent(openLog -> {
        if (!Objects.equals(openLog.getId(), issuedOpt.map(CustomerAccessLog::getId).orElse(null))) {
          openLog.setCheckoutAt(now);
          long diff = openLog.getCheckinAt() != null ? Duration.between(openLog.getCheckinAt(), now).toMinutes() : 0;
          openLog.setDurationMinutes(Math.max(1, (int) diff));
          openLog.setStatus("CHECKED_OUT");
          accessLogs.save(openLog);
        }
      });

    CustomerAccessLog log;
    if (issuedOpt.isPresent() && "PIN_ISSUED".equals(issuedOpt.get().getStatus())) {
      log = issuedOpt.get();
      log.setStatus("GRANTED");
      log.setCheckinAt(now);
      log.setAccessType("ENTRY");
      String notes = Inputs.optional(body, "notes");
      if (!notes.isBlank()) {
        log.setNotes(notes);
      }
    } else {
      log = new CustomerAccessLog();
      log.setId(ShortIds.next("ACC"));
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
    }

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
    var openLog = accessLogs.findFirstByContractIdAndCheckinAtIsNotNullAndCheckoutAtIsNullOrderByCheckinAtDesc(c.getId());

    CustomerAccessLog log;
    if (openLog.isPresent()) {
      log = openLog.get();
      log.setCheckoutAt(now);
      long diff = Duration.between(log.getCheckinAt() != null ? log.getCheckinAt() : now.minusMinutes(10), now).toMinutes();
      log.setDurationMinutes(Math.max(1, (int) diff));
      log.setStatus("CHECKED_OUT");
      log.setAccessPin(null); // Invalidate dynamic PIN on checkout
      String notes = Inputs.optional(body, "notes");
      if (!notes.isBlank()) {
        log.setNotes(notes);
      }
    } else {
      log = new CustomerAccessLog();
      log.setId(ShortIds.next("ACC"));
      log.setContractId(c.getId());
      log.setUnitCode(c.getUnitCode());
      log.setFacilityCode(c.getFacilityCode());
      log.setUserId(c.getUserId());
      log.setCustomerName(c.getCustomerName());
      log.setCustomerPhone(c.getCustomerPhone());
      log.setAccessType("EXIT");
      log.setAccessMethod(textOrDefault(body, "method", "PIN_CODE"));
      log.setStatus("CHECKED_OUT");
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
    log.setId(ShortIds.next("ACC"));
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

