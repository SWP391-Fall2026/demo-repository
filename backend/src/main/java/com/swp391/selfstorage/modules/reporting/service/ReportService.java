package com.swp391.selfstorage.modules.reporting.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import java.math.BigDecimal;
import java.sql.Types;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class ReportService {
  private final NamedParameterJdbcTemplate jdbc;
  private final ActorContext actor;
  private final UserRepository users;
  private final FacilityRepository facilities;

  public ReportService(NamedParameterJdbcTemplate jdbc, ActorContext actor,
      UserRepository users, FacilityRepository facilities) {
    this.jdbc = jdbc; this.actor = actor; this.users = users; this.facilities = facilities;
  }

  public Map<String, Object> chain(LocalDate start, LocalDate end) {
    return chain(start, end, null);
  }
  public Map<String, Object> chain(LocalDate start, LocalDate end, String contractStatus) {
    actor.require("OPS_MGR"); return aggregate(null, start, end, contractStatus);
  }
  public Map<String, Object> facility(LocalDate start, LocalDate end) {
    return facility(start, end, null);
  }
  public Map<String, Object> facility(LocalDate start, LocalDate end, String contractStatus) {
    var user = actor.require("FMANAGER");
    if (user.getFacilityCode() == null) throw Inputs.bad("Tài khoản chưa được gán cơ sở");
    return aggregate(user.getFacilityCode(), start, end, contractStatus);
  }
  public Map<String, Object> system() {
    actor.require("ADMIN"); return Map.of("users", users.count(), "facilities", facilities.count());
  }

  public byte[] export(String requestedCode, LocalDate start, LocalDate end, String format) {
    return export(requestedCode, start, end, format, null);
  }
  public byte[] export(String requestedCode, LocalDate start, LocalDate end, String format, String contractStatus) {
    var user = actor.require("FMANAGER", "OPS_MGR");
    String code = requestedCode == null || requestedCode.isBlank() ? null : requestedCode;
    if ("FMANAGER".equals(actor.role(user))) {
      actor.facility(user, code == null ? user.getFacilityCode() : code);
      code = user.getFacilityCode();
    }
    if (!Set.of("csv", "xlsx").contains(format)) throw Inputs.bad("Chọn định dạng CSV hoặc XLSX");
    return ReportExport.write(aggregate(code, start, end, contractStatus), format);
  }

  private Map<String, Object> aggregate(String code, LocalDate start, LocalDate end, String requestedContractStatus) {
    if (start != null && end != null && start.isAfter(end)) throw Inputs.bad("Ngày bắt đầu không được sau ngày kết thúc");
    if (code != null && !facilities.existsById(code)) throw Inputs.missing();
    String contractStatus = requestedContractStatus == null ? "" : requestedContractStatus.trim().toUpperCase(Locale.ROOT);
    if (!contractStatus.isBlank() && !Set.of("PENDING_PAYMENT", "PENDING_HANDOVER", "ACTIVE", "EXPIRING_SOON", "OVERDUE", "TERMINATED", "CANCELLED").contains(contractStatus))
      throw Inputs.bad("Trạng thái thuê không hợp lệ");
    var params = new MapSqlParameterSource().addValue("code", code, Types.VARCHAR);
    if (!contractStatus.isBlank()) params.addValue("contractStatus", contractStatus, Types.VARCHAR);
    if (start != null) params.addValue("start", start.atStartOfDay(), Types.TIMESTAMP);
    if (end != null) params.addValue("end", end.plusDays(1).atStartOfDay(), Types.TIMESTAMP);
    String period = (start == null ? "" : " and created_at >= :start") + (end == null ? "" : " and created_at < :end");
    String refundPeriod = (start == null ? "" : " and completed_at >= :start") + (end == null ? "" : " and completed_at < :end");
    String contractFilter = contractStatus.isBlank() ? "" : " and upper(status) = :contractStatus";
    String scope = code == null ? "" : " where f.code = :code";
    String query = """
        select f.code, f.name, f.city, f.status,
          coalesce(u.total,0) total, coalesce(u.occupied,0) occupied, coalesce(u.available,0) available,
          coalesce(p.rent,0) rent, coalesce(p.deposit,0) deposit, coalesce(p.fees,0) fees,
          coalesce(r.refunds,0) refunds
        from facilities f
        left join (select facility_code, count(*) total,
          sum(case when lower(status)='occupied' then 1 else 0 end) occupied,
          sum(case when lower(status)='available' then 1 else 0 end) available
          from units group by facility_code) u on u.facility_code=f.code
        left join (select facility_code,
          sum(case when invoice_type in ('RENT','RENEW') then amount else 0 end) rent,
          sum(case when invoice_type='DEPOSIT' then amount else 0 end) deposit,
          sum(case when invoice_type not in ('RENT','RENEW','DEPOSIT') then amount else 0 end) fees
          from payments where status='PAID' %s group by facility_code) p on p.facility_code=f.code
        left join (select facility_code, sum(approved_amount) refunds from refund_requests
          where status='COMPLETED' %s group by facility_code) r on r.facility_code=f.code
        %s order by f.code
        """.formatted(period, refundPeriod, scope);
    List<Map<String, Object>> rows = jdbc.query(query, params, (rs, n) -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("facilityCode", rs.getString("code")); row.put("facilityName", rs.getString("name"));
      row.put("city", rs.getString("city")); row.put("status", rs.getString("status"));
      long total = rs.getLong("total"), occupied = rs.getLong("occupied");
      row.put("totalUnits", total); row.put("occupiedUnits", occupied); row.put("availableUnits", rs.getLong("available"));
      row.put("occupancyRate", percent(occupied, total));
      row.put("rentalReceipts", rs.getBigDecimal("rent")); row.put("depositReceipts", rs.getBigDecimal("deposit"));
      row.put("feeReceipts", rs.getBigDecimal("fees")); row.put("completedRefunds", rs.getBigDecimal("refunds"));
      return row;
    });

    // Keep operational dimensions separate from the cash-flow query above. This
    // avoids multiplying payment rows when a facility has multiple unit types
    // and keeps the report correct for both PostgreSQL and H2.
    String unitScope = code == null ? "" : " where facility_code = :code";
    Map<String, Long> overdueByFacility = new HashMap<>();
    String overdueQuery = "select facility_code, count(*) overdue from contracts"
        + " where upper(status) = 'OVERDUE'"
        + (contractStatus.isBlank() ? "" : " and upper(status) = :contractStatus")
        + (code == null ? "" : " and facility_code = :code")
        + " group by facility_code";
    jdbc.query(overdueQuery, params, (rs, n) -> {
      overdueByFacility.put(rs.getString("facility_code"), rs.getLong("overdue"));
      return null;
    });

    List<Map<String, Object>> unitTypes = jdbc.query(
        "select facility_code, type unit_type, count(*) total,"
            + " sum(case when lower(status)='occupied' then 1 else 0 end) occupied,"
            + " sum(case when lower(status)='reserved' then 1 else 0 end) reserved,"
            + " sum(case when lower(status)='available' then 1 else 0 end) available,"
            + " sum(case when lower(status)='cleaning' then 1 else 0 end) cleaning,"
            + " sum(case when lower(status)='maintenance' then 1 else 0 end) maintenance"
            + " from units" + unitScope + " group by facility_code, type"
            + " order by facility_code, type",
        params, (rs, n) -> {
          Map<String, Object> row = new LinkedHashMap<>();
          long total = rs.getLong("total");
          long occupied = rs.getLong("occupied");
          row.put("facilityCode", rs.getString("facility_code"));
          row.put("unitType", rs.getString("unit_type"));
          row.put("totalUnits", total);
          row.put("occupiedUnits", occupied);
          row.put("reservedUnits", rs.getLong("reserved"));
          row.put("availableUnits", rs.getLong("available"));
          row.put("cleaningUnits", rs.getLong("cleaning"));
          row.put("maintenanceUnits", rs.getLong("maintenance"));
          row.put("occupancyRate", percent(occupied, total));
          return row;
        });

    List<Map<String, Object>> unitStatuses = jdbc.query(
        "select facility_code, lower(status) unit_status, count(*) total"
            + " from units" + unitScope
            + " group by facility_code, lower(status) order by facility_code, lower(status)",
        params, (rs, n) -> {
          Map<String, Object> row = new LinkedHashMap<>();
          row.put("facilityCode", rs.getString("facility_code"));
          row.put("status", rs.getString("unit_status"));
          row.put("count", rs.getLong("total"));
          return row;
        });

    List<Map<String, Object>> contractStatuses = jdbc.query(
        "select facility_code, upper(status) contract_status, count(*) total"
            + " from contracts where 1=1" + (code == null ? "" : " and facility_code = :code")
            + contractFilter + " group by facility_code, upper(status)"
            + " order by facility_code, upper(status)",
        params, (rs, n) -> {
          Map<String, Object> row = new LinkedHashMap<>();
          row.put("facilityCode", rs.getString("facility_code"));
          row.put("status", rs.getString("contract_status"));
          row.put("count", rs.getLong("total"));
          return row;
        });

    rows.forEach(row -> row.put("overdueContracts",
        overdueByFacility.getOrDefault(String.valueOf(row.get("facilityCode")), 0L)));
    long overdueContracts = overdueByFacility.values().stream().mapToLong(Long::longValue).sum();
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("totalBranches", rows.size());
    for (String key : List.of("totalUnits", "occupiedUnits", "availableUnits"))
      result.put(key, rows.stream().mapToLong(row -> ((Number)row.get(key)).longValue()).sum());
    result.put("occupancyRate", percent((long)result.get("occupiedUnits"), (long)result.get("totalUnits")));
    result.put("overdueContracts", overdueContracts);
    for (String key : List.of("rentalReceipts", "depositReceipts", "feeReceipts", "completedRefunds"))
      result.put(key, rows.stream().map(row -> (BigDecimal)row.get(key)).reduce(BigDecimal.ZERO, BigDecimal::add));
    result.put("byFacility", rows);
    result.put("byUnitType", unitTypes);
    result.put("byUnitStatus", unitStatuses);
    result.put("byContractStatus", contractStatuses);
    result.put("contractStatus", contractStatus);
    result.put("scope", code == null ? "Toàn chuỗi" : code);
    result.put("startDate", start == null ? "" : start.toString()); result.put("endDate", end == null ? "" : end.toString());
    result.put("occupancyBasis", "Trạng thái kho và hợp đồng là số hiện tại. Bộ lọc ngày áp dụng cho dòng tiền; hoàn tiền tính theo ngày hoàn tất. Bộ lọc trạng thái thuê chỉ áp dụng cho thống kê hợp đồng và số hợp đồng quá hạn.");
    return result;
  }
  private double percent(long occupied, long total) { return total == 0 ? 0 : Math.round(occupied * 10000.0 / total) / 100.0; }
}
