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
    if ("PENDING_HANDOVER".equals(c.getStatus()))
      throw Inputs.conflict("Hợp đồng đã thanh toán nhưng chưa bàn giao, chưa thể yêu cầu trả kho");
    if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(c.getStatus()))
      throw Inputs.conflict("Chỉ hợp đồng đã bàn giao mới được yêu cầu trả kho");
    boolean unpaid = !invoices.findByContractIdAndInvoiceTypeAndStatus(c.getId(), "RENT", "PENDING").isEmpty()
      || !invoices.findByContractIdAndInvoiceTypeAndStatus(c.getId(), "RENEW", "PENDING").isEmpty()
      || !invoices.findByContractIdAndInvoiceTypeAndStatus(c.getId(), "OVERDUE", "PENDING").isEmpty()
      || !invoices.findByContractIdAndInvoiceTypeAndStatus(c.getId(), "OVERDUE", "OVERDUE").isEmpty();
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
    tasks.requestReturn(
      c.getFacilityCode(),
      c.getId(),
      c.getUnitCode(),
      c.getCheckoutRequestedDate(),
      reason
    );
    audit.record("REQUEST_CHECKOUT", c.getId(), "Chưa dừng phí hoặc khóa PIN");
    return c;
  }
}
