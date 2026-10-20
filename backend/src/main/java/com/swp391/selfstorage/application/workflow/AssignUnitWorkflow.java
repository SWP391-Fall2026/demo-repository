package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignUnitWorkflow {

  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final com.swp391.selfstorage.modules.facility.repository.FacilityRepository facilities;
  private final ActorContext actor;
  private final InvoiceService invoices;
  private final TaskService tasks;
  private final AuditLogService audit;

  public AssignUnitWorkflow(
    ReservationRepository r,
    UnitRepository u,
    com.swp391.selfstorage.modules.facility.repository.FacilityRepository facilities,
    ActorContext a,
    InvoiceService i,
    TaskService t,
    AuditLogService au
  ) {
    reservations = r;
    units = u;
    this.facilities = facilities;
    actor = a;
    invoices = i;
    tasks = t;
    audit = au;
  }

  @Transactional
  public Reservation execute(String id, Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    facilities.lockByCode(m.getFacilityCode()).orElseThrow(Inputs::missing);
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(m, r.getFacilityCode());
    if (
      !"RESERVED".equals(r.getStatus()) || r.getUnitCode() != null
    ) throw Inputs.conflict("Đơn phải đã đặt cọc và chưa gán phòng");
    invoices.requirePaid(id, "DEPOSIT");
    var unit = units
      .lockByCode(Inputs.text(d, "unitCode"))
      .orElseThrow(Inputs::missing);
    actor.facility(m, unit.getFacilityCode());
    if (
      !r.getUnitType().equals(unit.getType()) ||
      !"available".equals(unit.getStatus())
    ) throw Inputs.conflict("Kho không phù hợp hoặc không còn trống");
    unit.setStatus("reserved");
    unit.setHeldByReservationId(id);
    unit.setTenantName(r.getCustomerName());
    units.save(unit);
    r.setUnitCode(unit.getCode());
    reservations.save(r);
    tasks.bindCheckinUnit(id, unit.getCode());
    audit.record("ASSIGN_UNIT", id, "Gán kho " + unit.getCode());
    return r;
  }
}
