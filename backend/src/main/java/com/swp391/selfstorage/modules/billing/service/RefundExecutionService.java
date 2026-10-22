package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class RefundExecutionService {

  private final RefundRequestRepository refunds;
  private final RefundTransactionRepository executions;
  private final PaymentRepository payments;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final AttachmentStorage storage;
  private final Clock clock;

  public RefundExecutionService(
    RefundRequestRepository r,
    RefundTransactionRepository e,
    PaymentRepository p,
    ActorContext a,
    AuditLogService au,
    AttachmentStorage s,
    Clock c
  ) {
    refunds = r;
    executions = e;
    payments = p;
    actor = a;
    audit = au;
    storage = s;
    clock = c;
  }

  private RefundRequest lock(String id) {
    var r = refunds.findById(id).orElseThrow(Inputs::missing);
    payments.lockById(r.getPaymentId()).orElseThrow(Inputs::missing);
    return refunds.lockById(id).orElseThrow(Inputs::missing);
  }

  @Transactional
  public RefundTransaction evidence(
    String id,
    MultipartFile file,
    String reference
  ) {
    var staff = actor.require("STAFF");
    var r = lock(id);
    actor.facility(staff, r.getFacilityCode());
    if (!"APPROVED".equals(r.getStatus())) throw Inputs.conflict(
      "Yêu cầu chưa duyệt hoặc đã có bằng chứng"
    );
    if (reference == null || reference.isBlank()) throw Inputs.bad(
      "Cần mã giao dịch chuyển tiền"
    );
    if (
      executions.findByReference(reference).isPresent()
    ) throw Inputs.conflict("Mã giao dịch đã được sử dụng");
    String key = storage.save(file);
    org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
      new org.springframework.transaction.support.TransactionSynchronization() {
        @Override
        public void afterCompletion(int status) {
          if (status != STATUS_COMMITTED) storage.remove(key);
        }
      }
    );
    RefundTransaction e = new RefundTransaction();
    e.setId("RTX-" + UUID.randomUUID());
    e.setRefundRequestId(id);
    e.setPerformedBy(staff.getId());
    e.setReference(reference);
    e.setEvidencePath(key);
    e.setOriginalName(
      Path.of(Objects.toString(file.getOriginalFilename(), "evidence"))
        .getFileName()
        .toString()
    );
    e.setContentType(
      key.endsWith(".pdf")
        ? "application/pdf"
        : key.endsWith(".png")
          ? "image/png"
          : "image/jpeg"
    );
    e.setStatus("SUBMITTED");
    e.setCreatedAt(LocalDateTime.now(clock));
    executions.save(e);
    r.setStatus("EVIDENCE_SUBMITTED");
    refunds.save(r);
    audit.record(
      "SUBMIT_REFUND_EVIDENCE",
      id,
      reference + "; chờ Manager xác nhận"
    );
    return e;
  }

  @Transactional
  public RefundRequest confirm(String id, Map<String, Object> d) {
    var manager = actor.require("FMANAGER");
    var r = lock(id);
    actor.facility(manager, r.getFacilityCode());
    if (!"EVIDENCE_SUBMITTED".equals(r.getStatus())) throw Inputs.conflict(
      "Chưa có bằng chứng hoặc yêu cầu đã hoàn tất"
    );
    var e = executions
      .findByRefundRequestId(id)
      .stream()
      .filter(x -> "SUBMITTED".equals(x.getStatus()))
      .findFirst()
      .orElseThrow(Inputs::missing);
    if (manager.getId().equals(e.getPerformedBy())) throw Inputs.conflict(
      "Người thực hiện và người xác nhận phải khác nhau"
    );
    String reason = Inputs.text(d, "reason");
    e.setConfirmedBy(manager.getId());
    e.setConfirmedAt(LocalDateTime.now(clock));
    e.setStatus("COMPLETED");
    executions.save(e);
    r.setStatus("COMPLETED");
    r.setCompletedAt(e.getConfirmedAt());
    refunds.save(r);
    audit.record(
      "CONFIRM_REFUND",
      id,
      reason + "; số tiền " + r.getApprovedAmount()
    );
    return r;
  }

  public RefundTransaction latest(String id) {
    var a = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    var r = refunds.findById(id).orElseThrow(Inputs::missing);
    if (
      !actor.visible(a, r.getUserId(), r.getFacilityCode())
    ) throw Inputs.missing();
    return executions
      .findByRefundRequestId(id)
      .stream()
      .max(Comparator.comparing(RefundTransaction::getCreatedAt))
      .orElseThrow(Inputs::missing);
  }

  public Path evidencePath(String id) {
    return storage.resolve(latest(id).getEvidencePath());
  }
}
