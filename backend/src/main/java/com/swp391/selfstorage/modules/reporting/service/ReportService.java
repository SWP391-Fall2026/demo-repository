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
    actor.require("OPS_MGR"); return aggregate(null, start, end);
  }
  public Map<String, Object> facility(LocalDate start, LocalDate end) {
    var user = actor.require("FMANAGER");
    if (user.getFacilityCode() == null) throw Inputs.bad("Tài khoản chưa được gán cơ sở");
    return aggregate(user.getFacilityCode(), start, end);
  }
  public Map<String, Object> system() {
    actor.require("ADMIN"); return Map.of("users", users.count(), "facilities", facilities.count());
  }

  public byte[] export(String requestedCode, LocalDate start, LocalDate end, String format) {
    var user = actor.require("FMANAGER", "OPS_MGR");
    String code = requestedCode == null || requestedCode.isBlank() ? null : requestedCode;
    if ("FMANAGER".equals(actor.role(user))) {
      actor.facility(user, code == null ? user.getFacilityCode() : code);
      code = user.getFacilityCode();
    }
    if (!Set.of("csv", "xlsx").contains(format)) throw Inputs.bad("Chọn định dạng CSV hoặc XLSX");
    return ReportExport.write(aggregate(code, start, end), format);
  }

  private Map<String, Object> aggregate(String code, LocalDate start, LocalDate end) {
    if (start != null && end != null && start.isAfter(end)) throw Inputs.bad("Ngày bắt đầu không được sau ngày kết thúc");
    if (code != null && !facilities.existsById(code)) throw Inputs.missing();
    var params = new MapSqlParameterSource().addValue("code", code, Types.VARCHAR);
    if (start != null) params.addValue("start", start.atStartOfDay(), Types.TIMESTAMP);
    if (end != null) params.addValue("end", end.plusDays(1).atStartOfDay(), Types.TIMESTAMP);
    String period = (start == null ? "" : " and created_at >= :start") + (end == null ? "" : " and created_at < :end");
    String refundPeriod = (start == null ? "" : " and completed_at >= :start") + (end == null ? "" : " and completed_at < :end");
    String scope = code == null ? "" : " where f.code = :code";
    String query = """
        select f.code, f.name,
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
      long total = rs.getLong("total"), occupied = rs.getLong("occupied");
      row.put("totalUnits", total); row.put("occupiedUnits", occupied); row.put("availableUnits", rs.getLong("available"));
      row.put("occupancyRate", percent(occupied, total));
      row.put("rentalReceipts", rs.getBigDecimal("rent")); row.put("depositReceipts", rs.getBigDecimal("deposit"));
      row.put("feeReceipts", rs.getBigDecimal("fees")); row.put("completedRefunds", rs.getBigDecimal("refunds"));
      return row;
    });
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("totalBranches", rows.size());
    for (String key : List.of("totalUnits", "occupiedUnits", "availableUnits"))
      result.put(key, rows.stream().mapToLong(row -> ((Number)row.get(key)).longValue()).sum());
    result.put("occupancyRate", percent((long)result.get("occupiedUnits"), (long)result.get("totalUnits")));
    for (String key : List.of("rentalReceipts", "depositReceipts", "feeReceipts", "completedRefunds"))
      result.put(key, rows.stream().map(row -> (BigDecimal)row.get(key)).reduce(BigDecimal.ZERO, BigDecimal::add));
    result.put("byFacility", rows);
    result.put("scope", code == null ? "Toàn chuỗi" : code);
    result.put("startDate", start == null ? "" : start.toString()); result.put("endDate", end == null ? "" : end.toString());
    result.put("occupancyBasis", "Trạng thái kho hiện tại; bộ lọc ngày áp dụng cho dòng tiền. Hoàn tiền tính theo ngày hoàn tất.");
    return result;
  }
  private double percent(long occupied, long total) { return total == 0 ? 0 : Math.round(occupied * 10000.0 / total) / 100.0; }
}
