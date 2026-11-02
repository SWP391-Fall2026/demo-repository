package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.rental.service.OverdueFeeCalculator;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompleteReturnWorkflow {

  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final UnitRepository units;
  private final ActorContext actor;
  private final PolicyService policy;
  private final OverdueFeeCalculator fees;
  private final AuditLogService audit;
  private final Clock clock;
  private final com.swp391.selfstorage.modules.workforce.service.TaskService tasks;
  private final InvoiceService invoices;

  public CompleteReturnWorkflow(
    ContractRepository c,
    InspectionRecordRepository i,
    UnitRepository u,
    ActorContext a,
    PolicyService p,
    OverdueFeeCalculator f,
    AuditLogService au,
    Clock cl,
    com.swp391.selfstorage.modules.workforce.service.TaskService tasks,
    InvoiceService invoices
  ) {
    contracts = c;
    inspections = i;
    units = u;
    actor = a;
    policy = p;
    fees = f;
    audit = au;
    clock = cl;
    this.tasks = tasks;
    this.invoices = invoices;
  }

  @Transactional
  public Map<String, Object> execute(Map<String, Object> d) {
    var staff = actor.require("STAFF");
    String unitCode = Inputs.text(d, "unitCode");
    var c = contracts
      .findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(
        unitCode,
        List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE")
      )
      .orElseThrow(Inputs::missing);
    actor.facility(staff, c.getFacilityCode());
    tasks.requireAssignedReturn(c.getId(), staff.getId());
    if (
      !Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(c.getStatus()) || c.getCheckoutRequestedAt() == null
    ) throw Inputs.conflict("Chưa có yêu cầu trả hợp lệ");
    var unit = units.lockByCode(unitCode).orElseThrow(Inputs::missing);
    var now = LocalDateTime.now(clock);
    String cleanliness = Inputs.text(d, "cleanlinessStatus");
    BigDecimal deductions = fees.calculate(
      c.getEndAt().plusDays(policy.value("gracePeriodDays", BigDecimal.valueOf(3)).longValue()),
      now,
      policy.feeAfterWaiver("overdue", policy.fee("overdueDailyFee")),
      unit.getPricePerMonth(),
      policy.cap(c.getFacilityCode())
    );
    if (!"CLEAN".equals(cleanliness)) deductions = deductions.add(
      policy.feeAfterWaiver("cleaning", policy.fee("cleaningFee"))
    );
    if (Boolean.TRUE.equals(d.get("lockDamaged"))) deductions = deductions.add(
      policy.feeAfterWaiver("lock", policy.fee("newLockFee"))
    );
    InspectionRecord i = new InspectionRecord();
    i.setId("INS-" + UUID.randomUUID());
    i.setContractId(c.getId());
    i.setStaffId(staff.getId());
    i.setInspectionDate(now);
    i.setCleanlinessStatus(cleanliness);
    i.setDamageNotes(Inputs.text(d, "damageNotes"));
    i.setPenaltyFee(deductions);
    i.setDepositRefundAmount(
      c.getDepositFee().subtract(deductions).max(BigDecimal.ZERO)
    );
    i.setIsCleared(
      "CLEAN".equals(cleanliness) && !Boolean.TRUE.equals(d.get("lockDamaged"))
    );
    inspections.save(i);
    BigDecimal extraCharge = deductions.subtract(c.getDepositFee()).max(BigDecimal.ZERO);
    String extraInvoiceId = "";
    if (extraCharge.signum() > 0) {
      var invoice = invoices.issue(null, c.getId(), c.getUserId(), c.getFacilityCode(), "EXTRA", extraCharge,
        now.plusDays(3), "{\"source\":\"RETURN_INSPECTION\",\"inspectionId\":\"" + i.getId() + "\"}");
      invoice.setDescription("Phụ phí nghiệm thu vượt tiền cọc: " + i.getId());
      extraInvoiceId = invoice.getId();
    }
    c.setStatus("TERMINATED");
    c.setTerminatedAt(now);
    c.setPinCode(null);
    contracts.save(c);
    unit.setStatus("cleaning");
    unit.setPinCode(null);
    unit.setTemporaryPin(null);
    unit.setTemporaryPinExpiresAt(null);
    unit.setHeldByReservationId(null);
    unit.setReadinessStatus(null);
    units.save(unit);
    tasks.completeReturn(c.getId());
    tasks.system(c.getFacilityCode(), "Vệ sinh sau trả kho: " + c.getUnitCode(), "CLEANING", c.getUnitCode(), null, c.getId());
    audit.record(
      "COMPLETE_RETURN",
      c.getId(),
      "Ngừng tính phí; khóa PIN; phí khấu trừ " + deductions
    );
    return Map.of(
      "contractId",
      c.getId(),
      "inspectionId",
      i.getId(),
      "deductions",
      deductions,
      "refundableDeposit",
      i.getDepositRefundAmount(),
      "unitStatus",
      "cleaning",
      "extraCharge",
      extraCharge,
      "extraInvoiceId",
      extraInvoiceId
    );
  }
}
