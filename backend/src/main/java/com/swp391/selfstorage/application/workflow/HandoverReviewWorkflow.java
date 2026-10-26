package com.swp391.selfstorage.application.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.billing.service.RefundLimitCalculator;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.rental.service.HandoverConfirmationPolicy;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;

@Service
public class HandoverReviewWorkflow {
  private final HandoverReviewRepository reviews;
  private final HandoverReviewEvidenceRepository evidence;
  private final HandoverRecordRepository handovers;
  private final ContractRepository contracts;
  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final InvoiceRepository invoices;
  private final PaymentRepository payments;
  private final RefundRequestRepository refunds;
  private final DailyTaskRepository tasks;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final AttachmentStorage storage;
  private final HandoverConfirmationPolicy policy;
  private final RefundLimitCalculator limits;
  private final ObjectMapper json;
  private final Clock clock;
  private final jakarta.persistence.EntityManager entityManager;

  public HandoverReviewWorkflow(HandoverReviewRepository reviews,
      HandoverReviewEvidenceRepository evidence, HandoverRecordRepository handovers,
      ContractRepository contracts, ReservationRepository reservations, UnitRepository units,
      InvoiceRepository invoices, PaymentRepository payments, RefundRequestRepository refunds,
      DailyTaskRepository tasks, ActorContext actor, AuditLogService audit,
      AttachmentStorage storage, HandoverConfirmationPolicy policy, RefundLimitCalculator limits,
      ObjectMapper json, Clock clock, jakarta.persistence.EntityManager entityManager) {
    this.reviews = reviews; this.evidence = evidence; this.handovers = handovers;
    this.contracts = contracts; this.reservations = reservations; this.units = units;
    this.invoices = invoices; this.payments = payments; this.refunds = refunds;
    this.tasks = tasks; this.actor = actor; this.audit = audit; this.storage = storage;
    this.policy = policy; this.limits = limits; this.json = json; this.clock = clock;
    this.entityManager = entityManager;
  }

  private record Context(Reservation reservation, Contract contract, HandoverRecord handover) {}

  // Same lock order as customer confirmation: Reservation, Contract, then related state.
  private Context lock(String contractId) {
    var initial = contracts.findById(contractId).orElseThrow(Inputs::missing);
    var reservation = reservations.lockById(initial.getReservationId()).orElseThrow(Inputs::missing);
    var contract = contracts.lockById(contractId).orElseThrow(Inputs::missing);
    entityManager.refresh(reservation);
    entityManager.refresh(contract);
    var handover = handovers.findFirstByContractIdOrderByHandoverDateDesc(contractId)
        .orElseThrow(() -> Inputs.conflict("Staff chưa gửi biên bản bàn giao"));
    return new Context(reservation, contract, handover);
  }

  private void requirePending(Context context) {
    if (!"PENDING_HANDOVER".equals(context.contract().getStatus())
        || !"RESERVED".equals(context.reservation().getStatus()))
      throw Inputs.conflict("Chỉ xử lý khi hợp đồng đang chờ bàn giao");
  }

  private void visible(HandoverReview review) {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    if (!actor.visible(user, review.getUserId(), review.getFacilityCode())) throw Inputs.missing();
  }

  public List<HandoverReview> list() {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return "CUSTOMER".equals(actor.role(user))
        ? reviews.findByUserIdOrderByCreatedAtDesc(user.getId())
        : reviews.findByFacilityCodeOrderByCreatedAtDesc(user.getFacilityCode());
  }

  public Map<String, Object> detail(String id) {
    var review = reviews.findById(id).orElseThrow(Inputs::missing);
    visible(review);
    return Map.of("review", review, "evidence", evidence.findByReviewIdOrderByCreatedAtAsc(id),
        "refunds", refunds.findAll().stream().filter(r -> id.equals(r.getHandoverReviewId())).toList());
  }

