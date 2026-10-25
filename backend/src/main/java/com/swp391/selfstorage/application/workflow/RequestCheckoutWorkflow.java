package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestCheckoutWorkflow {

  private final ContractRepository contracts;
  private final InvoiceRepository invoices;
  private final ActorContext actor;
  private final TaskService tasks;
  private final AuditLogService audit;
  private final Clock clock;

  public RequestCheckoutWorkflow(
    ContractRepository c,
    InvoiceRepository invoices,
    ActorContext a,
    TaskService t,
    AuditLogService au,
    Clock cl
  ) {
    contracts = c;
    this.invoices = invoices;
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
    if (
      "TERMINATED".equals(c.getStatus()) || c.getCheckoutRequestedAt() != null
    ) throw Inputs.conflict("Đã có yêu cầu hoặc hợp đồng đã kết thúc");
    if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(c.getStatus()))
      throw Inputs.conflict("Hợp đồng chưa đến trạng thái được trả kho");
    boolean unpaid = invoices.findAll().stream().anyMatch(i ->
      (c.getId().equals(i.getContractId()) ||
        (c.getReservationId() != null && c.getReservationId().equals(i.getReservationId()))) &&
      ("PENDING".equals(i.getStatus()) || "OVERDUE".equals(i.getStatus()))
    );
    if (unpaid) throw Inputs.conflict("Kho đang có công nợ chưa thanh toán");
    c.setCheckoutRequestedAt(LocalDateTime.now(clock));
    c.setCheckoutRequestedDate(
      LocalDate.parse(Inputs.text(d, "requestedDate"))
    );
    String reason = Inputs.optional(d, "reason");
    if (reason.isBlank()) reason = "Khách yêu cầu trả kho";
    c.setCheckoutReason(reason);
    c.setStatus("CHECKOUT_REQUESTED");
    contracts.save(c);
    tasks.system(
      c.getFacilityCode(),
      "Nghiệm thu trả kho: " + c.getId(),
      "RETURN",
      c.getUnitCode(),
      null,
      c.getId()
    );
    audit.record("REQUEST_CHECKOUT", c.getId(), "Chưa dừng phí hoặc khóa PIN");
    return c;
  }
}
