package com.swp391.selfstorage.modules.support.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import com.swp391.selfstorage.modules.support.repository.SupportTicketRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;

@Service
public class SupportTicketService {

  private static final Set<String> TICKET_PRIORITIES = Set.of("NORMAL", "HIGH", "URGENT");
  private static final int NOTES_MAX_LENGTH = 255;

  private final SupportTicketRepository tickets;
  private final ContractRepository contracts;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final com.swp391.selfstorage.common.storage.AttachmentStorage storage;
  private final UnitRepository units;
  private final UserRepository users;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();

  public SupportTicketService(
    SupportTicketRepository t,
    ContractRepository c,
    ActorContext a,
    AuditLogService au,
    com.swp391.selfstorage.common.storage.AttachmentStorage st,
    UnitRepository ur,
    UserRepository users,
    Clock cl
  ) {
    tickets = t;
    contracts = c;
    actor = a;
    audit = au;
    storage = st;
    units = ur;
    this.users = users;
    clock = cl;
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
    String category = Inputs.text(d, "category");
    String description = Inputs.text(d, "description");
    String title = Inputs.text(d, "title");
    if (title.length() > 255) throw Inputs.bad("Tiêu đề tối đa 255 ký tự");
    t.setCategory(category);
    t.setDescription(description);
    t.setTitle(title);
    if (d.containsKey("attachmentUrl") && d.get("attachmentUrl") != null) {
      String attachment = Inputs.text(d, "attachmentUrl");
      storage.requireImageOwner(attachment, u.getId());
      t.setAttachmentUrl(attachment);
    }
    String priority = d.containsKey("priority") && d.get("priority") != null
      ? Inputs.text(d, "priority").toUpperCase(Locale.ROOT) : "NORMAL";
    if (!TICKET_PRIORITIES.contains(priority)) throw Inputs.bad("Mức ưu tiên không hợp lệ");
    t.setPriority(priority);
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
          if (rate < 1 || rate > 5) throw Inputs.bad("Đánh giá phải từ 1 đến 5 sao");
          t.setRating(rate);
        } catch (NumberFormatException ex) {
          throw Inputs.bad("Đánh giá phải là số nguyên từ 1 đến 5");
        }
      }
      if (d.containsKey("notes") && d.get("notes") != null) {
        String feedback = Inputs.text(d, "notes");
        String nextNotes = (t.getNotes() != null ? t.getNotes() + " | Phản hồi khách: " : "Phản hồi khách: ") + feedback;
        if (nextNotes.length() > NOTES_MAX_LENGTH) throw Inputs.bad("Ghi chú tối đa 255 ký tự");
        t.setNotes(nextNotes);
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
        String notes = Inputs.text(d, "notes");
        if (notes.length() > NOTES_MAX_LENGTH) throw Inputs.bad("Ghi chú tối đa 255 ký tự");
        t.setNotes(notes);
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

  @Transactional
  public SupportTicket assign(String id, Map<String, Object> d) {
    var manager = actor.require("FMANAGER");
    var t = tickets.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(manager, t.getFacilityCode());
    if (!Set.of("OPEN", "IN_PROGRESS").contains(t.getStatus())) throw Inputs.conflict("Phiếu không còn chờ xử lý");
    String staffId = Inputs.text(d, "staffId");
    var target = users.findById(staffId).orElseThrow(Inputs::missing);
    actor.facility(target, t.getFacilityCode());
    if (!"STAFF".equals(actor.role(target)) || !"ACTIVE".equalsIgnoreCase(target.getStatus()))
      throw Inputs.bad("Người nhận phải là Staff đang hoạt động");
    t.setStaffAssigned(target.getId());
    if ("OPEN".equals(t.getStatus())) t.setStatus("IN_PROGRESS");
    audit.record("ASSIGN_TICKET", id, "Phân công " + target.getId());
    return tickets.save(t);
  }

  @Transactional
  public Map<String, Object> resetTemporaryPin(String id, Map<String, Object> d) {
    var staff = actor.require("STAFF", "FMANAGER");
    var t = tickets.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(staff, t.getFacilityCode());
    if (!Set.of("OPEN", "IN_PROGRESS").contains(t.getStatus())) throw Inputs.conflict("Phiếu không còn chờ xử lý");
    if (!"ACCESS".equals(t.getCategory())) throw Inputs.conflict("Chỉ cấp lại PIN cho phiếu hỗ trợ truy cập");
    if ("STAFF".equals(actor.role(staff)) && t.getStaffAssigned() != null && !staff.getId().equals(t.getStaffAssigned()))
      throw Inputs.conflict("Phiếu đang do nhân viên khác xử lý");
    if (t.getUnitCode() == null || t.getUnitCode().isBlank()) throw Inputs.conflict("Phiếu chưa gắn kho");
    var contract = contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(t.getUnitCode(), List.of("ACTIVE", "EXPIRING_SOON"))
      .filter(c -> Objects.equals(t.getUserId(), c.getUserId()) && Objects.equals(t.getFacilityCode(), c.getFacilityCode()))
      .orElseThrow(() -> Inputs.conflict("Phiếu không gắn với hợp đồng đang có quyền truy cập"));
    Unit unit = units.lockByCode(t.getUnitCode()).orElseThrow(Inputs::missing);
    var now = LocalDateTime.now(clock);
    if (!Set.of("ACTIVE", "EXPIRING_SOON").contains(contract.getStatus()) ||
         !Objects.equals(t.getUnitCode(), contract.getUnitCode()) ||
         !Objects.equals(t.getUserId(), contract.getUserId()) || !Objects.equals(t.getFacilityCode(), contract.getFacilityCode()) ||
        contract.getEndAt() == null || !now.isBefore(contract.getEndAt()) ||
        contract.getStartAt() != null && now.isBefore(contract.getStartAt()) ||
        t.getCreatedAt() != null && contract.getCreatedAt() != null && t.getCreatedAt().isBefore(contract.getCreatedAt()))
      throw Inputs.conflict("Hợp đồng không còn quyền truy cập hoặc phiếu thuộc kỳ thuê cũ");
    actor.facility(staff, unit.getFacilityCode());
    if (!"occupied".equalsIgnoreCase(unit.getStatus()) || !Objects.equals(unit.getFacilityCode(), contract.getFacilityCode()))
      throw Inputs.conflict("Kho không ở trạng thái đang thuê hợp lệ");
    String pin = String.format("%06d", random.nextInt(1_000_000));
    LocalDateTime expires = now.plusHours(8).isAfter(contract.getEndAt()) ? contract.getEndAt() : now.plusHours(8);
    unit.setTemporaryPin(pin);
    unit.setTemporaryPinExpiresAt(expires);
    units.save(unit);
    String note = Inputs.optional(d, "notes");
    String update = "Cấp lại PIN tạm đến " + expires + (note.isBlank() ? "" : ": " + note);
    if (update.length() > 255) throw Inputs.bad("Ghi chú cấp lại PIN tối đa 255 ký tự");
    t.setNotes(update);
    if ("OPEN".equals(t.getStatus())) t.setStatus("IN_PROGRESS");
    if ("STAFF".equals(actor.role(staff))) t.setStaffAssigned(staff.getId());
    tickets.save(t);
    audit.record("RESET_TEMPORARY_PIN", id, "Cấp PIN tạm cho kho " + unit.getCode());
    return Map.of("ticketId", id, "unitCode", unit.getCode(), "temporaryPin", pin, "expiresAt", expires);
  }
}
