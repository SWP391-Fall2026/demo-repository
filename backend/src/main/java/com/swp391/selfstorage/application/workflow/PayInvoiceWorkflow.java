package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayInvoiceWorkflow {

  private final InvoiceRepository invoices;
  private final PaymentRepository payments;
  private final ReservationRepository reservations;
  private final ContractRepository contracts;
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final ReservationHoldPolicy holdPolicy;
  private final PaidRentActivationService rentActivation;

  public PayInvoiceWorkflow(
    InvoiceRepository i,
    PaymentRepository p,
    ReservationRepository r,
    ContractRepository c,
    UnitRepository u,
    ActorContext a,
    AuditLogService au,
    Clock cl,
    ReservationHoldPolicy holdPolicy,
    PaidRentActivationService rentActivation
  ) {
    invoices = i;
    payments = p;
    reservations = r;
    contracts = c;
    units = u;
    actor = a;
    audit = au;
    clock = cl;
    this.holdPolicy = holdPolicy;
    this.rentActivation = rentActivation;
  }

  @Transactional
  public Payment execute(Map<String, Object> d, String key) {
    var a = actor.require("CUSTOMER", "STAFF");
    String invoiceId = Inputs.text(d, "invoiceId");
    var i = invoices.lockById(invoiceId).orElseThrow(Inputs::missing);
    if (
      !actor.visible(a, i.getUserId(), i.getFacilityCode())
    ) throw Inputs.missing();
    if (key != null && !key.isBlank()) {
      var previous = payments.findByIdempotencyKey(key);
      if (previous.isPresent()) {
        if (
          !invoiceId.equals(previous.get().getInvoiceId())
        ) throw Inputs.conflict("Idempotency key belongs to another invoice");
        return previous.get();
      }
    }
    if (!"PENDING".equals(i.getStatus())) throw Inputs.conflict(
      "Hóa đơn không còn chờ thanh toán"
    );
    var now = LocalDateTime.now(clock);
    if ("DEPOSIT".equals(i.getInvoiceType())) {
      var r = reservations
        .lockById(i.getReservationId())
        .orElseThrow(Inputs::missing);
      if (
        !"PENDING_PAYMENT".equals(r.getStatus()) ||
        !r.getCreatedAt().plus(holdPolicy.pendingPaymentHold()).isAfter(now)
      ) throw Inputs.conflict("Đơn đã hết hạn đóng cọc");
    }
    if ("RENT".equals(i.getInvoiceType())) {
      var r = reservations
        .lockById(i.getReservationId())
        .orElseThrow(Inputs::missing);
      if (
        !"RESERVED".equals(r.getStatus()) || r.getUnitCode() == null
      ) throw Inputs.conflict("Chờ Manager gán phòng trước khi thu kỳ đầu");
      if (r.getIdentityVerifiedAt() == null || r.getContractTermsAcceptedAt() == null)
        throw Inputs.conflict("Khách cần được Staff xác minh tại quầy và xác nhận hợp đồng trước khi thanh toán thuê");
      if (contracts.findByReservationId(r.getId()).filter(c -> "PENDING_PAYMENT".equals(c.getStatus()) && c.getPinCode() == null).isEmpty())
        throw Inputs.conflict("Chưa có hợp đồng chờ thanh toán hoặc hợp đồng không còn hợp lệ");
    }
    if ("RENEW".equals(i.getInvoiceType())) {
      var c = contracts
        .lockById(i.getContractId())
        .orElseThrow(Inputs::missing);
      if (
        "TERMINATED".equals(c.getStatus()) || c.getCheckoutRequestedAt() != null
      ) throw Inputs.conflict("Hợp đồng không thể gia hạn");
    }
    String method = Inputs.text(d, "paymentMethod");
    if (
      !Set.of("MOCK_CARD", "BANK_TRANSFER_QR", "CASH_AT_COUNTER").contains(
        method
      )
    ) throw Inputs.bad("Phương thức thanh toán không hợp lệ");
    if ("MOCK_CARD".equals(method)) validateMockCard(d);
    if (
      "STAFF".equals(actor.role(a)) && !"CASH_AT_COUNTER".equals(method)
    ) throw Inputs.bad("Staff chỉ ghi nhận thu tại quầy");
    Payment p = new Payment();
    p.setId("PAY-" + UUID.randomUUID());
    p.setInvoiceId(i.getId());
    p.setReservationId(i.getReservationId());
    p.setContractId(i.getContractId());
    p.setUserId(i.getUserId());
    p.setFacilityCode(i.getFacilityCode());
    p.setCustomerName(a.getName());
    p.setInvoiceType(i.getInvoiceType());
    p.setAmount(i.getAmount());
    p.setPaymentMethod(method);
    p.setIdempotencyKey(key);
    p.setTransactionCode("MOCK-" + UUID.randomUUID());
    p.setCreatedAt(now);
    p.setTimeStr(now.toString());
    boolean failed = Boolean.TRUE.equals(d.get("simulateFailure"));
    p.setStatus(failed ? "FAILED" : "PAID");
    try {
      payments.saveAndFlush(p);
    } catch (org.springframework.dao.DataIntegrityViolationException e) {
      var existing = key == null || key.isBlank() ? Optional.<Payment>empty() : payments.findByIdempotencyKey(key);
      if (existing.isPresent()) {
        if (!invoiceId.equals(existing.get().getInvoiceId()))
          throw Inputs.conflict("Idempotency key belongs to another invoice");
        return existing.get();
      }
      throw Inputs.conflict("Thanh toán đã được xử lý");
    }
    if (!failed) {
      i.setStatus("PAID");
      invoices.save(i);
      if ("DEPOSIT".equals(i.getInvoiceType())) {
        var r = reservations.lockById(i.getReservationId()).orElseThrow();
        r.setStatus("RESERVED");
        r.setReservationExpiresAt(holdPolicy.reservationExpiry(now, r.getReservationHoldDaysSnapshot()));
        reservations.save(r);
      }
      if ("RENT".equals(i.getInvoiceType())) {
        var r = reservations.lockById(i.getReservationId()).orElseThrow(Inputs::missing);
        rentActivation.activate(i, r);
      }
      if ("RENEW".equals(i.getInvoiceType())) {
        var c = contracts
          .lockById(i.getContractId())
          .orElseThrow(Inputs::missing);
        int months = parseRenewalMonths(i);
        var start = c.getEndAt().isAfter(now) ? c.getEndAt() : now;
        c.setEndAt(start.plusMonths(months));
        c.setEndDate(c.getEndAt().toLocalDate());
        c.setMonthlyFee(parseMonthlySnapshot(i));
        c.setStatus("ACTIVE");
        if (c.getPinCode() == null) c.setPinCode(
          String.format(
            "%06d",
            new java.security.SecureRandom().nextInt(1000000)
          )
        );
        var unit = units
          .lockByCode(c.getUnitCode())
          .orElseThrow(Inputs::missing);
        unit.setPinCode(c.getPinCode());
        units.save(unit);
        c.setLastRenewalAt(now);
        contracts.save(c);
      }
    }
    audit.record(
      failed ? "PAYMENT_FAILED" : "PAYMENT_PAID",
      p.getId(),
      i.getInvoiceType() + " " + i.getAmount()
    );
    return p;
  }

  private int parseRenewalMonths(com.swp391.selfstorage.modules.billing.entity.Invoice i) {
    String description = i.getDescription() == null ? "" : i.getDescription();
    String[] parts = description.split(":");
    if (parts.length != 2) throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    try {
      int months = Integer.parseInt(parts[1]);
      if (months < 1) throw new NumberFormatException();
      return months;
    } catch (NumberFormatException e) {
      throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    }
  }

  private BigDecimal parseMonthlySnapshot(com.swp391.selfstorage.modules.billing.entity.Invoice i) {
    String snapshot = i.getPriceSnapshot() == null ? "" : i.getPriceSnapshot();
    if (!snapshot.startsWith("monthly=")) throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    try {
      return new BigDecimal(snapshot.substring("monthly=".length()));
    } catch (NumberFormatException e) {
      throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    }
  }

  private void validateMockCard(Map<String, Object> request) {    if (!Boolean.TRUE.equals(request.get("confirmedAmount"))) {
      throw Inputs.bad("Cần xác nhận số tiền thanh toán");
    }
    if (!"NCB".equals(Inputs.text(request, "bankCode"))) {
      throw Inputs.bad("Ngân hàng mock card không hợp lệ");
    }
    if (!"9704198526191432198".equals(Inputs.text(request, "cardNumber"))) {
      throw Inputs.bad("Số thẻ mock không hợp lệ");
    }
    if (!"NGUYEN VAN A".equalsIgnoreCase(Inputs.text(request, "cardHolder"))) {
      throw Inputs.bad("Tên chủ thẻ mock không hợp lệ");
    }
    if (!"07/15".equals(Inputs.text(request, "issueDate"))) {
      throw Inputs.bad("Ngày phát hành mock không hợp lệ");
    }
    if (!"123456".equals(Inputs.text(request, "otp"))) {
      throw Inputs.bad("OTP mock không hợp lệ");
    }
  }
}
