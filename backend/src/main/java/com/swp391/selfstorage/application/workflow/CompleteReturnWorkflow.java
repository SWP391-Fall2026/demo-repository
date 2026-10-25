package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
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

  public CompleteReturnWorkflow(
    ContractRepository c,
    InspectionRecordRepository i,
    UnitRepository u,
    ActorContext a,
    PolicyService p,
    OverdueFeeCalculator f,
    AuditLogService au,
    Clock cl
  ) {
    contracts = c;
    inspections = i;
    units = u;
    actor = a;
    policy = p;
    fees = f;
    audit = au;
    clock = cl;
  }

  @Transactional
  public Map<String, Object> execute(Map<String, Object> d) {
    var staff = actor.require("STAFF", "FMANAGER");
    String unitCode = Inputs.text(d, "unitCode");
    var found = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        unitCode,
        List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED")
      )
      .orElseThrow(Inputs::missing);
    var c = contracts.lockById(found.getId()).orElseThrow(Inputs::missing);
    actor.facility(staff, c.getFacilityCode());
    if (
      "TERMINATED".equals(c.getStatus()) || c.getCheckoutRequestedAt() == null
    ) throw Inputs.conflict("Chưa có yêu cầu trả hợp lệ");
    Boolean goodsCleared = (Boolean) d.get("goodsCleared");
    if (goodsCleared == null) goodsCleared = "CLEAN".equals(Inputs.optional(d, "cleanlinessStatus")) && !Boolean.TRUE.equals(d.get("lockDamaged"));
    if (!goodsCleared) throw Inputs.conflict("Đồ đạc chưa dọn hết, chưa thể nghiệm thu");
    var unit = units.lockByCode(unitCode).orElseThrow(Inputs::missing);
    var now = LocalDateTime.now(clock);
    String cleanliness = Inputs.text(d, "cleanlinessStatus");
    BigDecimal deductions = fees.calculate(
      c.getEndAt(),
      now,
      policy.fee("overdueDailyFee"),
      unit.getPricePerMonth(),
      policy.cap(c.getFacilityCode())
    );
    if (!"CLEAN".equals(cleanliness)) deductions = deductions.add(
      policy.fee("cleaningFee")
    );
    if (Boolean.TRUE.equals(d.get("lockDamaged"))) deductions = deductions.add(
      policy.fee("newLockFee")
    );
    BigDecimal repairFee = BigDecimal.ZERO;
    Object repairRaw = d.get("repairFee");
    if (repairRaw != null && !repairRaw.toString().isBlank()) {
      repairFee = Inputs.money(repairRaw);
      deductions = deductions.add(repairFee);
    }
    InspectionRecord i = new InspectionRecord();
    i.setId("INS-" + UUID.randomUUID());
    i.setContractId(c.getId());
    i.setStaffId(staff.getId());
    i.setInspectionDate(now);
    i.setCleanlinessStatus(cleanliness);
    i.setDamageNotes(Inputs.text(d, "damageNotes"));
    i.setGoodsCleared(true);
    i.setRepairFee(repairFee);
    i.setPenaltyFee(deductions);
    i.setDepositRefundAmount(
      c.getDepositFee().subtract(deductions).max(BigDecimal.ZERO)
    );
    i.setIsCleared(
      "CLEAN".equals(cleanliness) && !Boolean.TRUE.equals(d.get("lockDamaged"))
    );
    inspections.save(i);
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
      "cleaning"
    );
  }
}
