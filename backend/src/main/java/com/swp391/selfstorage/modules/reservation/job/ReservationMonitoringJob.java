package com.swp391.selfstorage.modules.reservation.job;

import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.NoShowRules;
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

  public ReservationMonitoringJob(
    ReservationRepository r,
    InvoiceRepository i,
    NoShowRules n,
    Clock c
  ) {
    reservations = r;
    invoices = i;
    rules = n;
    clock = c;
  }

  @Scheduled(fixedDelayString = "${app.reservation-monitor-ms:60000}")
  @Transactional
  public void monitor() {
    var now = LocalDateTime.now(clock);
    for (var candidate : reservations.findAll()) {
      if (
        "PENDING_PAYMENT".equals(candidate.getStatus()) &&
        !candidate.getCreatedAt().plusHours(24).isAfter(now)
      ) {
        var r = reservations.lockById(candidate.getId()).orElseThrow();
        if (!"PENDING_PAYMENT".equals(r.getStatus())) continue;
        r.setStatus("EXPIRED");
        reservations.save(r);
        invoices.findByReservationId(r.getId()).forEach(i -> {
          if ("PENDING".equals(i.getStatus())) {
            i.setStatus("CANCELLED");
            invoices.save(i);
          }
        });
      } else if (
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
