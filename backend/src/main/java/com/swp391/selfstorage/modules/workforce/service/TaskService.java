package com.swp391.selfstorage.modules.workforce.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

  private final DailyTaskRepository tasks;
  private final UserRepository users;
  private final ActorContext actor;
  private final AuditLogService audit;

  public TaskService(
    DailyTaskRepository t,
    UserRepository u,
    ActorContext a,
    AuditLogService au
  ) {
    tasks = t;
    users = u;
    actor = a;
    audit = au;
  }

  public List<DailyTask> list() {
    var u = actor.require("STAFF", "FMANAGER");
    return "STAFF".equals(actor.role(u))
      ? tasks.findByStaffId(u.getId())
      : tasks.findByFacilityCode(u.getFacilityCode());
  }

  @Transactional
  public DailyTask assign(Map<String, Object> d) {
    var m = actor.require("FMANAGER");
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
      Inputs.text(d, "taskType"),
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
    if (!Set.of("IN_PROGRESS", "COMPLETED").contains(status)) throw Inputs.bad(
      "Trạng thái không hợp lệ"
    );
    t.setStatus(status);
    audit.record("UPDATE_TASK_STATUS", id, status);
    return tasks.save(t);
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
}
