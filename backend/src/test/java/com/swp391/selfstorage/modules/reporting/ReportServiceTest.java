package com.swp391.selfstorage.modules.reporting;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.reporting.service.ReportService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.server.ResponseStatusException;

class ReportServiceTest {
  private final ActorContext actor = mock(ActorContext.class);
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private ReportService service;

  @BeforeEach void data() {
    var source = new DriverManagerDataSource("jdbc:h2:mem:report-" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", "");
    var jdbc = new JdbcTemplate(source);
    jdbc.execute("create table facilities(code varchar, name varchar, city varchar, status varchar)");
    jdbc.execute("create table units(facility_code varchar, type varchar, status varchar)");
    jdbc.execute("create table payments(facility_code varchar, invoice_type varchar, amount numeric, status varchar, created_at timestamp)");
    jdbc.execute("create table refund_requests(facility_code varchar, approved_amount numeric, status varchar, completed_at timestamp)");
    jdbc.execute("create table contracts(facility_code varchar, status varchar)");
    jdbc.update("insert into facilities values ('HN-CG','Cau Giay','Ha Noi','ACTIVE'),('HCM-TB','Tan Binh','HCM','INACTIVE')");
    jdbc.update("insert into units values ('HN-CG','S','occupied'),('HN-CG','L','available'),('HCM-TB','S','maintenance')");
    jdbc.update("insert into contracts values ('HN-CG','ACTIVE'),('HN-CG','OVERDUE'),('HCM-TB','TERMINATED')");
    jdbc.update("insert into payments values ('HN-CG','RENT',100,'PAID','2026-11-01 10:00:00'),('HN-CG','RENEW',50,'PAID','2026-10-01 10:00:00'),('HN-CG','DEPOSIT',25,'PAID','2026-11-02 10:00:00')");
    jdbc.update("insert into refund_requests values ('HN-CG',10,'COMPLETED','2026-11-02 10:00:00')");
    service = new ReportService(new NamedParameterJdbcTemplate(source), actor, mock(UserRepository.class), facilities);
  }

  @Test void chainKeepsContractStatusSeparateFromUnitStatusAndDoesNotMultiplyCash() {
    var report = service.chain(null, null);
    assertEquals(3L, report.get("totalUnits"));
    assertEquals(1L, report.get("overdueContracts"));
    assertEquals(0, new BigDecimal("150").compareTo((BigDecimal) report.get("rentalReceipts")));
    assertEquals(3, rows(report, "byContractStatus").size());
    assertTrue(rows(report, "byContractStatus").stream().anyMatch(row -> "TERMINATED".equals(row.get("status"))));
    assertTrue(rows(report, "byUnitStatus").stream().anyMatch(row -> "maintenance".equals(row.get("status"))));
    assertEquals("INACTIVE", rows(report, "byFacility").stream().filter(row -> "HCM-TB".equals(row.get("facilityCode"))).findFirst().orElseThrow().get("status"));
  }

  @Test void filterAppliesToContractStatisticsWhileDateFilterAppliesToCash() {
    var report = service.chain(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 2), "ACTIVE");
    assertEquals(0L, report.get("overdueContracts"));
    assertEquals(1, rows(report, "byContractStatus").size());
    assertEquals("ACTIVE", rows(report, "byContractStatus").getFirst().get("status"));
    assertEquals(0, new BigDecimal("100").compareTo((BigDecimal) report.get("rentalReceipts")));
  }

  @Test void facilityReportAndExportCannotLeakOtherBranches() {
    User manager = new User(); manager.setFacilityCode("HN-CG");
    when(actor.require("FMANAGER")).thenReturn(manager);
    when(facilities.existsById("HN-CG")).thenReturn(true);
    var report = service.facility(null, null);
    assertEquals(1, rows(report, "byFacility").size());
    assertEquals(2, rows(report, "byContractStatus").size());
    assertTrue(rows(report, "byContractStatus").stream().allMatch(row -> "HN-CG".equals(row.get("facilityCode"))));
  }

  @Test void csvExportIncludesRentalStatusBreakdownAndRespectsFilter() {
    User ops = new User();
    when(actor.require("FMANAGER", "OPS_MGR")).thenReturn(ops);
    when(actor.role(ops)).thenReturn("OPS_MGR");
    String csv = new String(service.export(null, null, null, "csv", "ACTIVE"), StandardCharsets.UTF_8);
    assertTrue(csv.contains("Trạng thái thuê"));
    assertTrue(csv.contains("\"HN-CG\",\"ACTIVE\",\"1\""));
    assertFalse(csv.contains("\"TERMINATED\""));
  }

  @Test void invalidContractStatusIsRejected() {
    assertThrows(ResponseStatusException.class, () -> service.chain(null, null, "occupied"));
  }

  @SuppressWarnings("unchecked") private List<Map<String, Object>> rows(Map<String, Object> report, String key) {
    return (List<Map<String, Object>>) report.get(key);
  }
}
