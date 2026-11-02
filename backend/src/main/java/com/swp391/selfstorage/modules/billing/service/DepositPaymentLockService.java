package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** Serializes deposit settlement with capacity changes before locking billing rows. */
@Service
public class DepositPaymentLockService {
  private final InvoiceRepository invoices;
  private final FacilityRepository facilities;
  private final ReservationRepository reservations;
  private final ReservationHoldPolicy holds;

  public DepositPaymentLockService(InvoiceRepository invoices, FacilityRepository facilities,
      ReservationRepository reservations, ReservationHoldPolicy holds) {
    this.invoices = invoices;
    this.facilities = facilities;
    this.reservations = reservations;
    this.holds = holds;
  }

  public Optional<Reservation> forInvoice(String id) {
    return invoices.findDepositScopeById(id).map(this::lockReservation);
  }

  public Optional<Reservation> forTransaction(String code) {
    return invoices.findDepositScopeByTransactionCode(code).map(this::lockReservation);
  }

  private Reservation lockReservation(InvoiceRepository.DepositScope scope) {
    facilities.lockByCode(scope.getFacilityCode()).orElseThrow(Inputs::missing);
    Reservation reservation = reservations.lockById(scope.getReservationId()).orElseThrow(Inputs::missing);
    if (!Objects.equals(scope.getFacilityCode(), reservation.getFacilityCode())) throw Inputs.conflict("Cơ sở đơn đặt không khớp hóa đơn");
    return reservation;
  }

  public boolean payable(Invoice invoice, Reservation reservation, LocalDateTime now) {
    return reservation != null && Objects.equals(invoice.getReservationId(), reservation.getId())
      && Objects.equals(invoice.getFacilityCode(), reservation.getFacilityCode())
      && Objects.equals(invoice.getUserId(), reservation.getUserId())
      && "PENDING_PAYMENT".equals(reservation.getStatus()) && reservation.getCreatedAt() != null
      && reservation.getCreatedAt().plus(holds.pendingPaymentHold()).isAfter(now);
  }
}
