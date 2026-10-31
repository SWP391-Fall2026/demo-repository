package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.entity.ReturnInspectionDispute;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.InspectionRecordRepository;
import com.swp391.selfstorage.modules.rental.repository.ReturnInspectionDisputeRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ReturnInspectionReviewWorkflow {

  private final ReturnInspectionDisputeRepository disputes;
  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final ActorContext actor;
  private final AttachmentStorage storage;
  private final AuditLogService audit;
  private final Clock clock;

  public ReturnInspectionReviewWorkflow(
    ReturnInspectionDisputeRepository disputes,
    ContractRepository contracts,
    InspectionRecordRepository inspections,
    ActorContext actor,
    AttachmentStorage storage,
    AuditLogService audit,
    Clock clock
  ) {
    this.disputes = disputes;
    this.contracts = contracts;
    this.inspections = inspections;
    this.actor = actor;
    this.storage = storage;
    this.audit = audit;
    this.clock = clock;
  }

  public List<ReturnInspectionDispute> list() {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    List<ReturnInspectionDispute> rows = "CUSTOMER".equals(actor.role(user))
      ? disputes.findByCustomerIdOrderByCreatedAtDesc(user.getId())
      : disputes.findByFacilityCodeOrderByCreatedAtDesc(user.getFacilityCode());
    rows.forEach(dispute -> {
      inspections.findById(dispute.getInspectionId()).ifPresent(inspection -> {
        dispute.setMaximumDeduction(Optional.ofNullable(inspection.getOriginalPenaltyFee())
          .orElse(Optional.ofNullable(inspection.getPenaltyFee()).orElse(BigDecimal.ZERO)));
        dispute.setCurrentDeduction(inspection.getPenaltyFee());
        dispute.setRepairFee(inspection.getRepairFee());
        dispute.setCleanlinessStatus(inspection.getCleanlinessStatus());
        dispute.setDamageNotes(inspection.getDamageNotes());
        dispute.setInspectionEvidenceAvailable(inspection.getEvidencePath() != null);
      });
      contracts.findById(dispute.getContractId()).ifPresent(contract -> {
        dispute.setUnitCode(contract.getUnitCode());
        dispute.setDepositAmount(contract.getDepositFee());
      });
    });
    return rows;
  }

  @Transactional
  public ReturnInspectionDispute decide(String id, Map<String, Object> input) {
    var manager = actor.require("FMANAGER");
    var dispute = disputes.findById(id).orElseThrow(Inputs::missing);
    var contract = contracts.lockById(dispute.getContractId()).orElseThrow(Inputs::missing);
    actor.facility(manager, contract.getFacilityCode());
    var latest = disputes.findFirstByInspectionIdOrderByCreatedAtDescIdDesc(dispute.getInspectionId())
      .orElseThrow(Inputs::missing);
    if (!latest.getId().equals(dispute.getId()))
      throw Inputs.conflict("Chỉ xử lý yêu cầu khiếu nại mới nhất");
    if (!"PENDING_MANAGER".equals(dispute.getStatus()))
      throw Inputs.conflict("Yêu cầu không còn chờ Manager xử lý");
    var inspection = inspections.findById(dispute.getInspectionId()).orElseThrow(Inputs::missing);
    if (!"PENDING_MANAGER".equals(inspection.getStatus()))
      throw Inputs.conflict("Phiếu nghiệm thu không còn chờ Manager");
    BigDecimal maxDeduction = Optional.ofNullable(inspection.getOriginalPenaltyFee())
      .orElse(Optional.ofNullable(inspection.getPenaltyFee()).orElse(BigDecimal.ZERO));
    dispute.setMaximumDeduction(maxDeduction);
    BigDecimal deduction = Inputs.money(input.get("proposedDeduction"));
    if (deduction.compareTo(maxDeduction) > 0)
      throw Inputs.bad("Mức khấu trừ mới không được cao hơn mức ban đầu của Staff: " + maxDeduction);
    String note = Inputs.text(input, "managerNote").trim();
    if (note.isBlank()) throw Inputs.bad("Cần giải thích quyết định gửi khách hàng");

    dispute.setManagerId(manager.getId());
    dispute.setManagerNote(note);
    dispute.setProposedDeduction(deduction);
    dispute.setDecidedAt(LocalDateTime.now(clock));
    dispute.setStatus("OFFERED");
    disputes.save(dispute);
    inspection.setPenaltyFee(deduction);
    inspection.setDepositRefundAmount(Optional.ofNullable(contract.getDepositFee()).orElse(BigDecimal.ZERO)
      .subtract(deduction).max(BigDecimal.ZERO));
    inspection.setStatus("PENDING_CUSTOMER");
    inspections.save(inspection);
    audit.record("RETURN_INSPECTION_MANAGER_OFFER", dispute.getId(),
      "Manager đề xuất khấu trừ " + deduction + " VND; đang chờ khách xác nhận");
    return dispute;
  }

  @Transactional
  public Map<String, Object> respond(Map<String, String> input, MultipartFile evidence) {
    var customer = actor.require("CUSTOMER");
    String contractId = Inputs.text(input, "contractId");
    var contract = contracts.lockById(contractId).orElseThrow(Inputs::missing);
    if (!customer.getId().equals(contract.getUserId())) throw Inputs.missing();
    var inspection = inspections.findFirstByContractIdOrderByInspectionDateDesc(contractId)
      .orElseThrow(Inputs::missing);
    String action = Inputs.text(input, "action").trim();
    var now = LocalDateTime.now(clock);

    if ("ACCEPT".equals(action)) {
      if (!"PENDING_CONFIRM".equals(inspection.getStatus())
          && !"PENDING_CUSTOMER".equals(inspection.getStatus()))
        throw Inputs.conflict("Phiếu nghiệm thu hiện không chờ khách xác nhận");
      if ("PENDING_CUSTOMER".equals(inspection.getStatus())) {
        var latest = disputes.findFirstByInspectionIdOrderByCreatedAtDescIdDesc(inspection.getId())
          .orElseThrow(Inputs::missing);
        if (!"OFFERED".equals(latest.getStatus()))
          throw Inputs.conflict("Đề xuất của Manager không còn hiệu lực");
        latest.setStatus("ACCEPTED");
        disputes.save(latest);
      }
      inspection.setStatus("CUSTOMER_ACCEPTED");
      inspection.setCustomerConfirmedAt(now);
      inspections.save(inspection);
      audit.record("CUSTOMER_ACCEPT_RETURN_INSPECTION", inspection.getId(),
        "Khách xác nhận mức khấu trừ " + inspection.getPenaltyFee() + " VND; chờ Staff hoàn tất");
      return Map.of("inspectionId", inspection.getId(), "status", "CUSTOMER_ACCEPTED");
    }

    if (!"DISPUTE".equals(action))
      throw Inputs.bad("Phản hồi phải là ACCEPT hoặc DISPUTE");
    String reason = Inputs.text(input, "reason").trim();
    if (reason.isBlank()) throw Inputs.bad("Vui lòng nhập lý do không đồng ý");
    if (evidence == null || evidence.isEmpty())
      throw Inputs.bad("Cần đính kèm ảnh minh chứng khi không đồng ý");
    if (!"PENDING_CONFIRM".equals(inspection.getStatus())
        && !"PENDING_CUSTOMER".equals(inspection.getStatus()))
      throw Inputs.conflict("Phiếu nghiệm thu hiện không chờ khách phản hồi");

    var latest = disputes.findFirstByInspectionIdOrderByCreatedAtDescIdDesc(inspection.getId()).orElse(null);
    if ("PENDING_CUSTOMER".equals(inspection.getStatus())) {
      if (latest == null || !"OFFERED".equals(latest.getStatus()))
        throw Inputs.conflict("Đề xuất của Manager không còn hiệu lực");
      latest.setStatus("COUNTERED");
      disputes.save(latest);
    }

    String evidencePath = storage.saveImage(evidence);
    ReturnInspectionDispute dispute = new ReturnInspectionDispute();
    dispute.setId("RDIS-" + UUID.randomUUID());
    dispute.setInspectionId(inspection.getId());
    dispute.setContractId(contract.getId());
    dispute.setFacilityCode(contract.getFacilityCode());
    dispute.setCustomerId(customer.getId());
    dispute.setReason(reason);
    dispute.setEvidencePath(evidencePath);
    dispute.setEvidenceContentType(imageContentType(evidence));
    dispute.setStatus("PENDING_MANAGER");
    dispute.setCreatedAt(latest != null && !now.isAfter(latest.getCreatedAt())
      ? latest.getCreatedAt().plusNanos(1_000)
      : now);
    disputes.save(dispute);
    inspection.setStatus("PENDING_MANAGER");
    inspections.save(inspection);
    audit.record("CUSTOMER_DISPUTE_RETURN_INSPECTION", dispute.getId(),
      "Khách không đồng ý phiếu nghiệm thu và gửi ảnh minh chứng đến Manager");
    return Map.of("inspectionId", inspection.getId(), "disputeId", dispute.getId(), "status", "PENDING_MANAGER");
  }

  public ReturnInspectionDispute evidence(String id) {
    var dispute = disputes.findById(id).orElseThrow(Inputs::missing);
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    if (!actor.visible(user, dispute.getCustomerId(), dispute.getFacilityCode()))
      throw Inputs.missing();
    return dispute;
  }

  private String imageContentType(MultipartFile file) {
    return "image/png".equalsIgnoreCase(file.getContentType()) ? "image/png" : "image/jpeg";
  }

}
