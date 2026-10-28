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
  private final com.swp391.selfstorage.common.storage.AttachmentStorage storage;

  public SupportTicketService(
    SupportTicketRepository t,
    ContractRepository c,
    ActorContext a,
    AuditLogService au,
    com.swp391.selfstorage.common.storage.AttachmentStorage st
  ) {
    tickets = t;
    contracts = c;
    actor = a;
    audit = au;
    storage = st;
  }

  public Map<String, String> uploadAttachment(org.springframework.web.multipart.MultipartFile file) {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    String key = storage.saveOwnedImage(file, user.getId());
    return Map.of("attachmentUrl", "/api/files/" + key);
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
    if (d.containsKey("attachmentUrl") && d.get("attachmentUrl") != null) {
      String attachment = Inputs.text(d, "attachmentUrl");
      storage.requireImageOwner(attachment, u.getId());
      t.setAttachmentUrl(attachment);
    }
    t.setPriority(d.containsKey("priority") && d.get("priority") != null ? Inputs.text(d, "priority") : "NORMAL");
    t.setStatus("OPEN");
    t.setCreatedAt(LocalDateTime.now());
    tickets.save(t);
    audit.record("CREATE_TICKET", t.getId(), "Gửi yêu cầu hỗ trợ");
    return t;
  }

  @Transactional
  public SupportTicket update(String id, Map<String, Object> d) {
    var u = actor.require("STAFF", "FMANAGER", "CUSTOMER");
    var t = tickets.lockById(id).orElseThrow(Inputs::missing);
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
          int rate = Integer.parseInt(String.valueOf(d.get("rating")));
          if (rate >= 1 && rate <= 5) {
            t.setRating(rate);
          }
        } catch (Exception ignored) {}
      }
      if (d.containsKey("notes") && d.get("notes") != null) {
        String feedback = Inputs.text(d, "notes");
        t.setNotes((t.getNotes() != null ? t.getNotes() + " | Phản hồi khách: " : "Phản hồi khách: ") + feedback);
      }
    } else {
      if ("CLOSED".equals(t.getStatus())) throw Inputs.conflict("Phiếu đã đóng");
      if ("RESOLVED".equals(t.getStatus())) throw Inputs.conflict("Phiếu đã xử lý; chờ khách đánh giá");
      if (!Set.of("IN_PROGRESS", "RESOLVED").contains(status)) throw Inputs.bad(
        "Tiến độ không hợp lệ"
      );
      if ("RESOLVED".equals(status) && !"IN_PROGRESS".equals(t.getStatus())) throw Inputs.conflict("Tiếp nhận phiếu trước khi hoàn tất");
      if (t.getStaffAssigned() != null && "STAFF".equals(actor.role(u)) && !u.getId().equals(t.getStaffAssigned()))
        throw Inputs.conflict("Phiếu đang do nhân viên khác xử lý");
      t.setStaffAssigned(u.getId());
      if (d.containsKey("notes") && d.get("notes") != null) {
        t.setNotes(Inputs.text(d, "notes"));
      }
      if (d.containsKey("attachmentUrl") && d.get("attachmentUrl") != null) {
        String attachment = Inputs.text(d, "attachmentUrl");
        storage.requireImageOwner(attachment, u.getId());
        t.setAttachmentUrl(attachment);
      }
      if ("RESOLVED".equals(status)) t.setResolvedAt(LocalDateTime.now());
    }
    t.setStatus(status);
    audit.record("UPDATE_TICKET_STATUS", id, status + (t.getRating() != null ? " (Rating: " + t.getRating() + "*)" : ""));
    return tickets.save(t);
  }
}
