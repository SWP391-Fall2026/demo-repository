package com.swp391.selfstorage.modules.reservation.job;

import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.NoShowRules;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import java.time.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReservationMonitoringJob {

  private final ReservationRepository reservations;
  private final InvoiceRepository invoices;
  private final NoShowRules rules;
  private final Clock clock;
  private final ReservationHoldPolicy holdPolicy;
  private final UnitRepository units;

  public ReservationMonitoringJob(
    ReservationRepository r,
    InvoiceRepository i,
    NoShowRules n,
    Clock c,
    ReservationHoldPolicy holdPolicy,
    UnitRepository units
  ) {
    reservations = r;
    invoices = i;
    rules = n;
    clock = c;
    this.holdPolicy = holdPolicy;
    this.units = units;
  }

  @Scheduled(fixedDelayString = "${app.reservation-monitor-ms:5000}")
  @Transactional
  public void monitor() {
    var now = LocalDateTime.now(clock);
    for (var candidate : reservations.findByStatus("PENDING_PAYMENT")) {
      if (
        !candidate.getCreatedAt().plus(holdPolicy.pendingPaymentHold()).isAfter(now)
      ) {
        var pendingInvoices = invoices.lockByReservationId(candidate.getId());
        var r = reservations.lockById(candidate.getId()).orElseThrow();
        if (!"PENDING_PAYMENT".equals(r.getStatus())) continue;
        r.setStatus("EXPIRED");
        if (r.getUnitCode() != null) {
          units.lockByCode(r.getUnitCode()).ifPresent(unit -> {
            if ("reserved".equals(unit.getStatus()) && r.getId().equals(unit.getHeldByReservationId())) {
              unit.setStatus("available");
              unit.setTenantName(null);
              unit.setHeldByReservationId(null);
              units.save(unit);
            }
          });
        }
        reservations.save(r);
        pendingInvoices.forEach(i -> {
          if ("PENDING".equals(i.getStatus())) {
            i.setStatus("CANCELLED");
            invoices.save(i);
          }
        });
      }
    }
    for (var candidate : reservations.findAll()) {
      if (
        rules.eligible(candidate, now) && candidate.getNoShowAlertAt() == null
      ) {
        var r = reservations.lockById(candidate.getId()).orElseThrow();
        if (rules.eligible(r, now)) {
          r.setNoShowAlertAt(now);
          reservations.save(r);
        }
      }
    }
  }
}
