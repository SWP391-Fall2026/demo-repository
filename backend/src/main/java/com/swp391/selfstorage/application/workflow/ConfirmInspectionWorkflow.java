package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfirmInspectionWorkflow {

  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final UnitRepository units;
  private final PaymentRepository payments;
  private final RefundRequestRepository refunds;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final TaskService tasks;
  private final Clock clock;

  public ConfirmInspectionWorkflow(
    ContractRepository c,
    InspectionRecordRepository i,
    UnitRepository u,
    PaymentRepository p,
    RefundRequestRepository r,
    ActorContext a,
    AuditLogService au,
    TaskService t,
    Clock cl
  ) {
    contracts = c;
    inspections = i;
    units = u;
    payments = p;
    refunds = r;
    actor = a;
    audit = au;
    tasks = t;
    clock = cl;
  }

  @Transactional
  public Map<String, Object> complete(Map<String, Object> d) {
    var staff = actor.require("STAFF");
    var c = contracts.lockById(Inputs.text(d, "contractId")).orElseThrow(Inputs::missing);
    actor.facility(staff, c.getFacilityCode());
    tasks.requireAssignedReturn(c.getId(), staff.getId());
    if (!"CHECKOUT_REQUESTED".equals(c.getStatus()))
      throw Inputs.conflict("Hợp đồng không còn chờ hoàn tất nghiệm thu");
    var inspection = inspections.findFirstByContractIdOrderByInspectionDateDesc(c.getId())
      .orElseThrow(Inputs::missing);
    if (!"CUSTOMER_ACCEPTED".equals(inspection.getStatus()))
      throw Inputs.conflict("Chỉ hoàn tất sau khi khách xác nhận phiếu nghiệm thu");

    var now = LocalDateTime.now(clock);
    inspection.setStatus("COMPLETED");
    inspection.setCompletedAt(now);
    inspections.save(inspection);
    c.setInspectionConfirmedAt(now);
    c.setStatus("TERMINATED");
    c.setTerminatedAt(now);
    c.setPinCode(null);
    contracts.save(c);
    var unit = units.lockByCode(c.getUnitCode()).orElseThrow(Inputs::missing);
    unit.setStatus("available");
    unit.setTenantName(null);
    unit.setPinCode(null);
    unit.setTemporaryPin(null);
    unit.setTemporaryPinExpiresAt(null);
    unit.setHeldByReservationId(null);
    unit.setReadinessStatus(null);
    units.save(unit);
    tasks.completeReturnByContract(c.getId());
    String refundRequestId = autoRefund(c, inspection, staff.getId(), now);
    audit.record(
      "STAFF_COMPLETE_RETURN_INSPECTION",
      c.getId(),
      "Staff hoàn tất phiếu " + inspection.getId() + "; hợp đồng chấm dứt; kho trống; PIN vô hiệu; yêu cầu hoàn tiền " + refundRequestId
    );
    return Map.of(
      "contractId", c.getId(),
      "inspectionId", inspection.getId(),
      "status", "COMPLETED",
      "refundRequestId", Objects.toString(refundRequestId, ""),
      "unitStatus", "available"
    );
  }

  private String autoRefund(
    com.swp391.selfstorage.modules.rental.entity.Contract c,
    com.swp391.selfstorage.modules.rental.entity.InspectionRecord inspection,
    String staffId,
    LocalDateTime now
  ) {
    BigDecimal refundable = inspection.getDepositRefundAmount() == null
      ? BigDecimal.ZERO
      : inspection.getDepositRefundAmount();
    if (refundable.signum() <= 0) return "";
    var depositPayment = payments.findByContractId(c.getId()).stream()
      .filter(p -> "DEPOSIT".equals(p.getInvoiceType()) && "PAID".equals(p.getStatus()))
      .findFirst();
    if (depositPayment.isEmpty()) {
      depositPayment = payments.findByReservationId(c.getReservationId() == null ? "" : c.getReservationId()).stream()
        .filter(p -> "DEPOSIT".equals(p.getInvoiceType()) && "PAID".equals(p.getStatus()))
        .findFirst();
    }
    if (depositPayment.isEmpty()) return "";
    var payment = depositPayment.get();
    boolean exists = refunds.findByPaymentId(payment.getId()).stream()
      .anyMatch(r -> "PENDING".equals(r.getStatus())
        || "APPROVED".equals(r.getStatus())
        || "EVIDENCE_SUBMITTED".equals(r.getStatus()));
    if (exists) return "";
    RefundRequest r = new RefundRequest();
    r.setId("REF-" + UUID.randomUUID());
    r.setIdempotencyKey("INSPECT-" + inspection.getId());
    r.setPaymentId(payment.getId());
    r.setReservationId(payment.getReservationId());
    r.setContractId(c.getId());
    r.setInspectionId(inspection.getId());
    r.setUserId(c.getUserId());
    r.setFacilityCode(c.getFacilityCode());
    r.setRefundType("DEPOSIT");
    r.setRequestedAmount(refundable.min(payment.getAmount()));
    r.setApprovedAmount(BigDecimal.ZERO);
    r.setRequestedBy(staffId);
    r.setOnBehalfBasis("STAFF_FINALIZED_CUSTOMER_ACCEPTED_INSPECTION");
    r.setExceptionRequested(false);
    r.setReason("Hoàn cọc sau nghiệm thu trả kho " + inspection.getId()
      + " (cọc " + c.getDepositFee() + " - khấu trừ " + inspection.getPenaltyFee() + ")");
    r.setStatus("PENDING");
    r.setCreatedAt(now);
    refunds.save(r);
    audit.record("AUTO_REFUND_AFTER_INSPECTION", r.getId(),
      "Staff hoàn tất nghiệm thu khách đã xác nhận; tạo yêu cầu hoàn " + r.getRequestedAmount());
    return r.getId();
  }
}
