package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RenewalService {

  private final ContractRepository contracts;
  private final UnitRepository units;
  private final InvoiceService invoices;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final PolicyService policy;
  private final OverdueFeeCalculator fees;
  private final Clock clock;

  public RenewalService(
    ContractRepository c,
    UnitRepository u,
    InvoiceService i,
    ActorContext a,
    AuditLogService au,
    PolicyService p,
    OverdueFeeCalculator f,
    Clock cl
  ) {
    contracts = c;
    units = u;
    invoices = i;
    actor = a;
    audit = au;
    policy = p;
    fees = f;
    clock = cl;
  }

  public Map<String, Object> quote(String id, int months) {
    var u = actor.require("CUSTOMER");
    var c = contracts
      .findById(id)
      .filter(v -> u.getId().equals(v.getUserId()))
      .orElseThrow(Inputs::missing);
    if (Set.of("TERMINATED", "OVERDUE").contains(c.getStatus()) || c.getCheckoutRequestedAt() != null || months < 1 || months > 36)
      throw Inputs.bad("Không thể gia hạn");
    var unit = units.findById(c.getUnitCode()).orElseThrow(Inputs::missing);
    var rate = unit.getPricePerMonth();
    var overdue = fees.calculate(
      c.getEndAt().plusDays(policy.value("gracePeriodDays", BigDecimal.valueOf(3)).longValue()),
      LocalDateTime.now(clock),
      policy.fee("overdueDailyFee"),
      rate,
      policy.cap(c.getFacilityCode())
    );
    return Map.of(
      "contractId",
      id,
      "durationMonths",
      months,
      "monthlyRate",
      rate,
      "overdueFee",
      overdue,
      "totalAmount",
      rate.multiply(BigDecimal.valueOf(months)).add(overdue),
      "confirmationRequired",
      true
    );
  }

  @Transactional
  public Invoice confirm(String id, Map<String, Object> d) {
    final int months;
    try {
      months = Integer.parseInt(Inputs.text(d, "months"));
    } catch (NumberFormatException ex) {
      throw Inputs.bad("Số tháng gia hạn không hợp lệ");
    }
    if (!Boolean.TRUE.equals(d.get("priceConfirmed"))) throw Inputs.bad(
      "Khách cần xác nhận giá mới"
    );
    var c = contracts.lockById(id).orElseThrow(Inputs::missing);
    var q = quote(id, months);
    if (
      Inputs.money(d.get("expectedMonthlyRate")).compareTo(
        (BigDecimal) q.get("monthlyRate")
      ) != 0
    ) throw Inputs.conflict("Giá đã thay đổi, vui lòng lấy báo giá mới");
    var pending = invoices.findPendingRenewal(id);
    if (pending.isPresent()) {
      Invoice existing = pending.get();
      if (existing.getAmount().compareTo((BigDecimal) q.get("totalAmount")) == 0
          && ("RENEW:" + months).equals(existing.getDescription())
          && ("monthly=" + q.get("monthlyRate")).equals(existing.getPriceSnapshot())) return existing;
      throw Inputs.conflict("Đã có hóa đơn gia hạn đang chờ; thanh toán hoặc chọn lại hợp đồng");
    }
    Invoice i = invoices.issue(
      null,
      id,
      c.getUserId(),
      c.getFacilityCode(),
      "RENEW",
      (BigDecimal) q.get("totalAmount"),
      null,
      "monthly=" + q.get("monthlyRate")
    );
    i.setDescription("RENEW:" + months);
    audit.record("CONFIRM_RENEWAL_PRICE", i.getId(), q.toString());
    return i;
  }

  /**
   * Applies a successfully settled renewal invoice. Kept in one service so
   * mock, bank-counter and VNPay settlement produce the same contract state.
   */
  @Transactional
  public void activatePaidRenewal(Invoice invoice, LocalDateTime settledAt) {
    if (invoice == null || !"RENEW".equals(invoice.getInvoiceType()) ||
        !"PAID".equals(invoice.getStatus())) {
      throw Inputs.conflict("Hóa đơn gia hạn chưa sẵn sàng kích hoạt");
    }
    if (invoice.getContractId() == null || invoice.getDescription() == null ||
        !invoice.getDescription().startsWith("RENEW:")) {
      throw Inputs.conflict("Hóa đơn gia hạn thiếu thông tin hợp đồng");
    }
    final int months;
    try {
      months = Integer.parseInt(invoice.getDescription().substring("RENEW:".length()));
    } catch (NumberFormatException ex) {
      throw Inputs.conflict("Số tháng gia hạn không hợp lệ");
    }
    if (months < 1 || months > 36) throw Inputs.conflict("Số tháng gia hạn không hợp lệ");
    var c = contracts.lockById(invoice.getContractId()).orElseThrow(Inputs::missing);
    if (!Objects.equals(c.getUserId(), invoice.getUserId()) ||
        !Objects.equals(c.getFacilityCode(), invoice.getFacilityCode()) ||
        Set.of("TERMINATED", "OVERDUE").contains(c.getStatus()) ||
        c.getCheckoutRequestedAt() != null) {
      throw Inputs.conflict("Hợp đồng không thể gia hạn");
    }
    if (invoice.getPriceSnapshot() == null || !invoice.getPriceSnapshot().startsWith("monthly="))
      throw Inputs.conflict("Hóa đơn gia hạn thiếu giá đã chốt");
    BigDecimal monthly;
    try {
      monthly = new BigDecimal(invoice.getPriceSnapshot().substring("monthly=".length()));
    } catch (NumberFormatException ex) {
      throw Inputs.conflict("Giá gia hạn không hợp lệ");
    }
    if (monthly.signum() <= 0) throw Inputs.conflict("Giá gia hạn không hợp lệ");
    var now = settledAt == null ? LocalDateTime.now(clock) : settledAt;
    var start = c.getEndAt() != null && c.getEndAt().isAfter(now) ? c.getEndAt() : now;
    c.setEndAt(start.plusMonths(months));
    c.setEndDate(c.getEndAt().toLocalDate());
    c.setMonthlyFee(monthly);
    c.setStatus("ACTIVE");
    if (c.getPinCode() == null) c.setPinCode(String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000)));
    var unit = units.lockByCode(c.getUnitCode()).orElseThrow(Inputs::missing);
    unit.setPinCode(c.getPinCode());
    units.save(unit);
    c.setLastRenewalAt(now);
    contracts.save(c);
  }
}
