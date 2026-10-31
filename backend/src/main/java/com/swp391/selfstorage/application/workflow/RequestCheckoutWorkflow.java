package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.*;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestCheckoutWorkflow {

  private final ContractRepository contracts;
  private final ActorContext actor;
  private final TaskService tasks;
  private final AuditLogService audit;
  private final Clock clock;

  public RequestCheckoutWorkflow(
    ContractRepository c,
    ActorContext a,
    TaskService t,
    AuditLogService au,
    Clock cl
  ) {
    contracts = c;
    actor = a;
    tasks = t;
    audit = au;
    clock = cl;
  }

  @Transactional
  public Contract execute(Map<String, Object> d) {
    var customer = actor.require("CUSTOMER");
    var c = contracts
      .lockById(Inputs.text(d, "contractId"))
      .orElseThrow(Inputs::missing);
    if (!customer.getId().equals(c.getUserId())) throw Inputs.missing();
    if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(c.getStatus())) {
      throw Inputs.conflict("Hợp đồng chưa đủ điều kiện gửi yêu cầu trả kho");
    }
    if (c.getCheckoutRequestedAt() != null) {
      throw Inputs.conflict("Hợp đồng đã có yêu cầu trả kho");
    }
    LocalDate requestedDate;
    try {
      requestedDate = LocalDate.parse(Inputs.text(d, "requestedDate"));
    } catch (DateTimeParseException e) {
      throw Inputs.bad("requestedDate must use YYYY-MM-DD format");
    }
    if (requestedDate.isBefore(LocalDate.now(clock))) {
      throw Inputs.bad("requestedDate must be today or later");
    }
    c.setCheckoutRequestedAt(LocalDateTime.now(clock));
    c.setCheckoutRequestedDate(requestedDate);
    contracts.save(c);
    var returnTask = tasks.system(
      c.getFacilityCode(),
      "Nghiệm thu trả kho: " + c.getId(),
      "RETURN",
      c.getUnitCode(),
      null,
      c.getId()
    );
    returnTask.setDueDate(c.getCheckoutRequestedDate());
    audit.record("REQUEST_CHECKOUT", c.getId(), "Chưa dừng phí hoặc khóa PIN");
    return c;
  }
}
