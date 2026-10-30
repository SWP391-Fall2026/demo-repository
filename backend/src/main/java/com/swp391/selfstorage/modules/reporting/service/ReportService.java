package com.swp391.selfstorage.modules.reporting.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final PaymentRepository payments;
  private final RefundRequestRepository refunds;
  private final UserRepository users;
  private final ActorContext actor;

  public ReportService(
    FacilityRepository f,
    UnitRepository u,
    PaymentRepository p,
    RefundRequestRepository r,
    UserRepository us,
    ActorContext a
  ) {
    facilities = f;
    units = u;
    payments = p;
    refunds = r;
    users = us;
    actor = a;
  }

  public Map<String, Object> chain() {
    actor.require("OPS_MGR");
    return aggregate(null);
  }

  public Map<String, Object> facility() {
    var u = actor.require("FMANAGER");
    return aggregate(u.getFacilityCode());
  }

  public Map<String, Object> system() {
    actor.require("ADMIN");
    return Map.of("users", users.count(), "facilities", facilities.count());
  }

  private Map<String, Object> aggregate(String code) {
    var rows = units
      .findAll()
      .stream()
      .filter(u -> code == null || code.equals(u.getFacilityCode()))
      .toList();
    var paid = payments
      .findAll()
      .stream()
      .filter(
        p ->
          "PAID".equals(p.getStatus()) &&
          (code == null || code.equals(p.getFacilityCode()))
      )
      .toList();
    BigDecimal rent = paid
      .stream()
      .filter(p -> !"DEPOSIT".equals(p.getInvoiceType()))
      .map(p -> p.getAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal deposit = paid
      .stream()
      .filter(p -> "DEPOSIT".equals(p.getInvoiceType()))
      .map(p -> p.getAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal returned = refunds
      .findAll()
      .stream()
      .filter(
        r ->
          "COMPLETED".equals(r.getStatus()) &&
          (code == null || code.equals(r.getFacilityCode()))
      )
      .map(r -> r.getApprovedAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    long occupied = rows
      .stream()
      .filter(u -> "occupied".equals(u.getStatus()))
      .count();
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("totalBranches", code == null ? facilities.count() : 1);
    m.put("totalUnits", rows.size());
    m.put("occupiedUnits", occupied);
    m.put(
      "availableUnits",
      rows
        .stream()
        .filter(u -> "available".equals(u.getStatus()))
        .count()
    );
    m.put(
      "occupancyRate",
      rows.isEmpty()
        ? 0
        : Math.round((occupied * 10000.0) / rows.size()) / 100.0
    );
    m.put("rentalReceipts", rent);
    m.put("depositReceipts", deposit);
    m.put("completedRefunds", returned);
    return m;
  }
}
