package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.NoShowRules;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoShowWorkflow {

  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final NoShowRules rules;
  private final Clock clock;

  public NoShowWorkflow(
    ReservationRepository r,
    UnitRepository u,
    ActorContext a,
    AuditLogService au,
    NoShowRules n,
    Clock c
  ) {
    reservations = r;
    units = u;
    actor = a;
    audit = au;
    rules = n;
    clock = c;
  }

  private Reservation lock(String id, User a) {
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(a, r.getFacilityCode());
    if (!"RESERVED".equals(r.getStatus())) throw Inputs.conflict(
      "Đơn không còn hợp lệ để xử lý NO_SHOW"
    );
    return r;
  }

  @Transactional
  public Reservation arrived(String id) {
    var a = actor.require("STAFF");
    var r = lock(id, a);
    r.setArrivedAt(LocalDateTime.now(clock));
    audit.record("CUSTOMER_ARRIVED", id, "Khách đã đến quầy, đang làm thủ tục");
    return reservations.save(r);
  }

  @Transactional
  public Reservation extend(String id, Map<String, Object> d) {
    var a = actor.require("STAFF");
    var r = lock(id, a);
    int minutes = Integer.parseInt(Inputs.text(d, "minutes"));
    if (
      Boolean.TRUE.equals(r.getExtensionUsed()) ||
      minutes < 1 ||
      minutes > 30 ||
      r.getArrivedAt() != null
    ) throw Inputs.conflict("Chỉ gia hạn một lần, tối đa 30 phút");
    if (
      LocalDateTime.now(clock).isAfter(rules.appointment(r).plusMinutes(30))
    ) throw Inputs.conflict("Đã qua thời điểm cấp gia hạn thông thường");
    r.setExtensionUsed(true);
    r.setExtensionMinutes(minutes);
    r.setExceptionReason(Inputs.text(d, "reason"));
    audit.record("EXTEND_WAIT", id, r.getExceptionReason());
    return reservations.save(r);
  }

  @Transactional
  public Reservation schedule(String id, Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    var r = lock(id, m);
    String reason = Inputs.text(d, "reason");
    var now = LocalDateTime.now(clock);
    String next = Inputs.optional(d, "appointmentAt"),
      hold = Inputs.optional(d, "holdUntil");
    if (next.isBlank() && hold.isBlank()) throw Inputs.bad(
      "Cần lịch hẹn hoặc hạn giữ mới"
    );
    if (!next.isBlank()) {
      var at = LocalDateTime.parse(next);
      if (!at.isAfter(now)) throw Inputs.bad("Lịch mới phải trong tương lai");
      r.setApprovedAppointmentAt(at);
      r.setScheduleApprovedBy(m.getId());
      r.setNoShowAlertAt(null);
    }
    if (!hold.isBlank()) {
      var until = LocalDateTime.parse(hold);
      if (!until.isAfter(now)) throw Inputs.bad("Hạn giữ phải trong tương lai");
      if (until.isAfter(rules.refundDeadline(r))) throw Inputs.conflict(
        "Phải phê duyệt giờ hẹn mới trước khi giữ vượt hạn yêu cầu hoàn hiện tại"
      );
      r.setHoldUntil(until);
    }
    r.setIncidentOpen(false);
    r.setExceptionReason(reason);
    audit.record(
      "APPROVE_SCHEDULE",
      id,
      reason + "; lịch=" + next + "; giữ đến=" + hold
    );
    return reservations.save(r);
  }

  @Transactional
  public Reservation confirm(String id, Map<String, Object> d) {
    var a = actor.require("STAFF");
    var r = lock(id, a);
    if (!rules.eligible(r, LocalDateTime.now(clock))) throw Inputs.conflict(
      "Chưa đủ điều kiện NO_SHOW hoặc khách đã đến/có ngoại lệ"
    );
    String reason = Inputs.text(d, "reason");
    r.setStatus("NO_SHOW");
    if (r.getUnitCode() != null) {
      var u = units.lockByCode(r.getUnitCode()).orElseThrow(Inputs::missing);
      if (
        "reserved".equals(u.getStatus()) &&
        id.equals(u.getHeldByReservationId())
      ) {
        u.setStatus("available");
        u.setHeldByReservationId(null);
        u.setTenantName(null);
        u.setTemporaryPin(null);
        u.setTemporaryPinExpiresAt(null);
        units.save(u);
      }
    }
    reservations.save(r);
    audit.record("CONFIRM_NO_SHOW", id, reason + "; cọc giữ nguyên, khách tạo yêu cầu hoàn ngoại lệ trong 24 giờ");
    return r;
  }

  @Transactional
  public Reservation incident(String id, Map<String, Object> d) {
    var a = actor.require("STAFF", "FMANAGER");
    var r = lock(id, a);
    r.setIncidentOpen(true);
    r.setExceptionReason(Inputs.text(d, "reason"));
    audit.record("SUSPEND_NO_SHOW", id, r.getExceptionReason());
    return reservations.save(r);
  }
}
