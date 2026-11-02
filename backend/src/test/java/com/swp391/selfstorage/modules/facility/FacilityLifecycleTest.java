package com.swp391.selfstorage.modules.facility;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.application.workflow.CreateReservationWorkflow;
import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class FacilityLifecycleTest {
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final PolicyService policies = mock(PolicyService.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final ReservationHoldPolicy holds = new ReservationHoldPolicy(5);
  private final FacilityService service = new FacilityService(facilities, units, actor, audit, policies, reservations, holds, clock);

  @Test void unassignedPaidReservationBlocksFacilityDeactivation() {
    Facility facility = new Facility(); facility.setCode("HN-CG");
    when(facilities.lockByCode("HN-CG")).thenReturn(Optional.of(facility));
    var hold = mock(ReservationRepository.HoldCount.class);
    when(reservations.countUnassignedHolds(eq("HN-CG"), any())).thenReturn(List.of(hold));
    assertThrows(ResponseStatusException.class, () -> service.update("HN-CG", Map.of("status", "INACTIVE")));
    assertEquals("ACTIVE", facility.getStatus());
    verify(facilities, never()).save(any());
  }

  @Test void inactiveFacilityRejectsQuoteAndReservationCreation() {
    Facility facility = new Facility(); facility.setCode("HN-CG"); facility.setStatus("INACTIVE");
    when(facilities.findById("HN-CG")).thenReturn(Optional.of(facility));
    when(facilities.lockByCode("HN-CG")).thenReturn(Optional.of(facility));
    var quote = new ReservationService(reservations, actor, policies, units, facilities);
    assertThrows(ResponseStatusException.class, () -> quote.quote(Map.of("unitType", "S", "facilityCode", "HN-CG")));
    when(actor.require("CUSTOMER")).thenReturn(new User());
    var workflow = new CreateReservationWorkflow(reservations, facilities, units, quote, mock(InvoiceService.class), actor, audit, clock, holds);
    LocalDateTime appointment = LocalDateTime.now(clock).plusDays(1);
    var request = new CreateReservationRequest("HN-CG", "S", appointment.toLocalDate(), appointment, appointment, 1);
    assertThrows(ResponseStatusException.class, () -> workflow.execute(request));
    verify(reservations, never()).save(any());
  }

  @Test void maintenanceReasonCannotExceedDatabaseColumnLength() {
    User staff = new User(); staff.setFacilityCode("HN-CG");
    Unit unit = new Unit(); unit.setCode("U-1"); unit.setFacilityCode("HN-CG"); unit.setStatus("available");
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(facilities.lockByCode("HN-CG")).thenReturn(Optional.of(new Facility()));
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    assertThrows(ResponseStatusException.class, () -> service.updateStatus("U-1", Map.of("status", "maintenance", "reason", "x".repeat(256))));
    verify(units, never()).save(any());
  }
}
