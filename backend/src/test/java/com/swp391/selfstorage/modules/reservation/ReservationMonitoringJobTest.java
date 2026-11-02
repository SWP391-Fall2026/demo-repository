package com.swp391.selfstorage.modules.reservation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.job.ReservationMonitoringJob;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class ReservationMonitoringJobTest {
  private static final Instant START = Instant.parse("2026-11-02T00:00:00Z");
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final Clock clock = mock(Clock.class);
  private final ReservationMonitoringJob job = new ReservationMonitoringJob(reservations, invoices,
    new NoShowRules(), clock, new ReservationHoldPolicy(5), mock(UnitRepository.class));

  @Test void expiryUsesCurrentTimeAfterReservationLockAndLocksInvoiceSecond() {
    Reservation reservation = pending();
    when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    when(clock.instant()).thenReturn(START.plusSeconds(299));
    when(reservations.findPendingPaymentIds()).thenReturn(List.of("R-1"));
    when(reservations.lockById("R-1")).thenAnswer(call -> {
      when(clock.instant()).thenReturn(START.plusSeconds(300));
      return Optional.of(reservation);
    });
    Invoice invoice = new Invoice(); invoice.setStatus("PENDING");
    when(invoices.lockByReservationId("R-1")).thenReturn(List.of(invoice));

    job.monitor();

    assertEquals("EXPIRED", reservation.getStatus());
    assertEquals("CANCELLED", invoice.getStatus());
    var order = inOrder(reservations, invoices);
    order.verify(reservations).lockById("R-1");
    order.verify(invoices).lockByReservationId("R-1");
    verify(reservations, never()).findByStatus(anyString());
  }

  @Test void settlementThatWonReservationLockIsNeverExpired() {
    Reservation reservation = pending(); reservation.setStatus("RESERVED");
    when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    when(clock.instant()).thenReturn(START.plusSeconds(301));
    when(reservations.findPendingPaymentIds()).thenReturn(List.of("R-1"));
    when(reservations.lockById("R-1")).thenReturn(Optional.of(reservation));

    job.monitor();

    assertEquals("RESERVED", reservation.getStatus());
    verify(invoices, never()).lockByReservationId(any());
    verify(reservations, never()).save(any());
  }

  private Reservation pending() {
    Reservation reservation = new Reservation(); reservation.setId("R-1");
    reservation.setStatus("PENDING_PAYMENT"); reservation.setCreatedAt(LocalDateTime.ofInstant(START, ZoneOffset.UTC));
    return reservation;
  }
}
