package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.NoShowRules;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefundRequestService {

  private final RefundRequestRepository refunds;
  private final PaymentRepository payments;
  private final ReservationRepository reservations;
  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final RefundLimitCalculator limits;
  private final NoShowRules noShow;
  private final Clock clock;
  private final com.swp391.selfstorage.modules.reservation.service.CancellationPolicy cancellation;
  private final com.swp391.selfstorage.modules.rental.repository.HandoverReviewRepository handoverReviews;

  public RefundRequestService(
    RefundRequestRepository r,
    PaymentRepository p,
    ReservationRepository rs,
    ContractRepository c,
    InspectionRecordRepository i,
    ActorContext a,
    AuditLogService au,
    RefundLimitCalculator l,
    NoShowRules n,
    Clock cl,
    com.swp391.selfstorage.modules.reservation.service.CancellationPolicy cancellation,
    com.swp391.selfstorage.modules.rental.repository.HandoverReviewRepository handoverReviews
  ) {
    refunds = r;
    payments = p;
    reservations = rs;
    contracts = c;
    inspections = i;
    actor = a;
    audit = au;
    limits = l;
    noShow = n;
    clock = cl;
    this.cancellation = cancellation;
    this.handoverReviews = handoverReviews;
  }

  public List<RefundRequest> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return refunds
      .findAll()
      .stream()
      .filter(r -> actor.visible(u, r.getUserId(), r.getFacilityCode()))
      .toList();
  }

  @Transactional
  public RefundRequest create(Map<String, Object> d, String key) {
    var u = actor.require("CUSTOMER", "STAFF");
    var p = payments
      .lockById(Inputs.text(d, "paymentId"))
      .orElseThrow(Inputs::missing);
    if (
      !actor.visible(u, p.getUserId(), p.getFacilityCode())
    ) throw Inputs.missing();
    if (p.getReservationId() != null && handoverReviews.existsByReservationIdAndStatus(p.getReservationId(), "APPROVED"))
      throw Inputs.conflict("Hủy trước bàn giao đã tạo hoàn 50% RENT; tiền cọc không hoàn và không tạo thêm yêu cầu");
    if (!"PAID".equals(p.getStatus())) throw Inputs.conflict(
      "Giao dịch gốc chưa thanh toán thành công"
    );
    if (key != null) {
      var old = refunds
        .findByPaymentId(p.getId())
        .stream()
        .filter(r -> key.equals(r.getIdempotencyKey()))
        .findFirst();
      if (old.isPresent()) return old.get();
    }
    String basis = "STAFF".equals(actor.role(u))
      ? Inputs.text(d, "onBehalfBasis")
      : "CUSTOMER_SELF";
    var now = LocalDateTime.now(clock);
    boolean exception = Boolean.TRUE.equals(d.get("exceptionRequested"));
    BigDecimal base = p.getAmount();
    if (p.getReservationId() != null) {
      var r = reservations
        .findById(p.getReservationId())
        .orElseThrow(Inputs::missing);
      if ("NO_SHOW".equals(r.getStatus())) {
        if (
          noShow.appointment(r) == null || now.isAfter(noShow.refundDeadline(r))
        ) throw Inputs.conflict(
          "Đã hết 24 giờ gửi yêu cầu hoàn ngoại lệ NO_SHOW"
        );
        exception = true;
      } else if ("CANCELLED".equals(r.getStatus())) {
        var start =
          r.getRentalStartAt() != null
            ? r.getRentalStartAt()
            : r.getStartDate().atStartOfDay();
        var cancelled = r.getCancelledAt() != null ? r.getCancelledAt() : now;
        if (
          "DEPOSIT".equals(p.getInvoiceType()) &&
          !cancellation.fullDepositRefund(start, cancelled) &&
          !exception
        ) throw Inputs.conflict(
          "Hủy dưới 24 giờ không hoàn cọc theo chính sách; có thể gửi ngoại lệ có lý do"
        );
      } else if (!"CHECKED_IN".equals(r.getStatus())) throw Inputs.conflict(
        "Đơn cần được hủy hoặc xác nhận NO_SHOW trước khi yêu cầu hoàn"
      );
      if ("CHECKED_IN".equals(r.getStatus())) {
        var c = contracts
          .findByReservationId(r.getId())
          .filter(v -> "TERMINATED".equals(v.getStatus()))
          .orElseThrow(() ->
            Inputs.conflict("Cần nghiệm thu trả kho trước khi hoàn cọc")
          );
        if ("DEPOSIT".equals(p.getInvoiceType())) base = inspections
          .findAll()
          .stream()
          .filter(i -> c.getId().equals(i.getContractId()))
          .map(i -> i.getDepositRefundAmount())
          .findFirst()
          .orElse(BigDecimal.ZERO);
      }
    }
    var existing = refunds.findByPaymentId(p.getId());
    BigDecimal completed = BigDecimal.ZERO,
      reserved = BigDecimal.ZERO;
    for (var r : existing) {
      if ("COMPLETED".equals(r.getStatus())) completed = completed.add(
        r.getApprovedAmount()
      );
      else if ("PENDING".equals(r.getStatus())) reserved = reserved.add(
        r.getRequestedAmount()
      );
      else if (
        Set.of("APPROVED", "EVIDENCE_SUBMITTED").contains(r.getStatus())
      ) reserved = reserved.add(r.getApprovedAmount());
    }
    var amount = Inputs.money(d.get("amount"));
    limits.require(
      amount,
      limits.available(base.min(p.getAmount()), completed, reserved)
    );
    RefundRequest r = new RefundRequest();
    r.setId("REF-" + UUID.randomUUID());
    r.setIdempotencyKey(key);
    r.setPaymentId(p.getId());
    r.setReservationId(p.getReservationId());
    r.setContractId(p.getContractId());
    r.setUserId(p.getUserId());
    r.setFacilityCode(p.getFacilityCode());
    r.setRefundType("DEPOSIT".equals(p.getInvoiceType()) ? "DEPOSIT" : "RENT");
    r.setRequestedAmount(amount);
    r.setApprovedAmount(BigDecimal.ZERO);
    r.setRequestedBy(u.getId());
    r.setOnBehalfBasis(basis);
    r.setExceptionRequested(exception);
    r.setReason(Inputs.text(d, "reason"));
    r.setStatus("PENDING");
    r.setCreatedAt(now);
    refunds.save(r);
    audit.record(
      "REQUEST_REFUND",
      r.getId(),
      "Giữ hạn mức " + amount + "; " + r.getReason()
    );
    return r;
  }

  private RefundRequest lock(String id) {
    var initial = refunds.findById(id).orElseThrow(Inputs::missing);
    payments.lockById(initial.getPaymentId()).orElseThrow(Inputs::missing);
    return refunds.lockById(id).orElseThrow(Inputs::missing);
  }

  @Transactional
  public RefundRequest cancel(String id) {
    var u = actor.require("CUSTOMER");
    var r = lock(id);
    if (!u.getId().equals(r.getUserId())) throw Inputs.missing();
    if (!"PENDING".equals(r.getStatus())) throw Inputs.conflict(
      "Chỉ hủy trước khi được phê duyệt"
    );
    r.setStatus("CANCELLED");
    refunds.save(r);
    audit.record("CANCEL_REFUND", id, "Giải phóng hạn mức");
    return r;
  }

  @Transactional
  public RefundRequest decide(String id, Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    var r = lock(id);
    actor.facility(m, r.getFacilityCode());
    if (!"PENDING".equals(r.getStatus())) throw Inputs.conflict(
      "Yêu cầu đã được xử lý"
    );
    String decision = Inputs.text(d, "decision"),
      reason = Inputs.text(d, "reason");
    if ("APPROVE".equals(decision)) {
      if (r.getHandoverReviewId() == null && r.getReservationId() != null
          && handoverReviews.existsByReservationIdAndStatus(r.getReservationId(), "APPROVED"))
        throw Inputs.conflict("Hủy bàn giao chỉ hoàn theo hồ sơ 50% RENT đã duyệt; không duyệt khoản hoàn bổ sung");
      var amount = Inputs.money(d.get("approvedAmount"));
      limits.require(amount, r.getRequestedAmount());
      r.setApprovedAmount(amount);
      r.setStatus("APPROVED");
    } else if ("REJECT".equals(decision)) {
      r.setStatus("REJECTED");
    } else throw Inputs.bad("Quyết định không hợp lệ");
    r.setApprovedBy(m.getId());
    r.setDecisionReason(reason);
    refunds.save(r);
    audit.record("DECIDE_REFUND", id, decision + "; " + reason);
    return r;
  }
}
