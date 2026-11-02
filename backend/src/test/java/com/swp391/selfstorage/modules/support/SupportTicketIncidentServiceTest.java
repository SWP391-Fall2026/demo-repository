package com.swp391.selfstorage.modules.support;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import com.swp391.selfstorage.modules.support.repository.SupportTicketRepository;
import com.swp391.selfstorage.modules.support.service.SupportTicketService;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class SupportTicketIncidentServiceTest {
  private final SupportTicketRepository tickets = mock(SupportTicketRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final AttachmentStorage storage = mock(AttachmentStorage.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final UserRepository users = mock(UserRepository.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final SupportTicketService service = new SupportTicketService(
      tickets, contracts, reservations, actor, audit, storage, units, users, clock);

  @Test void managerAssignsTicketToActiveStaffAtSameFacility() {
    User manager = user("FM-1", "FACILITY_MANAGER", "HN-CG");
    User staff = user("ST-1", "STAFF", "HN-CG");
    SupportTicket ticket = ticket();
    when(actor.require("FMANAGER")).thenReturn(manager);
    when(tickets.lockById("T-1")).thenReturn(Optional.of(ticket));
    when(users.findById("ST-1")).thenReturn(Optional.of(staff));
    when(actor.role(manager)).thenReturn("FMANAGER");
    when(actor.role(staff)).thenReturn("STAFF");
    when(tickets.save(any(SupportTicket.class))).thenAnswer(call -> call.getArgument(0));

    var result = service.assign("T-1", Map.of("staffId", "ST-1"));

    assertEquals("ST-1", result.getStaffAssigned());
    assertEquals("IN_PROGRESS", result.getStatus());
    verify(audit).record("ASSIGN_TICKET", "T-1", "Phân công ST-1");
  }

  @Test void resetPinStoresEightHourTemporaryCredentialAndAudit() {
    User staff = user("ST-1", "STAFF", "HN-CG");
    SupportTicket ticket = ticket();
    Unit unit = new Unit();
    unit.setCode("HN-CG-S-01"); unit.setFacilityCode("HN-CG"); unit.setType("S");
    unit.setSizeSqm(new BigDecimal("1")); unit.setPricePerMonth(new BigDecimal("100"));
    unit.setStatus("occupied");
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");
    when(tickets.lockById("T-1")).thenReturn(Optional.of(ticket));
    Contract contract = activeContract();
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq(ticket.getUnitCode()), anyCollection())).thenReturn(Optional.of(contract));
    when(units.lockByCode("HN-CG-S-01")).thenReturn(Optional.of(unit));
    when(tickets.save(any(SupportTicket.class))).thenAnswer(call -> call.getArgument(0));

    var result = service.resetTemporaryPin("T-1", Map.of("notes", "Khách quên mã"));

    String pin = String.valueOf(result.get("temporaryPin"));
    assertTrue(pin.matches("[0-9]{6}"));
    assertEquals(LocalDateTime.of(2026, 11, 2, 8, 0), result.get("expiresAt"));
    assertEquals(pin, unit.getTemporaryPin());
    assertEquals(LocalDateTime.of(2026, 11, 2, 8, 0), unit.getTemporaryPinExpiresAt());
    assertEquals("IN_PROGRESS", ticket.getStatus());
    verify(audit).record("RESET_TEMPORARY_PIN", "T-1", "Cấp PIN tạm cho kho HN-CG-S-01");
  }

  @Test void resetPinRejectsTicketAssignedToAnotherStaff() {
    User staff = user("ST-1", "STAFF", "HN-CG");
    SupportTicket ticket = ticket(); ticket.setStaffAssigned("ST-2");
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");
    when(tickets.lockById("T-1")).thenReturn(Optional.of(ticket));
    assertThrows(ResponseStatusException.class, () -> service.resetTemporaryPin("T-1", Map.of()));
    verify(units, never()).save(any());
  }

  @Test void resetPinRejectsFormerTenantTicketAndResolvedTicket() {
    User staff = user("ST-1", "STAFF", "HN-CG");
    SupportTicket ticket = ticket();
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");
    when(tickets.lockById("T-1")).thenReturn(Optional.of(ticket));
    Contract contract = activeContract(); contract.setUserId("NEW-CUSTOMER");
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq(ticket.getUnitCode()), anyCollection())).thenReturn(Optional.of(contract));
    assertThrows(ResponseStatusException.class, () -> service.resetTemporaryPin("T-1", Map.of()));
    ticket.setStatus("RESOLVED");
    assertThrows(ResponseStatusException.class, () -> service.resetTemporaryPin("T-1", Map.of()));
    verify(units, never()).save(any());
  }

  @Test void resetPinRejectsTerminatedRentalBeforeIssuingCredential() {
    User staff = user("ST-1", "STAFF", "HN-CG");
    SupportTicket ticket = ticket();
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");
    when(tickets.lockById("T-1")).thenReturn(Optional.of(ticket));
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq(ticket.getUnitCode()), anyCollection())).thenReturn(Optional.empty());
    assertThrows(ResponseStatusException.class, () -> service.resetTemporaryPin("T-1", Map.of()));
    verify(units, never()).lockByCode(any());
    verify(units, never()).save(any()); verify(tickets, never()).save(any());
  }

  private static Contract activeContract() {
    Contract c = new Contract(); c.setId("C-1"); c.setUserId("CUS-1"); c.setFacilityCode("HN-CG"); c.setUnitCode("HN-CG-S-01");
    c.setStatus("ACTIVE"); c.setCreatedAt(LocalDateTime.of(2026, 11, 1, 0, 0)); c.setEndAt(LocalDateTime.of(2026, 12, 2, 0, 0));
    return c;
  }

  private static SupportTicket ticket() {
    SupportTicket t = new SupportTicket(); t.setId("T-1"); t.setFacilityCode("HN-CG"); t.setUnitCode("HN-CG-S-01");
    t.setUserId("CUS-1"); t.setStatus("OPEN"); t.setCategory("ACCESS"); t.setTitle("Quên PIN"); return t;
  }

  private static User user(String id, String role, String facility) {
    User u = new User(); u.setId(id); u.setRole(role); u.setFacilityCode(facility); u.setStatus("ACTIVE"); return u;
  }
}
