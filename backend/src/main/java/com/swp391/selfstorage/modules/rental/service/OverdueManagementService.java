package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OverdueManagementService {
  private final ContractRepository contracts;
  private final UnitRepository units;
  private final ActorContext actor;
  private final TaskService tasks;
  private final AuditLogService audit;
  private final Clock clock;

  public OverdueManagementService(ContractRepository c, UnitRepository u, ActorContext a, TaskService t,
      AuditLogService au, Clock cl) {
    contracts = c; units = u; actor = a; tasks = t; audit = au; clock = cl;
  }

  public List<Contract> list() {
    var manager = actor.require("FMANAGER");
    return contracts.findByFacilityCode(manager.getFacilityCode()).stream()
        .filter(c -> "OVERDUE".equals(c.getStatus()))
        .toList();
  }

  @Transactional
  public Map<String, Object> action(String id, Map<String, Object> input) {
    var manager = actor.require("FMANAGER");
    Contract c = contracts.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(manager, c.getFacilityCode());
    if (!"OVERDUE".equals(c.getStatus())) throw Inputs.conflict("Hợp đồng không còn quá hạn");
    String action = Inputs.text(input, "action").toUpperCase(Locale.ROOT);
    if ("REMIND".equals(action)) {
      tasks.system(c.getFacilityCode(), "Nhắc công nợ quá hạn: " + c.getId(), "SUPPORT",
          c.getUnitCode(), null, c.getId());
      audit.record("OVERDUE_REMINDER", c.getId(), "Tạo công việc nhắc công nợ");
    } else if ("REQUEST_RETURN".equals(action)) {
      if (c.getCheckoutRequestedAt() == null) {
        c.setCheckoutRequestedAt(LocalDateTime.now(clock));
        c.setCheckoutRequestedDate(LocalDate.now(clock));
        contracts.save(c);
        tasks.system(c.getFacilityCode(), "Nghiệm thu trả kho quá hạn: " + c.getId(), "RETURN",
            c.getUnitCode(), null, c.getId());
      }
      audit.record("OVERDUE_RETURN_REQUEST", c.getId(), "Yêu cầu trả kho quá hạn");
    } else if ("LOCK".equals(action)) {
      c.setPinCode(null);
      contracts.save(c);
      if (c.getUnitCode() != null) {
        Unit unit = units.lockByCode(c.getUnitCode()).orElseThrow(Inputs::missing);
        actor.facility(manager, unit.getFacilityCode());
        unit.setPinCode(null);
        unit.setTemporaryPin(null);
        unit.setTemporaryPinExpiresAt(null);
        units.save(unit);
      }
      audit.record("OVERDUE_LOCK", c.getId(), "Xác nhận khóa quyền truy cập quá hạn");
    } else throw Inputs.bad("Thao tác quá hạn không hợp lệ");
    return Map.of("contractId", c.getId(), "action", action, "status", c.getStatus(),
        "checkoutRequested", c.getCheckoutRequestedAt() != null);
  }
}
