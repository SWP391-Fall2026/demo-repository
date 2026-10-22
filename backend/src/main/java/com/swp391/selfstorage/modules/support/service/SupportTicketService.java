package com.swp391.selfstorage.modules.support.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import com.swp391.selfstorage.modules.support.repository.SupportTicketRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

  private final SupportTicketRepository tickets;
  private final ContractRepository contracts;
  private final ActorContext actor;
  private final AuditLogService audit;

  public SupportTicketService(
    SupportTicketRepository t,
    ContractRepository c,
    ActorContext a,
    AuditLogService au
  ) {
    tickets = t;
    contracts = c;
    actor = a;
    audit = au;
  }

  public List<SupportTicket> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return "CUSTOMER".equals(actor.role(u))
      ? tickets.findByUserId(u.getId())
      : tickets.findByFacilityCode(u.getFacilityCode());
  }

  @Transactional
  public SupportTicket create(Map<String, Object> d) {
    var u = actor.require("CUSTOMER");
    String code = Inputs.text(d, "unitCode");
    var c = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        code,
        List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE")
      )
      .filter(v -> u.getId().equals(v.getUserId()))
      .orElseThrow(Inputs::missing);
    SupportTicket t = new SupportTicket();
    t.setId("TCK-" + UUID.randomUUID());
    t.setUserId(u.getId());
    t.setCustomerName(u.getName());
    t.setFacilityCode(c.getFacilityCode());
    t.setUnitCode(code);
    t.setCategory(Inputs.text(d, "category"));
    t.setDescription(Inputs.text(d, "description"));
    t.setTitle(Inputs.text(d, "title"));
    t.setPriority("NORMAL");
    t.setStatus("OPEN");
    t.setCreatedAt(LocalDateTime.now());
    tickets.save(t);
    audit.record("CREATE_TICKET", t.getId(), "Gửi yêu cầu hỗ trợ");
    return t;
  }

  @Transactional
  public SupportTicket update(String id, Map<String, Object> d) {
    var u = actor.require("STAFF", "FMANAGER", "CUSTOMER");
    var t = tickets.findById(id).orElseThrow(Inputs::missing);
    if (
      !actor.visible(u, t.getUserId(), t.getFacilityCode())
    ) throw Inputs.missing();
    String status = Inputs.text(d, "status");
    if ("CUSTOMER".equals(actor.role(u))) {
      if (
        !"RESOLVED".equals(t.getStatus()) || !"CLOSED".equals(status)
      ) throw Inputs.conflict("Chỉ đóng phiếu đã xử lý");
    } else {
      if (!Set.of("IN_PROGRESS", "RESOLVED").contains(status)) throw Inputs.bad(
        "Tiến độ không hợp lệ"
      );
      t.setStaffAssigned(u.getId());
      t.setNotes(Inputs.text(d, "notes"));
      if ("RESOLVED".equals(status)) t.setResolvedAt(LocalDateTime.now());
    }
    t.setStatus(status);
    audit.record("UPDATE_TICKET_STATUS", id, status);
    return tickets.save(t);
  }
}
