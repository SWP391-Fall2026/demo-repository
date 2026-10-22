package com.swp391.selfstorage.modules.audit.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.entity.AuditLog;
import com.swp391.selfstorage.modules.audit.repository.AuditLogRepository;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

  private final AuditLogRepository logs;
  private final ActorContext actor;

  public AuditLogService(AuditLogRepository logs, ActorContext actor) {
    this.logs = logs;
    this.actor = actor;
  }

  public List<AuditLog> getLogs() {
    actor.require("ADMIN");
    return logs.findAllByOrderByIdDesc();
  }

  public void record(String action, String entity, String detail) {
    var u = actor.current();
    AuditLog log = new AuditLog(
      LocalDateTime.now().toString(),
      u.getName(),
      actor.role(u),
      action,
      detail,
      "SERVER",
      "SUCCESS"
    );
    log.setUserId(u.getId());
    log.setEntityId(entity);
    log.setFacilityCode(u.getFacilityCode());
    logs.save(log);
  }

  public void recordSystem(String action, String entity, String detail) {
    AuditLog log = new AuditLog(
      LocalDateTime.now().toString(), "VNPay", "PAYMENT_GATEWAY", action,
      detail, "GATEWAY", "SUCCESS"
    );
    log.setEntityId(entity);
    logs.save(log);
  }
}
