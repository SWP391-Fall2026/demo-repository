package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class HandoverWorkflow {

  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final ContractRepository contracts;
  private final HandoverRecordRepository records;
  private final InvoiceService invoices;
  private final InvoiceRepository invoiceRepository;
  private final PaymentRepository payments;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final TaskService tasks;
  private final AttachmentStorage storage;
  private final FacilityRepository facilities;
  private final UserRepository users;

  public HandoverWorkflow(
    ReservationRepository r,
    UnitRepository u,
    ContractRepository c,
    HandoverRecordRepository h,
    InvoiceService i,
    InvoiceRepository invoiceRepository,
    PaymentRepository payments,
    ActorContext a,
    AuditLogService au,
    Clock cl,
    TaskService tasks,
    AttachmentStorage storage,
    FacilityRepository facilities,
    UserRepository users
  ) {
    reservations = r;
    units = u;
    contracts = c;
    records = h;
    invoices = i;
    this.invoiceRepository = invoiceRepository;
    this.payments = payments;
    actor = a;
    audit = au;
    clock = cl;
    this.tasks = tasks;
    this.storage = storage;
    this.facilities = facilities;
    this.users = users;
  }

  @Transactional
  public Contract execute(Map<String, Object> d) {
    return execute(d, null);
  }

  @Transactional
  public Contract execute(Map<String, Object> d, MultipartFile evidence) {
    var staff = actor.require("STAFF");
    String id = Inputs.text(d, "reservationId");
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(staff, r.getFacilityCode());
    validateReadyForHandover(r, id, staff.getId());
    Contract c = contracts.lockByReservationId(id).orElseThrow(Inputs::missing);
    requirePaymentEvidence(r, "DEPOSIT", null);
    requirePaymentEvidence(r, "RENT", c.getId());
    var unit = units.lockByCode(r.getUnitCode()).orElseThrow(Inputs::missing);
    if (!r.getUnitCode().equals(Inputs.text(d, "unitCode")))
      throw Inputs.conflict("Mã kho kiểm tra không khớp kho được phân công");
    if (
      !"reserved".equals(unit.getStatus()) ||
      !id.equals(unit.getHeldByReservationId())
    ) throw Inputs.conflict("Kho không còn được giữ cho đơn này");
    if (!"PENDING_HANDOVER".equals(c.getStatus()) || c.getPinCode() == null)
      throw Inputs.conflict("Cần thanh toán hóa đơn thuê thành công trước khi lập biên bản bàn giao");
    if (!Boolean.parseBoolean(Objects.toString(d.get("handoverEligibleConfirmed"), "false")))
      throw Inputs.bad("Cần xác nhận khách đủ điều kiện bàn giao kho");
    String conditionStatus = Inputs.text(d, "conditionStatus");
    if (!Set.of("CLEAN", "ISSUE").contains(conditionStatus))
      throw Inputs.bad("Tình trạng kho không hợp lệ");
    String notes = Inputs.text(d, "unitConditionNotes");
    String staffNotes = Inputs.optional(d, "staffNotes");
    if ("ISSUE".equals(conditionStatus) && notes.isBlank())
      throw Inputs.bad("Cần mô tả vấn đề của kho");
    var now = LocalDateTime.now(clock);
    HandoverRecord h = records.findFirstByContractIdOrderByHandoverDateDesc(c.getId()).orElseGet(() -> {
      HandoverRecord created = new HandoverRecord();
      created.setId("HND-" + UUID.randomUUID()); created.setContractId(c.getId()); created.setReservationId(id);
      return created;
    });
    boolean repairable = "ISSUE_REPORTED".equals(h.getStatus()) || "ISSUE".equals(h.getConditionStatus());
    if (h.getHandoverDate() != null && !repairable)
      throw Inputs.conflict("Biên bản đã lập; không thể tạo bàn giao lần hai");
    h.setStaffId(staff.getId()); h.setHandoverDate(now);
    h.setCustomerSignatureConfirmed(false); h.setStatus("PENDING_CUSTOMER_CONFIRMATION");
    h.setCustomerConfirmedAt(null); h.setCustomerConfirmedBy(null); h.setConfirmationVersion(null);
    h.setCustomerIssueNotes(null); h.setUnitConditionNotes(notes);
    h.setConditionStatus(conditionStatus); h.setStaffNotes(staffNotes);
    if (evidence != null && !evidence.isEmpty()) {
      String oldEvidence = h.getEvidencePath();
      String evidencePath = storage.saveImage(evidence);
      h.setEvidencePath(evidencePath);
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override public void afterCompletion(int status) {
          if (status != STATUS_COMMITTED) storage.remove(evidencePath);
          else if (oldEvidence != null && !oldEvidence.equals(evidencePath)) storage.remove(oldEvidence);
        }
      });
    }
    records.save(h);
    audit.record("PREPARE_HANDOVER", c.getId(), "Staff lập biên bản chờ khách xác nhận kho " + unit.getCode());
    return c;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> eligibleForStaff() {
    var staff = actor.require("STAFF");
    return tasks.list().stream()
        .filter(task -> "CHECKIN".equals(task.getTaskType()) && Set.of("IN_PROGRESS", "COMPLETED").contains(task.getStatus()) && task.getReservationId() != null)
        .map(task -> reservations.findById(task.getReservationId()).orElse(null))
        .filter(Objects::nonNull)
        .filter(reservation -> "RESERVED".equals(reservation.getStatus()) && reservation.getUnitCode() != null)
        .filter(reservation -> contracts.findByReservationId(reservation.getId())
            .filter(contract -> {
              if (!"PENDING_HANDOVER".equals(contract.getStatus())) return false;
              return records.findFirstByContractIdOrderByHandoverDateDesc(contract.getId())
                  .map(record -> "ISSUE_REPORTED".equals(record.getStatus()) || "ISSUE".equals(record.getConditionStatus()))
                  .orElse(true);
            }).isPresent())
        .map(reservation -> context(reservation.getId()))
        .toList();
  }

  private Map<String, Object> context(String reservationId) {
    var reservation = reservations.findById(reservationId).orElseThrow(Inputs::missing);
    Contract contract = contracts.findByReservationId(reservationId).orElseThrow(Inputs::missing);
    var customer = users.findById(reservation.getUserId()).orElseThrow(Inputs::missing);
    var facility = facilities.findById(reservation.getFacilityCode()).orElseThrow(Inputs::missing);
    var unit = units.findById(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    HandoverRecord previous = records.findFirstByContractIdOrderByHandoverDateDesc(contract.getId()).orElse(null);
    return Map.ofEntries(
        Map.entry("reservationId", reservation.getId()), Map.entry("contractId", contract.getId()),
        Map.entry("customerName", Objects.toString(customer.getName(), "")), Map.entry("customerPhone", Objects.toString(customer.getPhone(), "")),
        Map.entry("facilityName", facility.getName()), Map.entry("facilityCode", facility.getCode()),
        Map.entry("unitCode", unit.getCode()), Map.entry("unitType", unit.getType()),
        Map.entry("contractStatus", contract.getStatus()), Map.entry("depositStatus", "PAID"), Map.entry("rentStatus", "PAID"),
        Map.entry("previousIssueNotes", previous == null ? "" : Objects.toString(previous.getCustomerIssueNotes(), "")),
        Map.entry("previousConditionNotes", previous == null ? "" : Objects.toString(previous.getUnitConditionNotes(), "")));
  }

  @Transactional
  public HandoverRecord reportIssue(String contractId, Map<String, Object> input) {
    var customer = actor.require("CUSTOMER");
    Contract visibleContract = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, visibleContract.getUserId(), visibleContract.getFacilityCode())) throw Inputs.missing();
    var reservation = reservations.lockById(visibleContract.getReservationId()).orElseThrow(Inputs::missing);
    Contract contract = contracts.lockById(contractId).orElseThrow(Inputs::missing);
    if (!customer.getId().equals(contract.getUserId())) throw Inputs.missing();
    if (!"PENDING_HANDOVER".equals(contract.getStatus()) || !"RESERVED".equals(reservation.getStatus()))
      throw Inputs.conflict("Chỉ báo vấn đề khi hợp đồng đang chờ bàn giao");
    HandoverRecord record = records.findFirstByContractIdOrderByHandoverDateDesc(contractId)
        .orElseThrow(() -> Inputs.conflict("Chưa có biên bản để báo vấn đề"));
    if (!"PENDING_CUSTOMER_CONFIRMATION".equals(record.getStatus()))
      throw Inputs.conflict("Biên bản không còn chờ xác nhận");
    record.setStatus("ISSUE_REPORTED");
    record.setCustomerIssueNotes("Khách hàng báo kho có vấn đề; cần liên hệ trực tiếp Staff cơ sở.");
    record.setCustomerIssueReportedAt(LocalDateTime.now(clock)); record.setCustomerIssueReportedBy(customer.getId());
    audit.record("HANDOVER_ISSUE_REPORTED", contractId, "Khách báo vấn đề hiện trạng bàn giao");
    return records.save(record);
  }

  @Transactional(readOnly = true)
  public java.nio.file.Path evidence(String contractId) {
    var user = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    Contract contract = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(user, contract.getUserId(), contract.getFacilityCode())) throw Inputs.missing();
    HandoverRecord record = records.findFirstByContractIdOrderByHandoverDateDesc(contractId).orElseThrow(Inputs::missing);
    if (record.getEvidencePath() == null || record.getEvidencePath().isBlank()) throw Inputs.missing();
    return storage.resolve(record.getEvidencePath());
  }

  @Transactional
  public Contract confirmByCustomer(String contractId, Map<String, Object> d) {
    var customer = actor.require("CUSTOMER");
    if (!Boolean.TRUE.equals(d.get("customerInspectionConfirmed"))
        || !Boolean.TRUE.equals(d.get("handoverRecordConfirmed"))
        || !Boolean.TRUE.equals(d.get("receivedUnitConfirmed")))
      throw Inputs.bad("Cần xác nhận đủ ba nội dung bàn giao");
    if (!"HANDOVER-2026-10".equals(Inputs.text(d, "confirmationVersion")))
      throw Inputs.conflict("Phiên bản xác nhận bàn giao đã thay đổi; tải lại biên bản");
    Contract visibleContract = contracts.findById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, visibleContract.getUserId(), visibleContract.getFacilityCode())) throw Inputs.missing();
    var r = reservations.lockById(visibleContract.getReservationId()).orElseThrow(Inputs::missing);
    Contract c = contracts.lockById(contractId).orElseThrow(Inputs::missing);
    if (!c.getUserId().equals(r.getUserId())) throw Inputs.missing();
    if ("ACTIVE".equals(c.getStatus()) && "CHECKED_IN".equals(r.getStatus())) return c;
    if (!"RESERVED".equals(r.getStatus()) || r.getUnitCode() == null)
      throw Inputs.conflict("Đơn chưa ở trạng thái chờ bàn giao");
    invoices.requirePaid(r.getId(), "DEPOSIT"); invoices.requirePaid(r.getId(), "RENT");
    requirePaymentEvidence(r, "DEPOSIT", null); requirePaymentEvidence(r, "RENT", c.getId());
    if (r.getIdentityVerifiedAt() == null || r.getContractTermsAcceptedAt() == null)
      throw Inputs.conflict("Hợp đồng chưa đủ điều kiện bàn giao");
    if (!"PENDING_HANDOVER".equals(c.getStatus()) || c.getPinCode() == null)
      throw Inputs.conflict("Hợp đồng chưa sẵn sàng bàn giao");
    var unit = units.lockByCode(r.getUnitCode()).orElseThrow(Inputs::missing);
    if (!"reserved".equals(unit.getStatus()) || !r.getId().equals(unit.getHeldByReservationId()))
      throw Inputs.conflict("Kho không còn được giữ cho đơn này");
    HandoverRecord h = records.findFirstByContractIdOrderByHandoverDateDesc(c.getId())
        .orElseThrow(() -> Inputs.conflict("Staff chưa lập biên bản bàn giao"));
    if (!"PENDING_CUSTOMER_CONFIRMATION".equals(h.getStatus()))
      throw Inputs.conflict("Biên bản bàn giao không còn chờ xác nhận");
    if ("ISSUE".equals(h.getConditionStatus()))
      throw Inputs.conflict("Biên bản ghi nhận vấn đề; chờ Staff xử lý trước khi xác nhận");
    var now = LocalDateTime.now(clock);
    h.setCustomerSignatureConfirmed(true); h.setStatus("COMPLETED"); h.setCustomerConfirmedAt(now);
    h.setCustomerConfirmedBy(customer.getId()); h.setConfirmationVersion("HANDOVER-2026-10"); records.save(h);
    c.setStatus("ACTIVE"); contracts.save(c);
    unit.setStatus("occupied"); unit.setPinCode(c.getPinCode()); unit.setTemporaryPin(null); unit.setTemporaryPinExpiresAt(null); units.save(unit);
    r.setStatus("CHECKED_IN"); r.setArrivedAt(now); reservations.save(r);
    tasks.completeCheckinByReservation(r.getId());
    audit.record("COMPLETE_HANDOVER", c.getId(), "Khách xác nhận nhận kho " + unit.getCode());
    return c;
  }

  private void validateReadyForHandover(com.swp391.selfstorage.modules.reservation.entity.Reservation r, String id, String staffId) {
    if (!"RESERVED".equals(r.getStatus()) || r.getUnitCode() == null)
      throw Inputs.conflict("Đơn phải được đặt cọc và gán phòng");
    invoices.requirePaid(id, "DEPOSIT"); invoices.requirePaid(id, "RENT");
    if (r.getContractTermsAcceptedAt() == null) throw Inputs.conflict("Khách chưa xác nhận điều khoản hợp đồng");
    if (r.getIdentityVerifiedAt() == null) throw Inputs.conflict("Staff chưa xác minh danh tính khách tại quầy");
    tasks.requireAssignedCheckin(id, staffId);
  }

  private void requirePaymentEvidence(com.swp391.selfstorage.modules.reservation.entity.Reservation reservation, String type, String contractId) {
    Invoice invoice = invoiceRepository.findByReservationIdAndInvoiceType(reservation.getId(), type)
        .orElseThrow(() -> Inputs.conflict("Chưa có hóa đơn " + type));
    if (!"PAID".equals(invoice.getStatus()) || !reservation.getUserId().equals(invoice.getUserId())
        || !reservation.getFacilityCode().equals(invoice.getFacilityCode()))
      throw Inputs.conflict("Hóa đơn " + type + " chưa thanh toán hoặc không khớp đơn/khách/cơ sở");
    if (contractId != null && !contractId.equals(invoice.getContractId()))
      throw Inputs.conflict("Hóa đơn thuê không khớp hợp đồng");
    boolean matched = payments.findByInvoiceId(invoice.getId()).stream().anyMatch(payment ->
        "PAID".equals(payment.getStatus())
            && reservation.getId().equals(payment.getReservationId())
            && type.equals(payment.getInvoiceType())
            && (contractId == null || contractId.equals(payment.getContractId()))
            && invoice.getAmount() != null && payment.getAmount() != null
            && invoice.getAmount().compareTo(payment.getAmount()) == 0);
    if (!matched) throw Inputs.conflict("Chưa có giao dịch PAID đúng số tiền cho hóa đơn " + type);
  }
}
