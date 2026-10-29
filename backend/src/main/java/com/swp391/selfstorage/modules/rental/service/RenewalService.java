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
    if ("TERMINATED".equals(c.getStatus()) || c.getCheckoutRequestedAt() != null || months < 1 || months > 36)
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
    int months = Integer.parseInt(Inputs.text(d, "months"));
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
      if (months == 1 && existing.getAmount().compareTo((BigDecimal) q.get("totalAmount")) == 0) return existing;
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
}