  private HandoverReview create(Context context, String kind, String reason, String source, String by) {
    var review = new HandoverReview();
    review.setId("HREV-" + UUID.randomUUID()); review.setHandoverId(context.handover().getId());
    review.setContractId(context.contract().getId()); review.setReservationId(context.reservation().getId());
    review.setFacilityCode(context.contract().getFacilityCode()); review.setUserId(context.contract().getUserId());
    review.setKind(kind); review.setReason(reason); review.setSource(source); review.setRequestedBy(by);
    review.setCreatedAt(LocalDateTime.now(clock));
    review.setConfirmationDeadline(context.handover().getConfirmationDeadlineAt());
    review.setPolicyVersion(HandoverConfirmationPolicy.VERSION);
    review.setStatus("ISSUE".equals(kind) ? "RECORDED" : "PENDING");
    try {
      review.setHandoverSnapshot(json.writeValueAsString(Map.of(
          "handoverId", context.handover().getId(),
          "sentAt", Objects.toString(context.handover().getHandoverDate(), ""),
          "unitConditionNotes", Objects.toString(context.handover().getUnitConditionNotes(), ""),
          "staffNotes", Objects.toString(context.handover().getStaffNotes(), ""),
          "conditionStatus", Objects.toString(context.handover().getConditionStatus(), ""),
          "unitCode", Objects.toString(context.reservation().getUnitCode(), ""))));
    } catch (Exception error) { throw new IllegalStateException("Không lưu được bản chụp biên bản", error); }
    reviews.save(review);
    // Retain the original staff photo even when a corrected handover is sent later.
    if (context.handover().getEvidencePath() != null && !context.handover().getEvidencePath().isBlank()) {
      var saved = new HandoverReviewEvidence();
      saved.setId("HRE-" + UUID.randomUUID()); saved.setReviewId(review.getId());
      saved.setEvidencePath(context.handover().getEvidencePath());
      saved.setContentType(contentType(saved.getEvidencePath())); saved.setNote("Ảnh biên bản tại thời điểm ghi nhận");
      saved.setUploadedBy(context.handover().getStaffId()); saved.setCreatedAt(review.getCreatedAt());
      evidence.save(saved);
    }
    return review;
  }

  @Transactional
  public HandoverReview reportIssue(String contractId, Map<String, Object> input, MultipartFile file) {
    var customer = actor.require("CUSTOMER");
    var context = lock(contractId);
    if (!actor.visible(customer, context.contract().getUserId(), context.contract().getFacilityCode())) throw Inputs.missing();
    requirePending(context);
    if (reviews.existsByContractIdAndStatus(contractId, "PENDING"))
      throw Inputs.conflict("Yêu cầu hủy đang chờ Manager xem xét; liên hệ Staff để bổ sung bằng chứng");
    String reason = required(input, "reason");
    var review = create(context, "ISSUE", reason, "CUSTOMER", customer.getId());
    saveEvidence(review.getId(), reason, file, customer.getId());
    var handover = context.handover();
    handover.setStatus("ISSUE_REPORTED"); handover.setCustomerIssueNotes(reason);
    handover.setCustomerIssueReportedAt(LocalDateTime.now(clock)); handover.setCustomerIssueReportedBy(customer.getId());
    handovers.save(handover);
    audit.record("HANDOVER_ISSUE_REPORTED", review.getId(), summary(reason));
    return review;
  }

  @Transactional
  public HandoverReview requestCancellation(Map<String, Object> input, MultipartFile file) {
    var staff = actor.require("STAFF");
    var context = lock(Inputs.text(input, "contractId"));
    actor.facility(staff, context.contract().getFacilityCode());
    requirePending(context);
    if (reviews.existsByContractIdAndStatus(context.contract().getId(), "PENDING"))
      throw Inputs.conflict("Đã có yêu cầu hủy chờ duyệt; bổ sung vào hồ sơ hiện có");
    String reason = required(input, "reason"), basis = required(input, "onBehalfBasis");
    var review = create(context, "CANCELLATION", reason, "STAFF", staff.getId());
    saveEvidence(review.getId(), basis, file, staff.getId());
    context.handover().setStatus("CANCELLATION_REQUESTED"); handovers.save(context.handover());
    audit.record("REQUEST_HANDOVER_CANCELLATION", review.getId(), summary(reason));
    return review;
  }

