package com.swp391.selfstorage.modules.facility;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;

import com.swp391.selfstorage.application.workflow.CreateReservationWorkflow;
import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationService;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@Transactional
abstract class CatalogAvailabilityChecks {
  protected static final String PREFIX = "CATQA-" + UUID.randomUUID().toString().substring(0, 8) + "-";
  private static final String FACILITY = PREFIX + "HN";
  private static final String OTHER_FACILITY = PREFIX + "Q7";
  private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-25T08:00:00Z"), ZoneOffset.UTC);
  private static final LocalDateTime NOW = LocalDateTime.now(CLOCK);

  @TestConfiguration
  static class TimeConfig {
    @Bean
    Clock clock() { return CLOCK; }
  }

  @Autowired FacilityService service;
  @Autowired FacilityRepository facilities;
  @Autowired UnitRepository units;
  @Autowired ReservationRepository reservations;
  @Autowired UserRepository users;
  @Autowired CreateReservationWorkflow createReservation;
  @MockBean ActorContext actor;
  @MockBean AuditLogService audit;
  @MockBean PolicyService policy;
  @MockBean ReservationService reservationService;
  @MockBean InvoiceService invoices;

  @BeforeEach
  void seedFacilities() {
    verifyDatabaseTarget();
    for (String code : List.of(FACILITY, OTHER_FACILITY)) {
      Facility facility = new Facility();
      facility.setCode(code);
      facility.setName(code);
      facility.setAddress("Test address");
      facility.setCity("Test city");
      facilities.save(facility);
    }
  }

  @Test
  void hidesLastAvailableUnitWhenReservedWithoutAssignment() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    hold("R-1", FACILITY, "S", "RESERVED", NOW.minusDays(1), null);

