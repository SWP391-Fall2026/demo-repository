package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.rental.service.OverdueFeeCalculator;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.*;
import java.nio.file.Path;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CompleteReturnWorkflow {

  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final UnitRepository units;
  private final ActorContext actor;
  private final PolicyService policy;
  private final OverdueFeeCalculator fees;
  private final AuditLogService audit;
  private final TaskService tasks;
  private final Clock clock;
  private final AttachmentStorage storage;

  public CompleteReturnWorkflow(
    ContractRepository c,
    InspectionRecordRepository i,
    UnitRepository u,
    ActorContext a,
    PolicyService p,
    OverdueFeeCalculator f,
    AuditLogService au,
    TaskService t,
    Clock cl,
    AttachmentStorage storage
  ) {
    contracts = c;
    inspections = i;
    units = u;
    actor = a;
    policy = p;
    fees = f;
    audit = au;
    tasks = t;
    clock = cl;
    this.storage = storage;
  }

  @Transactional
  public Map<String, Object> execute(Map<String, Object> d, MultipartFile evidence) {
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
    if ("STAFF".equals(actor.role(staff))) tasks.requireAssignedReturn(c.getId(), staff.getId());
    if (
      "TERMINATED".equals(c.getStatus()) || c.getCheckoutRequestedAt() == null
    ) throw Inputs.conflict("Chưa có yêu cầu trả hợp lệ");
    inspections.findFirstByContractIdOrderByInspectionDateDesc(c.getId()).ifPresent(existing -> {
      if (Set.of("PENDING_CONFIRM", "PENDING_MANAGER", "PENDING_CUSTOMER",
          "CUSTOMER_ACCEPTED", "CONFIRMED", "COMPLETED").contains(existing.getStatus()))
        throw Inputs.conflict("Phiếu nghiệm thu đã được lập, chờ khách xác nhận hoặc đã hoàn tất");
    });
    Boolean goodsCleared = booleanValue(d.get("goodsCleared"));
    boolean lockDamaged = Boolean.TRUE.equals(booleanValue(d.get("lockDamaged")));
    if (goodsCleared == null) goodsCleared = "CLEAN".equals(Inputs.optional(d, "cleanlinessStatus")) && !lockDamaged;
    if (!goodsCleared) throw Inputs.conflict("Đồ đạc chưa dọn hết, chưa thể nghiệm thu");
    var unit = units.lockByCode(unitCode).orElseThrow(Inputs::missing);
    var now = LocalDateTime.now(clock);
    String cleanliness = Inputs.text(d, "cleanlinessStatus");
    LocalDateTime deadline = c.getEndAt() != null ? c.getEndAt()
      : (c.getEndDate() != null ? c.getEndDate().atTime(23, 59, 59) : now);
    BigDecimal monthlyRate = unit.getPricePerMonth() != null
      ? unit.getPricePerMonth()
      : policy.monthly(unit.getType());
    BigDecimal deductions = fees.calculate(
      deadline,
      now,
      policy.fee("overdueDailyFee"),
      monthlyRate,
      policy.cap(c.getFacilityCode()),
      graceDays()
    );
    if (!"CLEAN".equals(cleanliness)) deductions = deductions.add(
      policy.fee("cleaningFee")
    );
    if (lockDamaged) deductions = deductions.add(
      policy.fee("newLockFee")
    );
    BigDecimal repairFee = BigDecimal.ZERO;
    Object repairRaw = d.get("repairFee");
    if (repairRaw != null && !repairRaw.toString().isBlank()) {
      repairFee = Inputs.money(repairRaw);
      deductions = deductions.add(repairFee);
    }
    boolean issueNeedsEvidence = !"CLEAN".equals(cleanliness)
      || repairFee.signum() > 0
      || lockDamaged;
    if (issueNeedsEvidence && (evidence == null || evidence.isEmpty()))
      throw Inputs.bad("Cần đính kèm ảnh khi có vấn đề vệ sinh, sửa chữa hoặc khóa hư");
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
    i.setOriginalPenaltyFee(deductions);
    i.setDepositRefundAmount(
      c.getDepositFee().subtract(deductions).max(BigDecimal.ZERO)
    );
    i.setIsCleared(
      "CLEAN".equals(cleanliness) && !lockDamaged
    );
    i.setStatus("PENDING_CONFIRM");
    if (evidence != null && !evidence.isEmpty()) {
      i.setEvidencePath(storage.saveImage(evidence));
      i.setEvidenceContentType(imageContentType(evidence));
    }
    inspections.save(i);
    audit.record(
      "DRAFT_RETURN_INSPECTION",
      c.getId(),
      "Staff lập phiếu chờ khách xác nhận; giữ hợp đồng và PIN; phí khấu trừ " + deductions
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
      "evidenceAvailable",
      i.getEvidencePath() != null,
      "status",
      "PENDING_CONFIRM"
    );
  }

  private String imageContentType(MultipartFile file) {
    String contentType = file.getContentType();
    return "image/png".equalsIgnoreCase(contentType) ? "image/png" : "image/jpeg";
  }

  private Boolean booleanValue(Object value) {
    if (value == null) return null;
    if (value instanceof Boolean result) return result;
    return Boolean.parseBoolean(value.toString());
  }

  public Path evidence(String contractId) {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    var contract = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(user, contract.getUserId(), contract.getFacilityCode()))
      throw Inputs.missing();
    var inspection = inspections.findFirstByContractIdOrderByInspectionDateDesc(contractId)
      .orElseThrow(Inputs::missing);
    if (inspection.getEvidencePath() == null) throw Inputs.missing();
    return storage.resolve(inspection.getEvidencePath());
  }

  private long graceDays() {
    try {
      return Math.max(0, policy.value("gracePeriodDays", BigDecimal.ZERO).longValueExact());
    } catch (ArithmeticException e) {
      return 0;
    }
  }
}
