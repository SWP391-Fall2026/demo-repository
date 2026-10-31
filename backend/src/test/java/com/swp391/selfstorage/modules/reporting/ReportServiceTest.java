package com.swp391.selfstorage.modules.reporting;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.billing.entity.Payment;
import com.swp391.selfstorage.modules.billing.entity.RefundRequest;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import com.swp391.selfstorage.modules.billing.repository.RefundRequestRepository;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.reporting.service.ReportService;
import com.swp391.selfstorage.modules.rental.entity.InspectionRecord;
import com.swp391.selfstorage.modules.rental.repository.InspectionRecordRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReportServiceTest {

  private FacilityRepository facilities;
  private UnitRepository units;
  private PaymentRepository payments;
  private RefundRequestRepository refunds;
  private InspectionRecordRepository inspections;
  private ActorContext actor;
  private UserRepository users;
  private User ops;
  private ReportService reports;

  @BeforeEach
  void setUp() {
    facilities = mock(FacilityRepository.class);
    units = mock(UnitRepository.class);
    payments = mock(PaymentRepository.class);
    refunds = mock(RefundRequestRepository.class);
    inspections = mock(InspectionRecordRepository.class);
    actor = mock(ActorContext.class);
    users = mock(UserRepository.class);
    ops = mock(User.class);
    when(actor.require("OPS_MGR", "FMANAGER", "ADMIN")).thenReturn(ops);
    when(actor.role(ops)).thenReturn("OPS_MGR");
    when(facilities.findAll()).thenReturn(List.of(facility("F-01", "Central")));
    when(facilities.count()).thenReturn(1L);
    reports = new ReportService(facilities, units, payments, refunds, users, inspections, actor);
  }

  @Test
  void separatesDepositsAndUsesCompletionDatesForRefundsAndDeductions() {
    when(units.findAll()).thenReturn(List.of(unit("U-1", "F-01", "occupied")));
    when(payments.findByStatusIgnoreCase("PAID")).thenReturn(List.of(
      payment("RENT", "1000", LocalDateTime.of(2026, 10, 4, 10, 0)),
      payment("DEPOSIT", "500", LocalDateTime.of(2026, 10, 4, 10, 0)),
      payment("EXTRA", "100", LocalDateTime.of(2026, 10, 4, 10, 0)),
      payment("RENT", "900", LocalDateTime.of(2026, 9, 30, 10, 0))
    ));
    when(refunds.findByStatusIgnoreCase("COMPLETED")).thenReturn(List.of(
      refund("RENT", "100", LocalDateTime.of(2026, 10, 8, 10, 0)),
      refund("DEPOSIT", "200", LocalDateTime.of(2026, 10, 9, 10, 0)),
      refund("RENT", "300", LocalDateTime.of(2026, 9, 30, 10, 0))
    ));
    InspectionRecord completedInspection = new InspectionRecord();
    completedInspection.setStatus("COMPLETED");
    completedInspection.setPenaltyFee(new BigDecimal("50"));
    completedInspection.setCompletedAt(LocalDateTime.of(2026, 10, 12, 10, 0));
    when(inspections.findByContractFacilityCode(null)).thenReturn(List.of(completedInspection));

    Map<String, Object> result = reports.revenue(null, "2026-10-01", "2026-10-31", "month");
    Map<?, ?> timelineRow = (Map<?, ?>) ((List<?>) result.get("revenueTimeline")).get(0);

    assertEquals(new BigDecimal("1000"), result.get("rentalReceipts"));
    assertEquals(new BigDecimal("500"), result.get("depositReceipts"));
    assertEquals(new BigDecimal("100"), result.get("rentalRefunds"));
    assertEquals(new BigDecimal("200"), result.get("depositRefunds"));
    assertEquals(new BigDecimal("50"), result.get("depositDeductions"));
    assertEquals(new BigDecimal("1000"), result.get("netOperatingReceipts"));
    assertEquals(new BigDecimal("1000"), timelineRow.get("amount"));
    assertEquals(new BigDecimal("1100"), timelineRow.get("grossReceipts"));
    assertEquals(new BigDecimal("100"), timelineRow.get("rentalRefunds"));
    assertFalse(((Map<?, ?>) result.get("revenueBySource")).containsKey("DEPOSIT"));
  }

  @Test
  void occupancyIncludesAllPhysicalUnitsAndStatusBreakdown() {
    when(units.findAll()).thenReturn(List.of(
      unit("U-1", "F-01", "occupied"),
      unit("U-2", "F-01", "available"),
      unit("U-3", "F-01", "reserved"),
      unit("U-4", "F-01", "maintenance")
    ));

    Map<?, ?> result = reports.occupancy(null);
    Map<?, ?> branch = (Map<?, ?>) ((List<?>) result.get("branches")).get(0);

    assertEquals(4, branch.get("totalUnits"));
    assertEquals(1L, branch.get("occupiedUnits"));
    assertEquals(1L, branch.get("vacantUnits"));
    assertEquals(1L, branch.get("reservedUnits"));
    assertEquals(1L, branch.get("maintenanceUnits"));
    assertEquals(25.0, branch.get("occupancyRate"));
    assertEquals("Central", branch.get("facilityName"));
  }

  private Facility facility(String code, String name) {
    Facility facility = new Facility();
    facility.setCode(code);
    facility.setName(name);
    return facility;
  }

  private Unit unit(String code, String facilityCode, String status) {
    Unit unit = new Unit();
    unit.setCode(code);
    unit.setFacilityCode(facilityCode);
    unit.setStatus(status);
    return unit;
  }

  private Payment payment(String type, String amount, LocalDateTime createdAt) {
    Payment payment = new Payment();
    payment.setInvoiceType(type);
    payment.setAmount(new BigDecimal(amount));
    payment.setCreatedAt(createdAt);
    return payment;
  }

  private RefundRequest refund(String type, String amount, LocalDateTime completedAt) {
    RefundRequest refund = new RefundRequest();
    refund.setRefundType(type);
    refund.setApprovedAmount(new BigDecimal(amount));
    refund.setCompletedAt(completedAt);
    return refund;
  }
}