    assertTrue(catalog().isEmpty());
    assertEquals("available", units.findById(PREFIX + "S-1").orElseThrow().getStatus());
  }

  @Test
  void pendingHoldExpiresAtExactlyFiveMinutesWithoutWaitingForCleanup() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    Reservation reservation = hold("R-1", FACILITY, "S", "PENDING_PAYMENT",
        NOW.minusMinutes(5).plusNanos(1_000_000), null);
    assertTrue(catalog().isEmpty());

    reservation.setCreatedAt(NOW.minusMinutes(5));
    reservations.saveAndFlush(reservation);
    assertEquals(List.of("S-1"), codes(catalog()));

    reservation.setCreatedAt(NOW.minusMinutes(6));
    reservations.saveAndFlush(reservation);
    assertEquals(List.of("S-1"), codes(catalog()));
  }

  @ParameterizedTest
  @ValueSource(strings = {"CANCELLED", "EXPIRED", "CHECKED_IN", "NO_SHOW"})
  void inactiveReservationsDoNotReduceCapacity(String status) {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    hold("R-1", FACILITY, "S", status, NOW, null);
    assertEquals(List.of("S-1"), codes(catalog()));
  }

  @Test
  void assignedReservationIsNotSubtractedAgain() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    unit("S-2", FACILITY, "S", "3", "900000", "reserved");
    hold("R-1", FACILITY, "S", "RESERVED", NOW, "S-2");
    assertEquals(List.of("S-1"), codes(catalog()));
  }

  @Test
  void subtractsEachHoldOnceWithinItsFacilityAndType() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    unit("S-2", FACILITY, "S", "3", "900000", "available");
    unit("S-3", FACILITY, "S", "3", "900000", "available");
    unit("M-1", FACILITY, "M", "5", "1500000", "available");
    unit("Q7-S-1", OTHER_FACILITY, "S", "3", "900000", "available");
    hold("R-1", FACILITY, "S", "RESERVED", NOW, null);
    hold("R-2", FACILITY, "S", "PENDING_PAYMENT", NOW.minusMinutes(1), null);

    var result = catalog();
    assertEquals(3, result.size());
    assertEquals(1, result.stream().filter(u -> FACILITY.equals(u.get("facilityCode"))
        && "S".equals(u.get("type"))).count());
    assertTrue(codes(result).containsAll(List.of("M-1", "Q7-S-1")));
  }

  @Test
  void filtersDoNotSubtractHoldsFromOnlyTheMatchingSubset() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    unit("S-2", FACILITY, "S", "4", "1200000", "available");
    hold("R-1", FACILITY, "S", "RESERVED", NOW, null);

    assertEquals(1, catalog().size());
    assertEquals(List.of("S-1"), codes(service.catalog(FACILITY, new BigDecimal("3"),
        new BigDecimal("3"), new BigDecimal("900000"), new BigDecimal("900000"))));
    assertEquals(List.of("S-2"), codes(service.catalog(FACILITY, new BigDecimal("4"),
        null, new BigDecimal("1000000"), null)));
  }

  @Test
  void cancellingHoldMakesCapacityVisibleAgainAndExcessHoldsStayHidden() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    Reservation first = hold("R-1", FACILITY, "S", "RESERVED", NOW, null);
    Reservation second = hold("R-2", FACILITY, "S", "RESERVED", NOW, null);
    assertTrue(catalog().isEmpty());
    first.setStatus("CANCELLED");
    reservations.saveAndFlush(first);
    assertTrue(catalog().isEmpty());
    second.setStatus("CANCELLED");
    reservations.saveAndFlush(second);
    assertEquals(List.of("S-1"), codes(catalog()));
  }

  @Test
  void catalogAndReservationCreationAgreeOnRemainingCapacity() {
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    unit("S-2", FACILITY, "S", "3", "900000", "available");
    hold("R-1", FACILITY, "S", "RESERVED", NOW, null);
    User customer = new User();
    customer.setId(PREFIX + "CUSTOMER");
    customer.setUsername(PREFIX + "customer");
    customer.setEmail(PREFIX + "customer@catalog.invalid");
    customer.setPassword("not-a-login-credential");
    customer.setRole("CUSTOMER");
    customer.setName("Test customer");
    users.saveAndFlush(customer);
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(reservationService.quote(anyMap())).thenReturn(Map.of(
        "monthlyRate", new BigDecimal("900000"), "depositAmount", new BigDecimal("900000")));
    LocalDateTime appointment = NOW.plusDays(1);
    var request = new CreateReservationRequest(FACILITY, "S", appointment.toLocalDate(),
        appointment, appointment, 1);

    assertEquals(1, catalog().size());
    Reservation created = createReservation.execute(request);
    assertTrue(catalog().isEmpty());
    var failure = assertThrows(ResponseStatusException.class, () -> createReservation.execute(request));
    assertEquals(HttpStatus.CONFLICT, failure.getStatusCode());

    created.setStatus("CANCELLED");
    reservations.saveAndFlush(created);
    assertEquals(1, catalog().size());
    createReservation.execute(request);
    assertTrue(catalog().isEmpty());
  }

  @Test
  void facilitySummaryUsesLiveUnitState() {
    Facility stored = facilities.findById(FACILITY).orElseThrow();
    stored.setTotalUnits(99);
    stored.setOccupiedUnits(99);
    stored.setOccupancyRate(new BigDecimal("100"));
    facilities.saveAndFlush(stored);
    unit("S-1", FACILITY, "S", "3", "900000", "available");
    unit("S-2", FACILITY, "S", "3", "900000", "OCCUPIED");

    var result = service.facilities();
    Facility summary = result.stream()
        .filter(facility -> FACILITY.equals(facility.getCode()))
        .findFirst().orElseThrow();

    assertEquals(2, summary.getTotalUnits());
    assertEquals(1, summary.getOccupiedUnits());
    assertEquals(new BigDecimal("50.00"), summary.getOccupancyRate());

    Facility empty = result.stream()
        .filter(facility -> OTHER_FACILITY.equals(facility.getCode()))
        .findFirst().orElseThrow();
    assertEquals(0, empty.getTotalUnits());
    assertEquals(0, empty.getOccupiedUnits());
    assertEquals(0, empty.getOccupancyRate().signum());

    unit("S-3", FACILITY, "S", "3", "900000", "reserved");
    summary = service.facilities().stream()
        .filter(facility -> FACILITY.equals(facility.getCode()))
        .findFirst().orElseThrow();
    assertEquals(3, summary.getTotalUnits());
    assertEquals(1, summary.getOccupiedUnits());
    assertEquals(new BigDecimal("33.33"), summary.getOccupancyRate());
    // Public reads must not rewrite the legacy counters stored on entities.
    assertEquals(99, facilities.findById(FACILITY).orElseThrow().getTotalUnits());
  }

  protected void verifyDatabaseTarget() {}

  private List<Map<String, Object>> catalog() {
    return service.catalog(null, null, null, null, null).stream()
        .filter(u -> ((String) u.get("code")).startsWith(PREFIX)).toList();
  }

  private List<Object> codes(List<Map<String, Object>> result) {
    return result.stream().map(u -> (Object) ((String) u.get("code")).substring(PREFIX.length())).toList();
  }

  private void unit(String code, String facility, String type, String size, String price, String status) {
    Unit unit = new Unit();
    unit.setCode(PREFIX + code);
    unit.setFacilityCode(facility);
    unit.setType(type);
    unit.setSizeSqm(new BigDecimal(size));
    unit.setPricePerMonth(new BigDecimal(price));
    unit.setStatus(status);
    units.saveAndFlush(unit);
  }

  private Reservation hold(String id, String facility, String type, String status,
      LocalDateTime createdAt, String unitCode) {
    Reservation reservation = new Reservation();
    reservation.setId(PREFIX + id);
    reservation.setCustomerName("Test customer");
    reservation.setFacilityCode(facility);
    reservation.setUnitType(type);
    reservation.setStatus(status);
    reservation.setCreatedAt(createdAt);
    reservation.setUnitCode(unitCode == null ? null : PREFIX + unitCode);
    return reservations.saveAndFlush(reservation);
  }
}
