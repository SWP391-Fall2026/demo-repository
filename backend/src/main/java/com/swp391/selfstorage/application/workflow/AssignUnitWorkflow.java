package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;

@Service
public class AssignUnitWorkflow {

  private final ReservationRepository reservations;
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final DailyTaskRepository tasks;
  private final ActorContext actor;
  private final InvoiceService invoices;
  private final AuditLogService audit;

  public AssignUnitWorkflow(
    ReservationRepository r,
    FacilityRepository facilities,
    UnitRepository units,
    DailyTaskRepository tasks,
    ActorContext a,
    InvoiceService i,
    AuditLogService audit
  ) {
    this.reservations = r;
    this.facilities = facilities;
    this.units = units;
    this.tasks = tasks;
    this.actor = a;
    this.invoices = i;
    this.audit = audit;
  }

  @Transactional
  public Reservation execute(String id, Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    facilities.lockByCode(m.getFacilityCode()).orElseThrow(Inputs::missing);
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(m, r.getFacilityCode());
    if (!"RESERVED".equals(r.getStatus())) {
      throw Inputs.conflict("Đơn chưa đặt cọc thành công");
    }
    invoices.requirePaid(id, "DEPOSIT");

    String targetUnitCode = (d != null && d.get("unitCode") != null) ? String.valueOf(d.get("unitCode")).trim() : "";

    Unit assigned;
    if (!targetUnitCode.isEmpty()) {
      assigned = units.lockByCode(targetUnitCode).orElseThrow(Inputs::missing);
      if (!Objects.equals(assigned.getFacilityCode(), r.getFacilityCode())) {
        throw Inputs.conflict("Kho không thuộc cơ sở của đơn đặt");
      }
      if (!assigned.getType().equalsIgnoreCase(r.getUnitType())) {
        throw Inputs.conflict("Loại kho không khớp với loại đã đặt");
      }
      if (assigned.getCode().equals(r.getUnitCode())) {
        return r;
      }
      if (!"available".equalsIgnoreCase(assigned.getStatus())) {
        throw Inputs.conflict("Kho đã được sử dụng hoặc đang bảo trì");
      }
    } else {
      assigned = units.lockAvailableByFacilityAndType(
          r.getFacilityCode(), r.getUnitType(), PageRequest.of(0, 1))
        .stream().findFirst()
        .orElseThrow(() -> Inputs.conflict("Không còn kho trống phù hợp tại cơ sở"));
    }

    // Giải phóng kho cũ nếu đơn trước đó đã từng được gán kho khác
    if (r.getUnitCode() != null && !r.getUnitCode().equals(assigned.getCode())) {
      units.lockByCode(r.getUnitCode()).ifPresent(old -> {
        old.setStatus("available");
        old.setHeldByReservationId(null);
        old.setTenantName(null);
        units.save(old);
      });
    }

    // Giữ kho mới cho đơn
    assigned.setStatus("reserved");
    assigned.setHeldByReservationId(r.getId());
    assigned.setTenantName(r.getCustomerName());
    units.save(assigned);

    // Cập nhật mã kho vào Reservation
    r.setUnitCode(assigned.getCode());
    reservations.save(r);

    // Đồng bộ vào task check-in nếu đã được tạo
    tasks.findByReservationIdAndTaskType(r.getId(), "CHECKIN").ifPresent(t -> {
      t.setUnitCode(assigned.getCode());
      tasks.save(t);
    });

    audit.record("ASSIGN_UNIT", r.getId(), "Facility Manager gán phòng kho " + assigned.getCode());
    return r;
  }
}
