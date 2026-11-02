package com.swp391.selfstorage.modules.support;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import com.swp391.selfstorage.modules.support.repository.SupportTicketRepository;
import com.swp391.selfstorage.modules.support.service.SupportTicketService;
import java.time.Clock;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class SupportTicketValidationTest {
  private final SupportTicketRepository tickets = mock(SupportTicketRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final SupportTicketService service = new SupportTicketService(tickets, contracts, reservations, actor,
    mock(AuditLogService.class), mock(AttachmentStorage.class), mock(UnitRepository.class),
    mock(UserRepository.class), Clock.systemUTC());

  @ParameterizedTest
  @ValueSource(strings = {"0", "6", "invalid", "4.5"})
  void invalidRatingDoesNotCloseResolvedTicket(String rating) {
    SupportTicket ticket = resolvedTicket();
    ResponseStatusException error = assertThrows(ResponseStatusException.class,
      () -> service.update(ticket.getId(), Map.of("status", "CLOSED", "rating", rating)));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    assertEquals("RESOLVED", ticket.getStatus());
    assertNull(ticket.getRating());
    verify(tickets, never()).save(any());
  }

  @Test void validRatingClosesTicketAndKeepsStaffResponse() {
    SupportTicket ticket = resolvedTicket();
    ticket.setNotes("Đã kiểm tra khóa");
    when(tickets.save(any())).thenAnswer(call -> call.getArgument(0));
    SupportTicket result = service.update(ticket.getId(),
      Map.of("status", "CLOSED", "rating", 5, "notes", "Đã truy cập được"));
    assertEquals("CLOSED", result.getStatus());
    assertEquals(5, result.getRating());
    assertEquals("Đã kiểm tra khóa | Phản hồi khách: Đã truy cập được", result.getNotes());
  }

  @Test void oversizedCombinedFeedbackDoesNotCloseTicket() {
    SupportTicket ticket = resolvedTicket();
    ticket.setNotes("x".repeat(250));
    ResponseStatusException error = assertThrows(ResponseStatusException.class,
      () -> service.update(ticket.getId(), Map.of("status", "CLOSED", "notes", "cảm ơn")));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    assertEquals("RESOLVED", ticket.getStatus());
    assertEquals("x".repeat(250), ticket.getNotes());
    verify(tickets, never()).save(any());
  }

  @Test void unsupportedPriorityRejectedBeforeDatabaseWrite() {
    User user = customer();
    when(actor.require("CUSTOMER")).thenReturn(user);
    Contract contract = new Contract(); contract.setUserId(user.getId()); contract.setFacilityCode("HN-CG");
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection()))
      .thenReturn(Optional.of(contract));
    ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(
      Map.of("unitCode", "U-1", "category", "ACCESS", "title", "Quên PIN", "description", "Nhờ hỗ trợ", "priority", "LOW")));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    verify(tickets, never()).save(any());
  }

  @Test void paymentTicketCanReferenceOwnedReservationBeforeContract() {
    User user = customer();
    when(actor.require("CUSTOMER")).thenReturn(user);
    Reservation reservation = new Reservation();
    reservation.setId("RSV-1"); reservation.setUserId(user.getId()); reservation.setFacilityCode("HN-CG");
    reservation.setUnitType("M"); reservation.setStatus("PENDING_PAYMENT");
    when(reservations.findById("RSV-1")).thenReturn(Optional.of(reservation));
    when(tickets.save(any())).thenAnswer(call -> call.getArgument(0));
    SupportTicket result = service.create(Map.of("reservationId", "RSV-1", "category", "PAYMENT",
      "title", "Hỏi tiền cọc", "description", "Tôi cần kiểm tra hóa đơn cọc"));
    assertEquals("HN-CG", result.getFacilityCode());
    assertNull(result.getUnitCode());
    assertTrue(result.getDescription().contains("RSV-1"));
    verify(tickets).save(result);
  }

  @Test void bookingTicketCannotReferenceAnotherCustomersReservation() {
    User user = customer();
    when(actor.require("CUSTOMER")).thenReturn(user);
    Reservation reservation = new Reservation(); reservation.setUserId("CUS-OTHER");
    when(reservations.findById("RSV-OTHER")).thenReturn(Optional.of(reservation));
    ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(
      Map.of("reservationId", "RSV-OTHER", "category", "PAYMENT", "title", "Payment", "description", "Need help")));
    assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    verify(tickets, never()).save(any());
  }

  @Test void bookingDoesNotGrantAccessOrDamageSupportForUnrentedUnit() {
    when(actor.require("CUSTOMER")).thenReturn(customer());
    ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(
      Map.of("reservationId", "RSV-1", "category", "ACCESS", "title", "Access", "description", "Need help")));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    verifyNoInteractions(reservations);
    verify(tickets, never()).save(any());
  }

  @Test void ticketRejectsAmbiguousUnitAndBookingReferences() {
    when(actor.require("CUSTOMER")).thenReturn(customer());
    ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(
      Map.of("unitCode", "U-1", "reservationId", "RSV-1", "category", "PAYMENT", "title", "Payment", "description", "Need help")));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    verifyNoInteractions(reservations, contracts);
  }

  @Test void oversizedBookingDescriptionRejectedBeforeSave() {
    User user = customer();
    when(actor.require("CUSTOMER")).thenReturn(user);
    Reservation reservation = new Reservation(); reservation.setUserId(user.getId());
    reservation.setFacilityCode("HCM-TB"); reservation.setStatus("RESERVED");
    when(reservations.findById("RSV-1")).thenReturn(Optional.of(reservation));
    ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(
      Map.of("reservationId", "RSV-1", "category", "PAYMENT", "title", "Payment", "description", "x".repeat(255))));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    verify(tickets, never()).save(any());
  }

  private SupportTicket resolvedTicket() {
    User user = customer();
    when(actor.require("STAFF", "FMANAGER", "CUSTOMER")).thenReturn(user);
    when(actor.role(user)).thenReturn("CUSTOMER");
    when(actor.visible(user, user.getId(), "HN-CG")).thenReturn(true);
    SupportTicket ticket = new SupportTicket(); ticket.setId("T-1"); ticket.setUserId(user.getId());
    ticket.setFacilityCode("HN-CG"); ticket.setStatus("RESOLVED");
    when(tickets.lockById(ticket.getId())).thenReturn(Optional.of(ticket));
    return ticket;
  }

  private User customer() {
    User user = new User(); user.setId("CUS-1"); user.setName("Khách hàng"); return user;
  }
}
