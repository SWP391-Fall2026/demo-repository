package com.swp391.selfstorage.modules.reporting.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.math.*;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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
    return aggregate(null, null, null, "month");
  }

  public Map<String, Object> facility() {
    var u = actor.require("FMANAGER");
    return aggregate(u.getFacilityCode(), null, null, "month");
  }

  public Map<String, Object> system() {
    actor.require("ADMIN");
    return Map.of("users", users.count(), "facilities", facilities.count());
  }

  public Map<String, Object> revenue(String facilityCode, String from, String to, String granularity) {
    var u = actor.require("OPS_MGR", "FMANAGER", "ADMIN");
    String requested = "OPS_MGR".equals(actor.role(u)) || "ADMIN".equals(actor.role(u)) ? facilityCode : u.getFacilityCode();
    if (requested != null && requested.isBlank()) requested = null;
    if (requested != null && "FMANAGER".equals(actor.role(u))) actor.facility(u, requested);
    LocalDate fromDate = parseDate(from, "from");
    LocalDate toDate = parseDate(to, "to");
    if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) throw Inputs.bad(
      "Khoảng thời gian không hợp lệ"
    );
    return aggregate(requested, fromDate, toDate, granularity);
  }

  public Map<String, Object> occupancy(String facilityCode) {
    var u = actor.require("OPS_MGR", "FMANAGER", "ADMIN");
    String rawScope = "OPS_MGR".equals(actor.role(u)) || "ADMIN".equals(actor.role(u)) ? facilityCode : u.getFacilityCode();
    if (rawScope != null && rawScope.isBlank()) rawScope = null;
    if (rawScope != null && "FMANAGER".equals(actor.role(u))) actor.facility(u, rawScope);
    final String scope = rawScope;
    var scopedUnits = scope == null ? units.findAll() : units.findByFacilityCode(scope);
    return occupancyBreakdown(scope, scopedUnits);
  }

  private Map<String, Object> occupancyBreakdown(String code,
      List<com.swp391.selfstorage.modules.facility.entity.Unit> rows) {
    List<Map<String, Object>> branches = new ArrayList<>();
    Set<String> codes = new TreeSet<>();
    for (var row : rows) if (row.getFacilityCode() != null) codes.add(row.getFacilityCode());
    if (codes.isEmpty() && code != null) codes.add(code);
    for (String branch : codes) {
      var branchUnits = rows.stream().filter(u -> branch.equals(u.getFacilityCode())).toList();
      long filled = branchUnits.stream().filter(u -> "occupied".equalsIgnoreCase(u.getStatus())).count();
      long vacant = branchUnits.stream().filter(u -> "available".equalsIgnoreCase(u.getStatus())).count();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("facilityCode", branch);
      row.put("totalUnits", branchUnits.size());
      row.put("occupiedUnits", filled);
      row.put("vacantUnits", vacant);
      row.put("occupancyRate", branchUnits.isEmpty() ? 0 : Math.round((filled * 10000.0) / branchUnits.size()) / 100.0);
      branches.add(row);
    }
    branches.sort(Comparator.comparingDouble(branch -> ((Number) branch.get("occupancyRate")).doubleValue()));
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("scope", code);
    result.put("branches", branches);
    return result;
  }

  private List<Map<String, Object>> revenueTimeline(List<com.swp391.selfstorage.modules.billing.entity.Payment> paid, String granularity) {
    String mode = granularity == null ? "month" : granularity.trim().toLowerCase();
    if (!Set.of("day", "month", "quarter").contains(mode)) {
      throw Inputs.bad("granularity phải là day, month hoặc quarter");
    }
    Map<String, BigDecimal> buckets = new TreeMap<>();
    for (var p : paid) {
      if (p.getCreatedAt() == null) continue;
      LocalDate date = p.getCreatedAt().toLocalDate();
      String bucket = switch (mode) {
        case "day" -> date.toString();
        case "quarter" -> date.getYear() + "-Q" + ((date.getMonthValue() - 1) / 3 + 1);
        default -> "%04d-%02d".formatted(date.getYear(), date.getMonthValue());
      };
      BigDecimal amount = p.getAmount() == null ? BigDecimal.ZERO : p.getAmount();
      buckets.merge(bucket, amount, BigDecimal::add);
    }
    List<Map<String, Object>> timeline = new ArrayList<>();
    for (var entry : buckets.entrySet()) timeline.add(Map.of("period", entry.getKey(), "amount", entry.getValue()));
    return timeline;
  }

  private LocalDate parseDate(String value, String field) {
    if (value == null || value.isBlank()) return null;
    try {
      return LocalDate.parse(value.trim());
    } catch (DateTimeParseException e) {
      throw Inputs.bad(field + " phải có định dạng yyyy-MM-dd");
    }
  }

  private boolean inRange(LocalDate value, LocalDate from, LocalDate to) {
    if (value == null) return from == null && to == null;
    if (from != null && value.isBefore(from)) return false;
    return to == null || !value.isAfter(to);
  }

  private Map<String, Object> aggregate(String code, LocalDate from, LocalDate to, String granularity) {
    var rows = code == null ? units.findAll() : units.findByFacilityCode(code);
    var candidatePaid = code == null
      ? payments.findByStatusIgnoreCase("PAID")
      : payments.findByStatusIgnoreCaseAndFacilityCode("PAID", code);
    var paid = candidatePaid.stream()
      .filter(p -> inRange(p.getCreatedAt() == null ? null : p.getCreatedAt().toLocalDate(), from, to))
      .toList();
    Map<String, BigDecimal> rentByType = new LinkedHashMap<>();
    Map<String, BigDecimal> penaltyByType = new LinkedHashMap<>();
    for (var p : paid) {
      String type = p.getInvoiceType() == null ? "RENT" : p.getInvoiceType().trim().toUpperCase();
      BigDecimal amount = p.getAmount() == null ? BigDecimal.ZERO : p.getAmount();
      if ("DEPOSIT".equals(type) || "RENT".equals(type) || "RENEW".equals(type)) {
        rentByType.merge(type, amount, BigDecimal::add);
      } else {
        penaltyByType.merge(type, amount, BigDecimal::add);
      }
    }
    BigDecimal rent = rentByType.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal deposit = rentByType.getOrDefault("DEPOSIT", BigDecimal.ZERO);
    BigDecimal penalty = penaltyByType.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    var candidateRefunds = code == null
      ? refunds.findByStatusIgnoreCase("COMPLETED")
      : refunds.findByStatusIgnoreCaseAndFacilityCode("COMPLETED", code);
    BigDecimal returned = candidateRefunds.stream()
      .map(r -> r.getApprovedAmount() == null ? BigDecimal.ZERO : r.getApprovedAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    long occupied = rows
      .stream()
      .filter(u -> "occupied".equalsIgnoreCase(u.getStatus()))
      .count();
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("totalBranches", code == null ? facilities.count() : 1);
    m.put("totalUnits", rows.size());
    m.put("occupiedUnits", occupied);
    m.put(
      "availableUnits",
      rows
        .stream()
        .filter(u -> "available".equalsIgnoreCase(u.getStatus()))
        .count()
    );
    m.put(
      "occupancyRate",
      rows.isEmpty()
        ? 0
        : Math.round((occupied * 10000.0) / rows.size()) / 100.0
    );
    m.put("occupancyByBranch", occupancyBreakdown(code, rows));
    m.put("rentalReceipts", rent);
    m.put("depositReceipts", deposit);
    m.put("penaltyReceipts", penalty);
    m.put("revenueBySource", revenueBySource(rentByType, penaltyByType));
    m.put("revenueTimeline", revenueTimeline(paid, granularity));
    m.put("completedRefunds", returned);
    m.put("hasData", !paid.isEmpty() || !rows.isEmpty());
    return m;
  }

  private Map<String, BigDecimal> revenueBySource(Map<String, BigDecimal> rent, Map<String, BigDecimal> penalty) {
    Map<String, BigDecimal> sources = new LinkedHashMap<>();
    sources.put("RENT", rent.getOrDefault("RENT", BigDecimal.ZERO));
    sources.put("RENEW", rent.getOrDefault("RENEW", BigDecimal.ZERO));
    sources.put("DEPOSIT", rent.getOrDefault("DEPOSIT", BigDecimal.ZERO));
    for (var entry : penalty.entrySet()) sources.merge(entry.getKey(), entry.getValue(), BigDecimal::add);
    return sources;
  }
}
