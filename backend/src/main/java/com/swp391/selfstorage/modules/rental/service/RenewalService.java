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
    int maxMonths;
    try {
      maxMonths = policy.value("renewalMaxMonths", new BigDecimal(36)).intValueExact();
    } catch (ArithmeticException e) {
      throw Inputs.bad("Thông số renewalMaxMonths không hợp lệ");
    }
    if (
      "TERMINATED".equals(c.getStatus()) || months < 1 || months > maxMonths
    ) throw Inputs.bad("Không thể gia hạn");
    var unit = units.findById(c.getUnitCode()).orElseThrow(Inputs::missing);
    var rate = unit.getPricePerMonth();
    var overdue = fees.calculate(
      c.getEndAt(),
      LocalDateTime.now(clock),
      policy.fee("overdueDailyFee"),
      rate,
      policy.cap(c.getFacilityCode()),
      graceDays()
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

  private long graceDays() {
    try {
      return Math.max(0, policy.value("gracePeriodDays", BigDecimal.ZERO).longValueExact());
    } catch (ArithmeticException e) {
      return 0;
    }
  }

  @Transactional
  public Map<String, Object> confirm(String id, Map<String, Object> d) {
    int months = Integer.parseInt(Inputs.text(d, "months"));
    if (!Boolean.TRUE.equals(d.get("priceConfirmed"))) throw Inputs.bad(
      "Khách cần xác nhận giá mới"
    );
    var c = contracts.lockById(id).orElseThrow(Inputs::missing);
    if (invoices.hasPendingRenewal(id)) throw Inputs.conflict(
      "Đã có hóa đơn gia hạn đang chờ"
    );
    var q = quote(id, months);
    if (
      Inputs.money(d.get("expectedMonthlyRate")).compareTo(
        (BigDecimal) q.get("monthlyRate")
      ) != 0
    ) throw Inputs.conflict("Giá đã thay đổi, vui lòng lấy báo giá mới");
    BigDecimal rentAmount = ((BigDecimal) q.get("monthlyRate")).multiply(BigDecimal.valueOf(months));
    Invoice i = invoices.issue(
      null,
      id,
      c.getUserId(),
      c.getFacilityCode(),
      "RENEW",
      rentAmount,
      null,
      "monthly=" + q.get("monthlyRate")
    );
    i.setDescription("RENEW:" + months);
    audit.record("CONFIRM_RENEWAL_PRICE", i.getId(), q.toString());
    BigDecimal overdue = (BigDecimal) q.get("overdueFee");
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("renewalInvoice", i);
    if (overdue.signum() > 0) {
      Invoice late = invoices.issue(
        null,
        id,
        c.getUserId(),
        c.getFacilityCode(),
        "OVERDUE",
        overdue,
        null,
        "overdue-for-renewal:" + months
      );
      late.setDescription("OVERDUE:" + id);
      audit.record("ISSUE_OVERDUE_FOR_RENEWAL", late.getId(), overdue.toPlainString());
      result.put("overdueInvoice", late);
    }
    return result;
  }
}
