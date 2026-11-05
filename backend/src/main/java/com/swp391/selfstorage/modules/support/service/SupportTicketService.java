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
    this.tickets = t;
    this.contracts = c;
    this.actor = a;
    this.audit = au;
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
    String code = Inputs.optional(d, "unitCode");
    var c = contracts
      .findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        code,
        List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE")
      )
      .filter(v -> u.getId().equals(v.getUserId()));

    SupportTicket t = new SupportTicket();
    t.setId("TCK-" + UUID.randomUUID());
    t.setUserId(u.getId());
    t.setCustomerName(u.getName());

    if (c.isPresent()) {
      t.setFacilityCode(c.get().getFacilityCode());
      t.setUnitCode(code);
    } else {
      var anyContract = contracts.findByUserId(u.getId()).stream()
        .filter(v -> List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(v.getStatus()))
        .findFirst();
      if (anyContract.isPresent()) {
        t.setFacilityCode(anyContract.get().getFacilityCode());
        t.setUnitCode(code.isEmpty() ? anyContract.get().getUnitCode() : code);
      } else {
        t.setFacilityCode(u.getFacilityCode() != null ? u.getFacilityCode() : "HN-CG");
        t.setUnitCode(code);
      }
    }

    String category = Inputs.optional(d, "category");
    t.setCategory(category.isEmpty() ? "OTHER" : category);
    t.setDescription(Inputs.text(d, "description"));
    t.setTitle(Inputs.text(d, "title"));

    String priority = Inputs.optional(d, "priority");
    t.setPriority(priority.isEmpty() ? "NORMAL" : priority);
    t.setStatus("OPEN");
    t.setCreatedAt(LocalDateTime.now());

    String attachmentUrl = Inputs.optional(d, "attachmentUrl");
    if (!attachmentUrl.isEmpty()) {
      t.setAttachmentUrl(attachmentUrl);
    }

    tickets.save(t);
    audit.record("CREATE_TICKET", t.getId(), "Gửi yêu cầu hỗ trợ: " + t.getTitle());
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
      if (d.containsKey("rating") && d.get("rating") != null) {
        try {
          t.setRating(Integer.parseInt(String.valueOf(d.get("rating"))));
        } catch (Exception ignored) {}
      }
    } else {
      if (!Set.of("IN_PROGRESS", "RESOLVED").contains(status)) throw Inputs.bad(
        "Tiến độ không hợp lệ"
      );
      t.setStaffAssigned(u.getId());
      String notes = Inputs.optional(d, "notes");
      if (!notes.isEmpty()) {
        t.setNotes(notes);
      }
      if ("RESOLVED".equals(status)) t.setResolvedAt(LocalDateTime.now());
    }
    t.setStatus(status);
    audit.record("UPDATE_TICKET_STATUS", id, status);
    return tickets.save(t);
  }
}
