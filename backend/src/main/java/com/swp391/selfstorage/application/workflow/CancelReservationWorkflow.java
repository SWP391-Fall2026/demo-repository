package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancelReservationWorkflow {

  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final InvoiceRepository invoices;

  public CancelReservationWorkflow(
    ReservationRepository r,
    UnitRepository u,
    ActorContext a,
    AuditLogService au,
    Clock clock,
    InvoiceRepository invoices
  ) {
    reservations = r;
    units = u;
    actor = a;
    audit = au;
    this.clock = clock;
    this.invoices = invoices;
  }

  @Transactional
  public Reservation execute(String id, Map<String, Object> d) {
    var a = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    if (
      !actor.visible(a, r.getUserId(), r.getFacilityCode())
    ) throw Inputs.missing();
    if (
      !Set.of("PENDING_PAYMENT", "RESERVED").contains(r.getStatus())
    ) throw Inputs.conflict("Không thể hủy đơn ở trạng thái này");
    String reason = Inputs.text(d, "reason");
    r.setStatus("CANCELLED");
    r.setCancelledAt(LocalDateTime.now(clock));
    if (r.getUnitCode() != null) {
      var unit = units.lockByCode(r.getUnitCode()).orElseThrow(Inputs::missing);
      if (
        "reserved".equals(unit.getStatus()) &&
        id.equals(unit.getHeldByReservationId())
      ) {
        unit.setStatus("available");
        unit.setTenantName(null);
        unit.setHeldByReservationId(null);
        unit.setTemporaryPin(null);
        unit.setTemporaryPinExpiresAt(null);
        units.save(unit);
      }
    }
    reservations.save(r);
    invoices.findByReservationId(id).forEach(invoice -> {
      if ("PENDING".equals(invoice.getStatus())) {
        invoice.setStatus("CANCELLED");
        invoices.save(invoice);
      }
    });
    audit.record(
      "CANCEL_RESERVATION",
      id,
      reason + "; hoàn tiền xử lý qua yêu cầu riêng"
    );
    return r;
  }
}
