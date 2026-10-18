package com.swp391.selfstorage.modules.reservation.service;

import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import java.time.*;
import org.springframework.stereotype.Component;

@Component
public class NoShowRules {

  public LocalDateTime appointment(Reservation r) {
    return r.getApprovedAppointmentAt() != null
      ? r.getApprovedAppointmentAt()
      : r.getAppointmentAt();
  }

  public LocalDateTime deadline(Reservation r) {
    LocalDateTime d = appointment(r).plusMinutes(
      30 +
        Math.max(
          0,
          Math.min(
            30,
            r.getExtensionMinutes() == null ? 0 : r.getExtensionMinutes()
          )
        )
    );
    return r.getHoldUntil() != null && r.getHoldUntil().isAfter(d)
      ? r.getHoldUntil()
      : d;
  }

  public boolean eligible(Reservation r, LocalDateTime now) {
    return (
      "RESERVED".equals(r.getStatus()) &&
      r.getArrivedAt() == null &&
      !Boolean.TRUE.equals(r.getIncidentOpen()) &&
      appointment(r) != null &&
      !now.isBefore(deadline(r))
    );
  }

  public LocalDateTime refundDeadline(Reservation r) {
    return appointment(r).plusHours(24);
  }
}
