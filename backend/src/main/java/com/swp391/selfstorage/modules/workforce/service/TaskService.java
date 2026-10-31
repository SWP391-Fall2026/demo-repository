package com.swp391.selfstorage.modules.workforce.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.InspectionRecordRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

  private final DailyTaskRepository tasks;
  private final UserRepository users;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final ReservationRepository reservations;
  private final ContractRepository contracts;
  private final InspectionRecordRepository inspections;
  private final InvoiceService invoices;
  private final Clock clock;
  private final java.security.SecureRandom random = new java.security.SecureRandom();
  private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

  public TaskService(
    DailyTaskRepository t,
    UserRepository u,
    ActorContext a,
    AuditLogService au,
    FacilityRepository facilities,
    UnitRepository units,
    ReservationRepository reservations,
    ContractRepository contracts,
    InspectionRecordRepository inspections,
    InvoiceService invoices,
    Clock clock,
    org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
  ) {
    tasks = t;
    users = u;
    actor = a;
    audit = au;
    this.facilities = facilities;
    this.units = units;
    this.reservations = reservations;
    this.contracts = contracts;
    this.inspections = inspections;
    this.invoices = invoices;
    this.clock = clock;
    this.passwordEncoder = passwordEncoder;
  }

  public List<DailyTask> list() {
    var u = actor.require("STAFF", "FMANAGER");
    List<DailyTask> rows = "STAFF".equals(actor.role(u))
      ? tasks.findByStaffId(u.getId())
      : tasks.findByFacilityCode(u.getFacilityCode());
    rows.forEach(this::enrichReturn);
    return rows;
  }

  private void enrichReturn(DailyTask task) {
    if (!"RETURN".equals(task.getTaskType()) || task.getContractId() == null) return;
    contracts.findById(task.getContractId()).ifPresent(contract -> {
      task.setCustomerName(contract.getCustomerName());
      task.setCustomerPhone(contract.getCustomerPhone());
      task.setCheckoutRequestedDate(contract.getCheckoutRequestedDate());
      task.setCheckoutReason(contract.getCheckoutReason());
    });
    if (task.getUnitCode() != null) {
      units.findById(task.getUnitCode()).ifPresent(unit -> task.setUnitType(unit.getType()));
    }
    inspections.findFirstByContractIdOrderByInspectionDateDesc(task.getContractId()).ifPresent(inspection -> {
      task.setInspectionStatus(inspection.getStatus());
      task.setInspectionPenaltyFee(inspection.getPenaltyFee());
      task.setInspectionRefundAmount(inspection.getDepositRefundAmount());
    });
  }

  @Transactional
  public DailyTask assign(Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    String taskType = Inputs.text(d, "taskType");
    if ("CHECKIN".equalsIgnoreCase(taskType))
      throw Inputs.bad("Task CHECKIN chỉ được tạo từ request thẻ hẹn sau khi khách đã thanh toán cọc");
    var staff = users
      .findById(Inputs.text(d, "staffId"))
      .orElseThrow(Inputs::missing);
    actor.facility(staff, m.getFacilityCode());
    if (!"STAFF".equals(actor.role(staff))) throw Inputs.bad(
      "Người nhận phải là Staff"
    );
    DailyTask t = system(
      m.getFacilityCode(),
      Inputs.text(d, "title"),
      taskType,
      Inputs.optional(d, "unitCode"),
      null,
      null
    );
    t.setStaffId(staff.getId());
    t.setStaff(staff.getName());
    t.setDueDate(LocalDate.parse(Inputs.text(d, "date")));
    tasks.save(t);
    audit.record("ASSIGN_TASK", t.getId(), "Phân công " + staff.getId());
    return t;
  }

  @Transactional
  public DailyTask progress(String id, Map<String, Object> d) {
    var u = actor.require("STAFF", "FMANAGER");
    var t = tasks.findById(id).orElseThrow(Inputs::missing);
    actor.facility(u, t.getFacilityCode());
    if (
      "STAFF".equals(actor.role(u)) && !u.getId().equals(t.getStaffId())
    ) throw Inputs.missing();
    String status = Inputs.text(d, "status");
    if ("CHECKIN".equals(t.getTaskType()) && "COMPLETED".equals(status))
      throw Inputs.conflict("Task check-in chỉ hoàn tất sau khi xác minh khách và nhân viên bàn giao kho");
    if ("RETURN".equals(t.getTaskType()) && "COMPLETED".equals(status))
      throw Inputs.conflict("Task trả kho chỉ hoàn tất sau khi Staff nghiệm thu trả kho");
    if (!Set.of("IN_PROGRESS", "COMPLETED").contains(status)) throw Inputs.bad(
      "Trạng thái không hợp lệ"
    );
    t.setStatus(status);
    audit.record("UPDATE_TASK_STATUS", id, status);
    return tasks.save(t);
  }

  public DailyTask find(String id) { return tasks.findById(id).orElseThrow(Inputs::missing); }

  public DailyTask save(DailyTask t) { return tasks.save(t); }

  public DailyTask findForCustomer(String reservationId) {
    var customer = actor.require("CUSTOMER");
    var reservation = reservations.findById(reservationId).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, reservation.getUserId(), reservation.getFacilityCode())) throw Inputs.missing();
    return tasks.findByReservationIdAndTaskType(reservationId, "CHECKIN").orElse(null);
  }

  public void requireAssignedReturn(String contractId, String staffId) {
    DailyTask task = tasks.findByContractIdAndTaskType(contractId, "RETURN").orElseThrow(Inputs::missing);
    if (!staffId.equals(task.getStaffId()) || !Set.of("PENDING", "IN_PROGRESS").contains(task.getStatus()))
      throw Inputs.conflict("Staff phải được phân công task nghiệm thu trả kho trước khi mở nghiệm thu");
  }

  @Transactional
  public DailyTask requestReturn(String facilityCode, String contractId, String unitCode, java.time.LocalDate dueDate, String reason) {
    var existing = tasks.findByContractIdAndTaskType(contractId, "RETURN");
    if (existing.isPresent()) {
      DailyTask task = existing.get();
      task.setDueDate(dueDate);
      task.setDeadline("17:00");
      if (reason != null && !reason.isBlank()) task.setTitle("Nghiệm thu trả kho: " + contractId + " — " + reason);
      return tasks.save(task);
    }
    DailyTask task = new DailyTask();
    task.setId("TSK-" + UUID.randomUUID());
    task.setFacilityCode(facilityCode);
    task.setTitle("Nghiệm thu trả kho: " + contractId + (reason != null && !reason.isBlank() ? " — " + reason : ""));
    task.setTaskType("RETURN");
    task.setUnitCode(unitCode);
    task.setContractId(contractId);
    task.setDueDate(dueDate);
    task.setDeadline("17:00");
    task.setStatus("PENDING");
    task.setStaff("Chờ Facility Manager phân công");
    task.setStaffId(null);
    return tasks.save(task);
  }

  @Transactional
  public void completeReturnByContract(String contractId) {
    tasks.findByContractIdAndTaskType(contractId, "RETURN").ifPresent(task -> {
      task.setStatus("COMPLETED");
      tasks.save(task);
    });
  }

  public void requireAssignedCheckin(String reservationId, String staffId) {
    DailyTask task = tasks.findByReservationIdAndTaskType(reservationId, "CHECKIN").orElseThrow(Inputs::missing);
    if (!staffId.equals(task.getStaffId()) || !Set.of("IN_PROGRESS", "COMPLETED").contains(task.getStatus()))
      throw Inputs.conflict("Staff phải được phân công task check-in trước handover");
  }

  public DailyTask system(
    String facility,
    String title,
    String type,
    String unit,
    String reservation,
    String contract
  ) {
    DailyTask t = new DailyTask();
    t.setId("TSK-" + UUID.randomUUID());
    t.setFacilityCode(facility);
    t.setTitle(title);
    t.setTaskType(type);
    t.setUnitCode(unit);
    t.setReservationId(reservation);
    t.setContractId(contract);
    t.setDueDate(LocalDate.now());
    t.setDeadline("17:00");
    t.setStatus("PENDING");
    var staff = users
      .findAll()
      .stream()
      .filter(
        u ->
          "STAFF".equals(u.getRole()) &&
          Objects.equals(u.getFacilityCode(), facility) &&
          "ACTIVE".equals(u.getStatus())
      )
      .findFirst();
    t.setStaff(staff.map(u -> u.getName()).orElse("Chưa phân công"));
    t.setStaffId(staff.map(u -> u.getId()).orElse(null));
    return tasks.save(t);
  }

  @Transactional
  public DailyTask requestCheckin(Reservation reservation) {
    var existing = tasks.findByReservationIdAndTaskType(reservation.getId(), "CHECKIN");
    if (existing.isPresent()) {
      DailyTask task = existing.get();
      task.setUnitCode(reservation.getUnitCode());
      return tasks.save(task);
    }
    DailyTask task = new DailyTask();
    task.setId("TSK-" + UUID.randomUUID());
    task.setFacilityCode(reservation.getFacilityCode());
    task.setTitle("Xác nhận khách check-in " + reservation.getId());
    task.setTaskType("CHECKIN");
    task.setUnitCode(reservation.getUnitCode());
    task.setReservationId(reservation.getId());
    task.setDueDate(reservation.getAppointmentAt() == null ? LocalDate.now() : reservation.getAppointmentAt().toLocalDate());
    task.setDeadline(reservation.getAppointmentAt() == null ? "17:00" : reservation.getAppointmentAt().toLocalTime().toString());
    task.setStatus("PENDING");
    task.setStaff("Chờ Facility Manager phân công");
    task.setStaffId(null);
    return tasks.save(task);
  }

  @Transactional
  public DailyTask assignExisting(String id, Map<String, Object> d) {
    var manager = actor.require("FMANAGER");
    DailyTask task = tasks.findById(id).orElseThrow(Inputs::missing);
    actor.facility(manager, task.getFacilityCode());
    User staff = null;
    if (d.containsKey("staffId") && !Inputs.optional(d, "staffId").isBlank()) {
      staff = users.findById(Inputs.text(d, "staffId")).orElseThrow(Inputs::missing);
      actor.facility(staff, manager.getFacilityCode());
      if (!"STAFF".equals(actor.role(staff))) throw Inputs.bad("Người nhận phải là Staff");
    }
    if (staff == null && !"CHECKIN".equals(task.getTaskType()))
      throw Inputs.bad("Chọn Staff để giao task");
    if (!Set.of("PENDING", "IN_PROGRESS").contains(task.getStatus())) throw Inputs.conflict("Task không còn chờ xử lý");
    if ("CHECKIN".equals(task.getTaskType()) && task.getReservationId() != null) {
      Reservation reservation = reservations.lockById(task.getReservationId()).orElseThrow(Inputs::missing);
      actor.facility(manager, reservation.getFacilityCode());
      if (reservation.getIdentityVerifiedAt() != null) throw Inputs.conflict("Không đổi nhân viên sau khi đã xác minh khách");
      if (!"RESERVED".equals(reservation.getStatus())) throw Inputs.conflict("Thẻ hẹn chưa ở trạng thái sẵn sàng check-in");
      invoices.requirePaid(reservation.getId(), "DEPOSIT");
      if (d.containsKey("unitCode")) throw Inputs.bad("Kho check-in được chọn tự động theo thẻ hẹn");
      if (reservation.getUnitCode() == null) {
        var candidate = units.lockAvailableByFacilityAndType(
            reservation.getFacilityCode(), reservation.getUnitType(), PageRequest.of(0, 1))
            .stream().findFirst()
            .orElseThrow(() -> Inputs.conflict("Không còn Unit trống đúng cơ sở và loại kho trên thẻ hẹn"));
        actor.facility(manager, candidate.getFacilityCode());
        candidate.setStatus("reserved");
        candidate.setHeldByReservationId(reservation.getId());
        candidate.setTenantName(reservation.getCustomerName());
        units.save(candidate);
        reservation.setUnitCode(candidate.getCode());
        reservations.save(reservation);
        task.setUnitCode(candidate.getCode());
      } else if (task.getUnitCode() == null) {
        task.setUnitCode(reservation.getUnitCode());
      } else if (!reservation.getUnitCode().equals(task.getUnitCode())) {
        throw Inputs.conflict("Kho của task không khớp kho đã gán cho đơn");
      }
      task.setStatus("PENDING");
    }
    if ("CHECKIN".equals(task.getTaskType()) && task.getUnitCode() != null) {
      var unit = units.lockByCode(task.getUnitCode()).orElseThrow(Inputs::missing);
      actor.facility(manager, unit.getFacilityCode());
      if (task.getReservationId() != null) {
        Reservation reservation = reservations.findById(task.getReservationId()).orElseThrow(Inputs::missing);
        if (!Objects.equals(unit.getFacilityCode(), reservation.getFacilityCode())
            || !Objects.equals(unit.getType(), reservation.getUnitType())
            || !Objects.equals(unit.getHeldByReservationId(), reservation.getId())
            || !"reserved".equalsIgnoreCase(unit.getStatus()))
          throw Inputs.conflict("Kho không khớp với thẻ hẹn hoặc không còn được giữ");
      }
      ensureTemporaryPin(unit, task.getReservationId(), true);
    }
    if (staff != null) { task.setStaffId(staff.getId()); task.setStaff(staff.getName()); }
    if (d.containsKey("date")) task.setDueDate(LocalDate.parse(Inputs.text(d, "date")));
    return tasks.save(task);
  }

  @Transactional
  public void bindCheckinUnit(String reservationId, String unitCode) {
    tasks.findByReservationIdAndTaskType(reservationId, "CHECKIN").ifPresent(task -> {
      task.setUnitCode(unitCode);
      var unit = units.lockByCode(unitCode).orElseThrow(Inputs::missing);
      ensureTemporaryPin(unit, reservationId, true);
      tasks.save(task);
    });
  }

  private void ensureTemporaryPin(com.swp391.selfstorage.modules.facility.entity.Unit unit, String reservationId, boolean rotate) {
    if (!rotate && unit.getTemporaryPin() != null && unit.getTemporaryPinExpiresAt() != null && unit.getTemporaryPinExpiresAt().isAfter(LocalDateTime.now(clock))) return;
    Reservation reservation = reservationId == null ? null : reservations.findById(reservationId).orElse(null);
    String pin = String.format("%06d", random.nextInt(1_000_000));
    unit.setTemporaryPin(pin);
      LocalDateTime appointment = reservation == null ? null : reservation.getAppointmentAt();
      LocalDateTime now = LocalDateTime.now(clock);
      unit.setTemporaryPinExpiresAt(appointment == null || !appointment.isAfter(now)
        ? now.plusHours(8) : appointment.plusHours(2));
    units.save(unit);
  }

  public List<Map<String, String>> staffOptions() {
    var manager = actor.require("FMANAGER");
    return users.findAll().stream()
      .filter(u -> "STAFF".equals(actor.role(u)) && "ACTIVE".equals(u.getStatus()) && Objects.equals(manager.getFacilityCode(), u.getFacilityCode()))
      .map(u -> Map.of("id", u.getId(), "name", u.getName(), "username", u.getUsername()))
      .toList();
  }

  @Transactional
  public Map<String, Object> managerDashboard() {
    var manager = actor.require("FMANAGER");
    String facilityCode = manager.getFacilityCode();
    var facility = facilities.findById(facilityCode).orElseThrow(Inputs::missing);
    List<DailyTask> facilityTasks = tasks.findByFacilityCode(facilityCode);
    for (DailyTask task : facilityTasks) {
      if (!"CHECKIN".equals(task.getTaskType()) || task.getUnitCode() != null || task.getReservationId() == null)
        continue;
      reservations.lockById(task.getReservationId())
          .filter(reservation -> Objects.equals(facilityCode, reservation.getFacilityCode()))
          .ifPresent(reservation -> {
            if (!"RESERVED".equals(reservation.getStatus())) return;
            var candidate = units.lockAvailableByFacilityAndType(
                reservation.getFacilityCode(), reservation.getUnitType(), PageRequest.of(0, 1))
                .stream().findFirst().orElse(null);
            if (candidate == null) return;
            candidate.setStatus("reserved");
            candidate.setHeldByReservationId(reservation.getId());
            candidate.setTenantName(reservation.getCustomerName());
            units.save(candidate);
            reservation.setUnitCode(candidate.getCode());
            reservations.save(reservation);
            task.setUnitCode(candidate.getCode());
            tasks.save(task);
          });
    }
    Map<String, Long> taskCounts = new HashMap<>();
    for (DailyTask task : facilityTasks) {
      if (task.getStaffId() != null && !"COMPLETED".equals(task.getStatus()))
        taskCounts.merge(task.getStaffId(), 1L, Long::sum);
    }
    var staff = users.findAll().stream()
        .filter(user -> "STAFF".equals(actor.role(user)) && Objects.equals(facilityCode, user.getFacilityCode()))
        .map(user -> Map.<String, Object>of(
            "id", user.getId(), "name", Objects.toString(user.getName(), ""),
            "username", Objects.toString(user.getUsername(), ""), "status", Objects.toString(user.getStatus(), ""),
            "assignedTaskCount", taskCounts.getOrDefault(user.getId(), 0L),
            "openTaskCount", taskCounts.getOrDefault(user.getId(), 0L),
            "canReceiveTasks", "ACTIVE".equalsIgnoreCase(user.getStatus())))
        .toList();
    var unitRows = units.findByFacilityCode(facilityCode).stream().map(unit -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("code", unit.getCode()); row.put("type", unit.getType()); row.put("status", unit.getStatus());
      row.put("size", unit.getSizeDesc());
      boolean pinValid = unit.getTemporaryPinExpiresAt() != null && unit.getTemporaryPinExpiresAt().isAfter(LocalDateTime.now(clock));
      row.put("temporaryPin", pinValid ? Objects.toString(unit.getTemporaryPin(), "") : "");
      row.put("temporaryPinExpiresAt", pinValid ? unit.getTemporaryPinExpiresAt() : null);
      return row;
    }).toList();
    var taskRows = facilityTasks.stream().map(task -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", task.getId()); row.put("title", task.getTitle()); row.put("taskType", task.getTaskType());
      row.put("status", task.getStatus()); row.put("staffId", task.getStaffId()); row.put("staff", task.getStaff());
      row.put("reservationId", task.getReservationId()); row.put("unitCode", task.getUnitCode());
      row.put("facilityCode", task.getFacilityCode());
      row.put("dueDate", task.getDueDate()); row.put("deadline", task.getDeadline());
      row.put("contractId", task.getContractId());
      if ("RETURN".equals(task.getTaskType()) && task.getContractId() != null) {
        contracts.findById(task.getContractId()).ifPresent(contract -> {
          row.put("customerName", contract.getCustomerName());
          row.put("customerPhone", contract.getCustomerPhone());
          row.put("checkoutRequestedDate", contract.getCheckoutRequestedDate());
          row.put("checkoutReason", contract.getCheckoutReason());
          row.put("contractStatus", contract.getStatus());
          row.put("depositFee", contract.getDepositFee());
        });
        inspections.findFirstByContractIdOrderByInspectionDateDesc(task.getContractId()).ifPresent(inspection -> {
          row.put("inspectionStatus", inspection.getStatus());
          row.put("inspectionPenaltyFee", inspection.getPenaltyFee());
          row.put("inspectionRefundAmount", inspection.getDepositRefundAmount());
        });
      }
      if (task.getReservationId() != null) reservations.findById(task.getReservationId())
          .filter(reservation -> Objects.equals(facilityCode, reservation.getFacilityCode())).ifPresent(reservation -> {
        row.put("customerName", reservation.getCustomerName()); row.put("customerPhone", reservation.getCustomerPhone());
        row.put("appointmentAt", reservation.getAppointmentAt()); row.put("startDate", reservation.getStartDate());
        row.put("durationMonths", reservation.getDurationMonths()); row.put("reservationStatus", reservation.getStatus());
        row.put("unitType", reservation.getUnitType()); row.put("facilityCode", reservation.getFacilityCode());
        if (task.getUnitCode() == null && reservation.getUnitCode() != null)
          row.put("unitCode", reservation.getUnitCode());
      });
      if (task.getUnitCode() != null && !row.containsKey("unitType"))
        units.findById(task.getUnitCode()).filter(unit -> Objects.equals(facilityCode, unit.getFacilityCode()))
            .ifPresent(unit -> row.put("unitType", unit.getType()));
      return row;
    }).toList();
    return Map.of(
        "facility", Map.of("code", facility.getCode(), "name", facility.getName(), "address", facility.getAddress(),
            "city", facility.getCity(), "hotline", Objects.toString(facility.getHotline(), ""),
            "status", facility.getStatus(), "checkinPinConfigured", facility.getCheckinPinHash() != null,
            "checkinPin", Objects.toString(facility.getCheckinPin(), "")),
        "staff", staff, "units", unitRows, "tasks", taskRows);
  }

  @Transactional
  public Map<String, String> setFacilityCheckinPin(String requestedFacilityCode) {
    var manager = actor.require("FMANAGER");
    actor.facility(manager, requestedFacilityCode);
    var facility = facilities.lockByCode(requestedFacilityCode).orElseThrow(Inputs::missing);
    String pin = String.format("%06d", random.nextInt(1_000_000));
    facility.setCheckinPinHash(passwordEncoder.encode(pin));
    facility.setCheckinPin(pin);
    facilities.save(facility);
    audit.record("ROTATE_FACILITY_CHECKIN_PIN", requestedFacilityCode, "PIN cơ sở được xoay vòng");
    return Map.of("facilityCode", facility.getCode(), "pin", pin,
      "notice", "PIN chỉ hiển thị lần này; truyền cho Staff qua kênh nội bộ bảo mật.");
  }

  @Transactional
  public Map<String, Object> credentials(String id) {
    var staff = actor.require("STAFF");
    DailyTask task = tasks.findById(id).orElseThrow(Inputs::missing);
    if (!staff.getId().equals(task.getStaffId()) || !"CHECKIN".equals(task.getTaskType())) throw Inputs.missing();
    if (!Set.of("PENDING", "IN_PROGRESS").contains(task.getStatus())) throw Inputs.conflict("Task không còn hiệu lực");
    if (task.getReservationId() == null || task.getUnitCode() == null)
      throw Inputs.conflict("Task check-in chưa liên kết thẻ hẹn và kho; yêu cầu Manager kiểm tra lại");
    var reservation = reservations.findById(task.getReservationId()).orElseThrow(Inputs::missing);
    actor.facility(staff, reservation.getFacilityCode());
    var facility = facilities.findById(reservation.getFacilityCode()).orElseThrow(Inputs::missing);
    var unit = units.findById(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    task.setStatus("IN_PROGRESS"); tasks.save(task);
    audit.record("ISSUE_CHECKIN_CREDENTIALS", task.getId(), "Mở thông tin đối chiếu check-in cho reservation " + reservation.getId());
    Map<String, Object> details = new LinkedHashMap<>();
    details.put("taskId", task.getId()); details.put("reservationId", reservation.getId());
    details.put("customerName", reservation.getCustomerName());
    details.put("customerPhone", Objects.toString(reservation.getCustomerPhone(), ""));
    details.put("facilityCode", facility.getCode()); details.put("facilityPin", Objects.toString(facility.getCheckinPin(), ""));
    details.put("unitCode", unit.getCode()); details.put("unitPin", Objects.toString(unit.getTemporaryPin(), ""));
    details.put("unitPinExpiresAt", Objects.toString(unit.getTemporaryPinExpiresAt(), ""));
    details.put("appointmentAt", reservation.getAppointmentAt());
    details.put("startDate", reservation.getStartDate());
    details.put("durationMonths", reservation.getDurationMonths());
    details.put("depositStatus", "PAID");
    details.put("appointmentCardStatus", "PAID · RESERVED");
    details.put("documentChecklist", List.of(
        "Thẻ hẹn hoặc mã đơn đặt chỗ",
        "CCCD/giấy tờ tùy thân bản gốc để đối chiếu trực tiếp",
        "Thông tin cơ sở và mã kho trên task"
    ));
    details.put("appointmentCardCode", reservation.getId()); details.put("status", task.getStatus());
    return details;
  }

  @Transactional
  public void completeCheckinByReservation(String reservationId) {
    tasks.findByReservationIdAndTaskType(reservationId, "CHECKIN").ifPresent(task -> {
      task.setStatus("COMPLETED");
      tasks.save(task);
    });
  }
}
