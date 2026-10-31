package com.swp391.selfstorage.modules.reporting.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.repository.InspectionRecordRepository;
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
  private final InspectionRecordRepository inspections;
  private final ActorContext actor;

  public ReportService(
    FacilityRepository f,
    UnitRepository u,
    PaymentRepository p,
    RefundRequestRepository r,
    UserRepository us,
    InspectionRecordRepository inspections,
    ActorContext a
  ) {
    facilities = f;
    units = u;
    payments = p;
    refunds = r;
    users = us;
    this.inspections = inspections;
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
    Map<String, String> facilityNames = new HashMap<>();
    facilities.findAll().forEach(f -> facilityNames.put(f.getCode(), f.getName()));
    Set<String> codes = new TreeSet<>();
    facilities.findAll().stream()
      .filter(f -> code == null || code.equals(f.getCode()))
      .forEach(f -> codes.add(f.getCode()));
    for (var row : rows) if (row.getFacilityCode() != null) codes.add(row.getFacilityCode());
    if (code != null) codes.add(code);
    for (String branch : codes) {
      var branchUnits = rows.stream().filter(u -> branch.equals(u.getFacilityCode())).toList();
      long filled = branchUnits.stream().filter(u -> "occupied".equalsIgnoreCase(u.getStatus())).count();
      long vacant = branchUnits.stream().filter(u -> "available".equalsIgnoreCase(u.getStatus())).count();
      long reserved = branchUnits.stream().filter(u -> "reserved".equalsIgnoreCase(u.getStatus())).count();
      long maintenance = branchUnits.stream().filter(u ->
          Set.of("maintenance", "cleaning").contains(
            Objects.toString(u.getStatus(), "").toLowerCase(Locale.ROOT)
          )).count();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("facilityCode", branch);
      row.put("facilityName", facilityNames.getOrDefault(branch, branch));
      row.put("totalUnits", branchUnits.size());
      row.put("occupiedUnits", filled);
      row.put("vacantUnits", vacant);
      row.put("reservedUnits", reserved);
      row.put("maintenanceUnits", maintenance);
      row.put("occupancyRate", branchUnits.isEmpty() ? 0 : Math.round((filled * 10000.0) / branchUnits.size()) / 100.0);
      branches.add(row);
    }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("scope", code);
    result.put("branches", branches);
    return result;
  }

  private List<Map<String, Object>> revenueTimeline(
      List<com.swp391.selfstorage.modules.billing.entity.Payment> paid,
      List<com.swp391.selfstorage.modules.billing.entity.RefundRequest> completedRefunds,
      String granularity) {
    String mode = granularity == null ? "month" : granularity.trim().toLowerCase();
    if (!Set.of("day", "month", "quarter").contains(mode)) {
      throw Inputs.bad("granularity phải là day, month hoặc quarter");
    }
    Map<String, BigDecimal> receipts = new TreeMap<>();
    Map<String, BigDecimal> refundsByBucket = new TreeMap<>();
    for (var p : paid) {
      if (p.getCreatedAt() == null || "DEPOSIT".equalsIgnoreCase(p.getInvoiceType())) continue;
      String bucket = period(p.getCreatedAt().toLocalDate(), mode);
      BigDecimal amount = p.getAmount() == null ? BigDecimal.ZERO : p.getAmount();
      receipts.merge(bucket, amount, BigDecimal::add);
    }
    for (var refund : completedRefunds) {
      if (refund.getCompletedAt() == null || "DEPOSIT".equalsIgnoreCase(refund.getRefundType())) continue;
      refundsByBucket.merge(period(refund.getCompletedAt().toLocalDate(), mode),
          refund.getApprovedAmount() == null ? BigDecimal.ZERO : refund.getApprovedAmount(),
          BigDecimal::add);
    }
    Set<String> periods = new TreeSet<>(receipts.keySet());
    periods.addAll(refundsByBucket.keySet());
    List<Map<String, Object>> timeline = new ArrayList<>();
    for (String bucket : periods) {
      BigDecimal gross = receipts.getOrDefault(bucket, BigDecimal.ZERO);
      BigDecimal returned = refundsByBucket.getOrDefault(bucket, BigDecimal.ZERO);
      timeline.add(Map.of(
        "period", bucket,
        "amount", gross.subtract(returned),
        "grossReceipts", gross,
        "rentalRefunds", returned
      ));
    }
    return timeline;
  }

  private String period(LocalDate date, String mode) {
    return switch (mode) {
      case "day" -> date.toString();
      case "quarter" -> date.getYear() + "-Q" + ((date.getMonthValue() - 1) / 3 + 1);
      default -> "%04d-%02d".formatted(date.getYear(), date.getMonthValue());
    };
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
    if (value == null) return false;
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
    BigDecimal rent = rentByType.getOrDefault("RENT", BigDecimal.ZERO);
    BigDecimal renewal = rentByType.getOrDefault("RENEW", BigDecimal.ZERO);
    BigDecimal deposit = rentByType.getOrDefault("DEPOSIT", BigDecimal.ZERO);
    BigDecimal penalty = penaltyByType.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    var scopedInspections = inspections.findByContractFacilityCode(code);
    BigDecimal depositDeductions = scopedInspections.stream()
      .filter(i -> "COMPLETED".equalsIgnoreCase(i.getStatus()))
      .filter(i -> i.getCompletedAt() != null && inRange(i.getCompletedAt().toLocalDate(), from, to))
      .map(i -> i.getPenaltyFee() == null ? BigDecimal.ZERO : i.getPenaltyFee())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    var candidateRefunds = code == null
      ? refunds.findByStatusIgnoreCase("COMPLETED")
      : refunds.findByStatusIgnoreCaseAndFacilityCode("COMPLETED", code);
    var completedRefunds = candidateRefunds.stream()
      .filter(r -> inRange(r.getCompletedAt() == null ? null : r.getCompletedAt().toLocalDate(), from, to))
      .toList();
    BigDecimal returned = completedRefunds.stream()
      .map(r -> r.getApprovedAmount() == null ? BigDecimal.ZERO : r.getApprovedAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal depositRefunds = completedRefunds.stream()
      .filter(r -> "DEPOSIT".equalsIgnoreCase(r.getRefundType()))
      .map(r -> r.getApprovedAmount() == null ? BigDecimal.ZERO : r.getApprovedAmount())
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal rentalRefunds = returned.subtract(depositRefunds);
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
    m.put("reservedUnits", rows.stream().filter(u -> "reserved".equalsIgnoreCase(u.getStatus())).count());
    m.put("maintenanceUnits", rows.stream().filter(u ->
        Set.of("maintenance", "cleaning").contains(Objects.toString(u.getStatus(), "").toLowerCase(Locale.ROOT))).count());
    m.put(
      "occupancyRate",
      rows.isEmpty()
        ? 0
        : Math.round((occupied * 10000.0) / rows.size()) / 100.0
    );
    m.put("occupancyByBranch", occupancyBreakdown(code, rows));
    m.put("rentalReceipts", rent);
    m.put("renewalReceipts", renewal);
    m.put("depositReceipts", deposit);
    m.put("penaltyReceipts", penalty);
    m.put("depositDeductions", depositDeductions);
    m.put("completedRefunds", returned);
    m.put("depositRefunds", depositRefunds);
    m.put("rentalRefunds", rentalRefunds);
    m.put("grossOperatingReceipts", rent.add(renewal).add(penalty));
    m.put("netOperatingReceipts", rent.add(renewal).add(penalty).subtract(rentalRefunds));
    m.put("revenueBySource", revenueBySource(rentByType, penaltyByType, depositDeductions));
    m.put("revenueTimeline", revenueTimeline(paid, completedRefunds, granularity));
    m.put("hasRevenueData", !paid.isEmpty() || !completedRefunds.isEmpty() || depositDeductions.signum() > 0);
    m.put("hasData", !paid.isEmpty() || !completedRefunds.isEmpty() || !rows.isEmpty() || facilities.count() > 0);
    return m;
  }

  private Map<String, BigDecimal> revenueBySource(Map<String, BigDecimal> rent, Map<String, BigDecimal> penalty, BigDecimal depositDeductions) {
    Map<String, BigDecimal> sources = new LinkedHashMap<>();
    sources.put("RENT", rent.getOrDefault("RENT", BigDecimal.ZERO));
    sources.put("RENEW", rent.getOrDefault("RENEW", BigDecimal.ZERO));
    for (var entry : penalty.entrySet()) {
      if ("OVERDUE".equals(entry.getKey())) sources.put("OVERDUE_FEE", entry.getValue());
      else sources.merge(entry.getKey(), entry.getValue(), BigDecimal::add);
    }
    sources.put("DEPOSIT_DEDUCTION", depositDeductions);
    return sources;
  }
}