  @Transactional
  public void expire(String contractId) {
    var context = lock(contractId);
    if (!"PENDING_HANDOVER".equals(context.contract().getStatus())
        || !"RESERVED".equals(context.reservation().getStatus())
        || !policy.expired(context.handover().getConfirmationDeadlineAt(), LocalDateTime.now(clock))
        || reviews.existsByContractIdAndStatus(contractId, "PENDING")) return;
    var review = create(context, "TIMEOUT", "Khách chưa xác nhận biên bản trong 24 giờ kể từ khi gửi/cấp lại hạn.", "SYSTEM", null);
    context.handover().setStatus("CANCELLATION_REQUESTED"); handovers.save(context.handover());
    audit.recordBackground("HANDOVER_CONFIRMATION_EXPIRED", review.getId(), context.contract().getFacilityCode(), "Tạo yêu cầu hủy chờ Facility Manager; chưa giải phóng kho");
  }

  @Transactional
  public HandoverReview addEvidence(String id, String note, MultipartFile file) {
    var staff = actor.require("STAFF");
    var initial = reviews.findById(id).orElseThrow(Inputs::missing);
    actor.facility(staff, initial.getFacilityCode());
    requirePending(lock(initial.getContractId()));
    var review = reviews.findById(id).orElseThrow(Inputs::missing);
    entityManager.refresh(review);
    if (!Set.of("PENDING", "RECORDED").contains(review.getStatus()))
      throw Inputs.conflict("Hồ sơ đã được quyết định; không thể bổ sung");
    if (note == null || note.isBlank() || note.length() > 4000) throw Inputs.bad("Cần ghi chú bằng chứng, tối đa 4000 ký tự");
    saveEvidence(id, note, file, staff.getId());
    audit.record("ADD_HANDOVER_REVIEW_EVIDENCE", id, summary(note));
    return review;
  }

  @Transactional
  public HandoverReview decide(String id, Map<String, Object> input) {
    var manager = actor.require("FMANAGER");
    var initial = reviews.findById(id).orElseThrow(Inputs::missing);
    actor.facility(manager, initial.getFacilityCode());
    var context = lock(initial.getContractId());
    var review = reviews.findById(id).orElseThrow(Inputs::missing);
    entityManager.refresh(review);
    String decision = Inputs.text(input, "decision");
    if (!Set.of("APPROVE", "REJECT").contains(decision)) throw Inputs.bad("Quyết định không hợp lệ");
    if (("APPROVE".equals(decision) && "APPROVED".equals(review.getStatus()))
        || ("REJECT".equals(decision) && "REJECTED".equals(review.getStatus()))) return review;
    if (!"PENDING".equals(review.getStatus())) throw Inputs.conflict("Yêu cầu đã được xử lý hoặc chỉ là báo vấn đề");
    requirePending(context);
    String reason = required(input, "reason"), conditions = required(input, "conditions"), nextSteps = required(input, "nextSteps");
    var now = LocalDateTime.now(clock);
    if ("REJECT".equals(decision)) {
      review.setStatus("REJECTED"); review.setNewConfirmationDeadline(policy.deadline(now));
      context.handover().setConfirmationDeadlineAt(review.getNewConfirmationDeadline());
      context.handover().setStatus("PENDING_CUSTOMER_CONFIRMATION"); handovers.save(context.handover());
    } else {
      if (!Boolean.TRUE.equals(input.get("policyConfirmed")))
        throw Inputs.bad("Manager phải xác nhận hoàn 50% RENT và giữ toàn bộ tiền cọc");
      approve(context, review, manager.getId(), reason, now);
      review.setStatus("APPROVED");
    }
    review.setDecidedBy(manager.getId()); review.setDecidedAt(now); review.setDecisionReason(reason);
    review.setConditions(conditions); review.setNextSteps(nextSteps); reviews.save(review);
    audit.record("DECIDE_HANDOVER_CANCELLATION", id, decision + "; " + summary(reason));
    return review;
  }

  private void approve(Context context, HandoverReview review, String managerId, String reason, LocalDateTime now) {
    var reservation = context.reservation(); var contract = context.contract();
    var unit = units.lockByCode(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    if (!"reserved".equals(unit.getStatus()) || !reservation.getId().equals(unit.getHeldByReservationId())
        || !Objects.equals(contract.getUnitCode(), unit.getCode()))
      throw Inputs.conflict("Kho không còn được giữ đúng cho hợp đồng này");
    for (var candidate : payments.findByReservationId(reservation.getId()).stream()
        .filter(p -> "DEPOSIT".equals(p.getInvoiceType())).sorted(Comparator.comparing(Payment::getId)).toList()) {
      var deposit = payments.lockById(candidate.getId()).orElseThrow(Inputs::missing);
      if (refunds.findByPaymentId(deposit.getId()).stream()
          .anyMatch(r -> Set.of("PENDING", "APPROVED", "EVIDENCE_SUBMITTED", "COMPLETED").contains(r.getStatus())))
        throw Inputs.conflict("Tiền cọc có hồ sơ hoàn đang xử lý/đã hoàn; cần đối soát trước khi duyệt chính sách không hoàn cọc");
    }
    var invoice = invoices.findByReservationIdAndInvoiceType(reservation.getId(), "RENT").orElseThrow(Inputs::missing);
    if (!"PAID".equals(invoice.getStatus()) || !contract.getId().equals(invoice.getContractId())
        || !contract.getUserId().equals(invoice.getUserId()) || !contract.getFacilityCode().equals(invoice.getFacilityCode()))
      throw Inputs.conflict("Hóa đơn RENT chưa thanh toán hoặc không khớp hợp đồng");
    var paid = payments.findByInvoiceId(invoice.getId()).stream().filter(p -> "PAID".equals(p.getStatus()))
        .sorted(Comparator.comparing(Payment::getId)).toList();
    BigDecimal paidTotal = BigDecimal.ZERO, refundTotal = BigDecimal.ZERO;
    for (var candidate : paid) {
      var payment = payments.lockById(candidate.getId()).orElseThrow(Inputs::missing);
      if (!"PAID".equals(payment.getStatus()) || !"RENT".equals(payment.getInvoiceType()) || !contract.getId().equals(payment.getContractId())
          || !reservation.getId().equals(payment.getReservationId()) || !contract.getUserId().equals(payment.getUserId())
          || !contract.getFacilityCode().equals(payment.getFacilityCode()) || payment.getAmount() == null || payment.getAmount().signum() <= 0)
        throw Inputs.conflict("Giao dịch RENT không khớp hợp đồng");
      var existing = refunds.findByPaymentId(payment.getId());
      BigDecimal committed = existing.stream().filter(r -> Set.of("PENDING", "APPROVED", "EVIDENCE_SUBMITTED", "COMPLETED").contains(r.getStatus()))
          .map(r -> "PENDING".equals(r.getStatus()) ? r.getRequestedAmount() : r.getApprovedAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
      BigDecimal amount = policy.rentRefund(payment.getAmount());
      limits.require(amount, limits.available(amount, committed, BigDecimal.ZERO));
      var refund = new RefundRequest();
      refund.setId("REF-" + UUID.randomUUID()); refund.setHandoverReviewId(review.getId());
      refund.setIdempotencyKey("HANDOVER:" + review.getId() + ":" + payment.getId());
      refund.setPaymentId(payment.getId()); refund.setReservationId(reservation.getId()); refund.setContractId(contract.getId());
      refund.setUserId(contract.getUserId()); refund.setFacilityCode(contract.getFacilityCode()); refund.setRefundType("RENT");
      refund.setRequestedAmount(amount); refund.setApprovedAmount(amount); refund.setRequestedBy(review.getRequestedBy());
      // Full reasons remain in the review; legacy refund columns are varchar(255).
      refund.setApprovedBy(managerId); refund.setReason(summary(review.getReason())); refund.setDecisionReason(summary(reason));
      refund.setOnBehalfBasis(HandoverConfirmationPolicy.VERSION + "; hoàn 50% RENT, không hoàn cọc");
      refund.setExceptionRequested(false); refund.setStatus("APPROVED"); refund.setCreatedAt(now); refunds.save(refund);
      audit.record("CREATE_HANDOVER_RENT_REFUND", refund.getId(),
          HandoverConfirmationPolicy.VERSION + "; RENT thực thu=" + payment.getAmount() + "; hoàn=" + amount + "; không hoàn cọc");
      paidTotal = paidTotal.add(payment.getAmount()); refundTotal = refundTotal.add(amount);
    }
    if (paid.isEmpty() || invoice.getAmount() == null || paidTotal.compareTo(invoice.getAmount()) != 0)
      throw Inputs.conflict("Tổng giao dịch RENT thành công không khớp hóa đơn");
    review.setPaidRentAmount(paidTotal); review.setRefundAmount(refundTotal);
    reservation.setStatus("CANCELLED"); reservation.setCancelledAt(now); reservations.save(reservation);
    contract.setStatus("TERMINATED"); contract.setPinCode(null); contracts.save(contract);
    context.handover().setStatus("CANCELLED"); handovers.save(context.handover());
    unit.setStatus("available"); unit.setHeldByReservationId(null); unit.setTenantName(null);
    unit.setPinCode(null); unit.setTemporaryPin(null); unit.setTemporaryPinExpiresAt(null); units.save(unit);
    tasks.findByReservationIdAndTaskType(reservation.getId(), "CHECKIN").ifPresent(task -> {
      task.setStatus("CANCELLED"); tasks.save(task);
    });
  }

  @Transactional
  public HandoverReview respond(String id, Map<String, Object> input) {
    var customer = actor.require("CUSTOMER");
    var initial = reviews.findById(id).orElseThrow(Inputs::missing);
    if (!customer.getId().equals(initial.getUserId())) throw Inputs.missing();
    lock(initial.getContractId());
    var review = reviews.findById(id).orElseThrow(Inputs::missing);
    entityManager.refresh(review);
    if (!Set.of("REJECTED", "APPROVED").contains(review.getStatus())) throw Inputs.conflict("Manager chưa quyết định");
    if (review.getCustomerRespondedAt() != null) return review;
    review.setCustomerResponse(required(input, "response")); review.setCustomerRespondedAt(LocalDateTime.now(clock));
    reviews.save(review); audit.record("RESPOND_HANDOVER_DECISION", id, summary(review.getCustomerResponse()));
    return review;
  }

  public HandoverReviewEvidence evidence(String id) {
    var row = evidence.findById(id).orElseThrow(Inputs::missing);
    visible(reviews.findById(row.getReviewId()).orElseThrow(Inputs::missing));
    if (row.getEvidencePath() == null) throw Inputs.missing();
    return row;
  }

  private void saveEvidence(String reviewId, String note, MultipartFile file, String by) {
    var row = new HandoverReviewEvidence(); row.setId("HRE-" + UUID.randomUUID()); row.setReviewId(reviewId);
    row.setNote(note); row.setUploadedBy(by); row.setCreatedAt(LocalDateTime.now(clock));
    if (file != null && !file.isEmpty()) {
      String path = storage.save(file); row.setEvidencePath(path); row.setContentType(contentType(path));
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override public void afterCompletion(int status) { if (status != STATUS_COMMITTED) storage.remove(path); }
      });
    }
    evidence.save(row);
  }

  private String contentType(String path) {
    return path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : "image/jpeg";
  }

  private String required(Map<String, Object> input, String key) {
    String value = Inputs.text(input, key);
    if (value.length() > 4000) throw Inputs.bad(key + " tối đa 4000 ký tự");
    return value;
  }

  private String summary(String value) {
    return value.length() <= 240 ? value : value.substring(0, 240) + "…";
  }
}
