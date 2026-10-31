package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.event.CheckinVerifiedEvent;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;

@Service
public class CheckinWorkflow {
  private static final String TERMS_VERSION = "SELFSTORAGE-RENTAL-2026.10";
  private final ReservationRepository reservations;
  private final DailyTaskRepository tasks;
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final UserRepository users;
  private final InvoiceService invoices;
  private final InvoiceRepository invoiceRepository;
  private final PolicyService policies;
  private final ObjectMapper objectMapper;
  private final TaskService taskService;
  private final ActorContext actor;
  private final Clock clock;
  private final ContractRepository contracts;
  private final ApplicationEventPublisher events;

  public CheckinWorkflow(ReservationRepository reservations, DailyTaskRepository tasks,
      FacilityRepository facilities, UnitRepository units, UserRepository users,
      InvoiceService invoices, InvoiceRepository invoiceRepository, PolicyService policies, ObjectMapper objectMapper,
      TaskService taskService, ActorContext actor, Clock clock, ContractRepository contracts,
      ApplicationEventPublisher events) {
    this.reservations = reservations; this.tasks = tasks; this.facilities = facilities;
    this.units = units; this.users = users; this.invoices = invoices;
    this.invoiceRepository = invoiceRepository; this.policies = policies; this.objectMapper = objectMapper;
    this.taskService = taskService; this.actor = actor; this.clock = clock;
    this.contracts = contracts; this.events = events;
  }

  @Transactional
  public DailyTask request(String reservationId) {
    var customer = actor.require("CUSTOMER");
    Reservation reservation = reservations.lockById(reservationId).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, reservation.getUserId(), reservation.getFacilityCode())) throw Inputs.missing();
    if (!"RESERVED".equals(reservation.getStatus()))
      throw Inputs.conflict("Chỉ tạo yêu cầu sau khi đã đặt cọc và giữ chỗ");
    invoices.requirePaid(reservationId, "DEPOSIT");
    assignUnitFromAppointment(reservation);
    return tasks.findByReservationIdAndTaskType(reservationId, "CHECKIN")
      .orElseGet(() -> taskService.requestCheckin(reservation));
  }

  private void assignUnitFromAppointment(Reservation reservation) {
    if (reservation.getUnitCode() != null) {
      Unit assigned = units.lockByCode(reservation.getUnitCode()).orElseThrow(Inputs::missing);
      if (!Objects.equals(assigned.getFacilityCode(), reservation.getFacilityCode())
          || !Objects.equals(assigned.getType(), reservation.getUnitType())
          || !Objects.equals(assigned.getHeldByReservationId(), reservation.getId())
          || !"reserved".equalsIgnoreCase(assigned.getStatus()))
        throw Inputs.conflict("Kho hiện tại không khớp yêu cầu trên thẻ hẹn");
      return;
    }
    Unit assigned = units.lockAvailableByFacilityAndType(
        reservation.getFacilityCode(), reservation.getUnitType(), PageRequest.of(0, 1))
      .stream().findFirst()
      .orElseThrow(() -> Inputs.conflict("Không còn kho trống phù hợp với cơ sở và loại kho trong thẻ hẹn"));
    assigned.setStatus("reserved");
    assigned.setHeldByReservationId(reservation.getId());
    assigned.setTenantName(reservation.getCustomerName());
    units.save(assigned);
    reservation.setUnitCode(assigned.getCode());
    reservations.save(reservation);
  }

  @Transactional
  public Reservation verify(DailyTask task, Map<String, Object> input) {
    var staff = actor.require("STAFF");
    if (!staff.getId().equals(task.getStaffId()) || !"CHECKIN".equals(task.getTaskType())) throw Inputs.missing();
    if (!"IN_PROGRESS".equals(task.getStatus())) throw Inputs.conflict("Facility Manager phải phân công task, Staff cần bắt đầu xác minh trước");
    Reservation reservation = reservations.lockById(Objects.requireNonNull(task.getReservationId())).orElseThrow(Inputs::missing);
    actor.facility(staff, reservation.getFacilityCode());
    if (!"RESERVED".equals(reservation.getStatus()) || reservation.getUnitCode() == null)
      throw Inputs.conflict("Đơn chưa sẵn sàng check-in");
    invoices.requirePaid(reservation.getId(), "DEPOSIT");
    if (reservation.getIdentityVerifiedAt() != null) return reservation;
    Facility facility = facilities.findById(reservation.getFacilityCode()).orElseThrow(Inputs::missing);
    Unit unit = units.findById(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    User customerRecord = users.findById(reservation.getUserId()).orElseThrow(Inputs::missing);
    if (!reservation.getId().equals(Inputs.text(input, "appointmentCardCode"))) throw Inputs.bad("Mã thẻ hẹn không khớp task được giao");
    if (!Boolean.TRUE.equals(input.get("identityDocumentsConfirmed"))) throw Inputs.bad("Cần xác nhận đã đối chiếu CCCD/giấy tờ với hồ sơ khách hàng");
    if (!Boolean.TRUE.equals(input.get("appointmentCardConfirmed"))) throw Inputs.bad("Cần xác nhận mã thẻ hẹn hợp lệ");
    LocalDateTime now = LocalDateTime.now(clock);
    reservation.setArrivedAt(now);
    reservation.setIdentityVerifiedAt(now);
    reservation.setIdentityVerifiedBy(staff.getId());
    reservation.setContractTermsVersion(TERMS_VERSION);
    try {
      reservation.setContractTermsSnapshot(objectMapper.writeValueAsString(terms(reservation, facility, unit, customerRecord, staff.getName())));
    } catch (Exception e) { throw new IllegalStateException("Không tạo được bản điều khoản hợp đồng", e); }
    reservations.save(reservation);
    Contract contract = contracts.findByReservationId(reservation.getId()).orElseGet(() -> {
      LocalDateTime start = reservation.getRentalStartAt() == null
          ? reservation.getStartDate().atStartOfDay() : reservation.getRentalStartAt();
      Contract offer = new Contract();
      offer.setId("CTR-" + UUID.randomUUID()); offer.setReservationId(reservation.getId());
      offer.setUserId(reservation.getUserId()); offer.setFacilityCode(reservation.getFacilityCode());
      offer.setUnitCode(reservation.getUnitCode()); offer.setCustomerName(reservation.getCustomerName());
      offer.setCustomerPhone(reservation.getCustomerPhone()); offer.setStartAt(start);
      offer.setEndAt(start.plusMonths(reservation.getDurationMonths())); offer.setStartDate(start.toLocalDate());
      offer.setEndDate(start.plusMonths(reservation.getDurationMonths()).toLocalDate());
      offer.setDurationMonths(reservation.getDurationMonths()); offer.setMonthlyFee(reservation.getMonthlyPriceSnapshot());
      offer.setDepositFee(reservation.getDepositAmount()); offer.setPinCode(null);
      offer.setStatus("PENDING_PAYMENT"); offer.setCreatedAt(now);
      return contracts.save(offer);
    });
    if (!"PENDING_PAYMENT".equals(contract.getStatus()) || contract.getPinCode() != null)
      throw Inputs.conflict("Hợp đồng đã qua bước chờ thanh toán");
    events.publishEvent(new CheckinVerifiedEvent(customerRecord.getEmail(), customerRecord.getName(),
        reservation.getId(), facility.getName(), unit.getCode(), now));
    return reservation;
  }

  @Transactional
  public Reservation acceptTerms(String id, Map<String, Object> input) {
    var customer = actor.require("CUSTOMER");
    Reservation reservation = reservations.lockById(id).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, reservation.getUserId(), reservation.getFacilityCode())) throw Inputs.missing();
    if (reservation.getIdentityVerifiedAt() == null) throw Inputs.conflict("Nhân viên chưa xác nhận khách đến check-in");
    if (!Boolean.TRUE.equals(input.get("accepted"))) throw Inputs.bad("Cần xác nhận điều khoản hợp đồng");
    String acceptedVersion = Inputs.text(input, "termsVersion");
    String currentTermsVersion = Objects.toString(reservation.getContractTermsVersion(), TERMS_VERSION);
    if (!acceptedVersion.equals(currentTermsVersion)) throw Inputs.conflict("Điều khoản đã thay đổi; vui lòng tải lại hợp đồng và xác nhận lại");
    if (reservation.getContractTermsVersion() == null) reservation.setContractTermsVersion(currentTermsVersion);
    if (reservation.getContractTermsAcceptedAt() != null) return reservation;
    Contract contract = contracts.findByReservationId(id).orElseThrow(Inputs::missing);
    var existingRent = invoiceRepository.findByReservationIdAndInvoiceType(id, "RENT").orElse(null);
    // A retry may arrive after payment already advanced the contract state.
    // Existing RENT invoice is the durable evidence that acceptance already passed.
    if (existingRent != null && ("PENDING".equals(existingRent.getStatus()) || "PAID".equals(existingRent.getStatus()))) {
      reservation.setContractTermsAcceptedAt(LocalDateTime.now(clock));
      reservations.save(reservation);
      if (existingRent.getContractId() == null) {
        existingRent.setContractId(contract.getId());
        invoiceRepository.save(existingRent);
      }
      return reservation;
    }
    if (!"PENDING_PAYMENT".equals(contract.getStatus()) || contract.getPinCode() != null)
      throw Inputs.conflict("Hợp đồng không còn ở trạng thái chờ thanh toán");
    reservation.setContractTermsAcceptedAt(LocalDateTime.now(clock));
    reservations.save(reservation);
    if (existingRent == null) {
      invoices.issue(id, contract.getId(), reservation.getUserId(), reservation.getFacilityCode(), "RENT",
        reservation.getMonthlyPriceSnapshot(), LocalDateTime.now(clock).plusMinutes(15), reservation.getContractTermsSnapshot());
    } else if (!"PAID".equals(existingRent.getStatus())) {
      existingRent.setContractId(contract.getId()); existingRent.setAmount(reservation.getMonthlyPriceSnapshot());
      existingRent.setPriceSnapshot(reservation.getContractTermsSnapshot());
      existingRent.setDueAt(LocalDateTime.now(clock).plusMinutes(15)); existingRent.setStatus("PENDING");
      invoiceRepository.save(existingRent);
    }
    return reservation;
  }

  public Map<String, Object> offer(String id) {
    var customer = actor.require("CUSTOMER");
    Reservation reservation = reservations.findById(id).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, reservation.getUserId(), reservation.getFacilityCode())) throw Inputs.missing();
    if (reservation.getIdentityVerifiedAt() == null) throw Inputs.conflict("Chưa có xác nhận check-in từ Staff");
    var facility = facilities.findById(reservation.getFacilityCode()).orElseThrow(Inputs::missing);
    var unit = units.findById(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    var customerRecord = users.findById(reservation.getUserId()).orElseThrow(Inputs::missing);
    var contract = contracts.findByReservationId(id).orElseThrow(Inputs::missing);
    String termsSnapshot = currentCustomerTermsSnapshot(reservation, facility, unit, customerRecord);
    return Map.of("reservation", reservation, "contract", Map.of("id", contract.getId(), "status", contract.getStatus(), "pinCode", Objects.toString(contract.getPinCode(), "")),
      "customer", Map.of("name", customerRecord.getName(), "cccd", Objects.toString(customerRecord.getCccd(), ""), "phone", Objects.toString(customerRecord.getPhone(), ""), "email", customerRecord.getEmail()),
      "facility", Map.of("code", facility.getCode(), "name", facility.getName(), "address", facility.getAddress(), "city", facility.getCity()),
      "unit", Map.of("code", unit.getCode(), "type", unit.getType(), "size", Objects.toString(unit.getSizeDesc(), ""), "monthlyRent", Objects.toString(reservation.getMonthlyPriceSnapshot(), "0")),
      "policies", policies.get(), "termsVersion", Objects.toString(reservation.getContractTermsVersion(), TERMS_VERSION),
      "termsSnapshot", termsSnapshot, "acceptedAt", Objects.toString(reservation.getContractTermsAcceptedAt(), ""));
  }

  private String currentCustomerTermsSnapshot(Reservation reservation, Facility facility, Unit unit, User customer) {
    String stored = Objects.toString(reservation.getContractTermsSnapshot(), "");
    if (stored.isBlank()) return stored;
    try {
      var parsed = objectMapper.readTree(stored);
      ObjectNode snapshot = parsed != null && parsed.isObject()
          ? (ObjectNode) parsed : objectMapper.createObjectNode();
      String staffName = snapshot.path("authorizedStaffName").asText("Nhân viên cơ sở");
      snapshot.put("customerPhone", Objects.toString(customer.getPhone(), ""));
      snapshot.put("customerEmail", Objects.toString(customer.getEmail(), ""));
      snapshot.set("articles", objectMapper.valueToTree(articles(reservation, facility, unit, customer, staffName)));
      return objectMapper.writeValueAsString(snapshot);
    } catch (Exception ignored) {
      return stored;
    }
  }

  private Map<String, Object> terms(Reservation reservation, com.swp391.selfstorage.modules.facility.entity.Facility facility,
      com.swp391.selfstorage.modules.facility.entity.Unit unit, User customer, String staffName) {
    Map<String, Object> snapshot = new LinkedHashMap<>();
    snapshot.put("version", TERMS_VERSION); snapshot.put("reservationId", reservation.getId());
    snapshot.put("customerName", reservation.getCustomerName()); snapshot.put("customerPhone", reservation.getCustomerPhone());
    snapshot.put("customerEmail", customer.getEmail()); snapshot.put("customerIdentityMasked", maskedIdentity(customer.getCccd()));
    snapshot.put("authorizedStaffName", staffName);
    snapshot.put("facilityCode", facility.getCode()); snapshot.put("facilityName", facility.getName()); snapshot.put("facilityAddress", facility.getAddress());
    snapshot.put("unitCode", unit.getCode()); snapshot.put("unitType", unit.getType()); snapshot.put("unitSize", unit.getSizeDesc());
    snapshot.put("startDate", reservation.getStartDate()); snapshot.put("durationMonths", reservation.getDurationMonths());
    snapshot.put("appointmentAt", reservation.getAppointmentAt());
    snapshot.put("estimatedEndDate", reservation.getRentalStartAt() == null ? null : reservation.getRentalStartAt().plusMonths(reservation.getDurationMonths()).toLocalDate());
    snapshot.put("monthlyRent", reservation.getMonthlyPriceSnapshot()); snapshot.put("deposit", reservation.getDepositAmount());
    snapshot.put("policies", policies.get());
    snapshot.put("articles", articles(reservation, facility, unit, customer, staffName));
    return snapshot;
  }

  private String maskedIdentity(String value) {
    if (value == null || value.isBlank()) return "Chưa cập nhật";
    String normalized = value.replaceAll("\\s", "");
    return "*".repeat(Math.max(0, normalized.length() - 4)) + normalized.substring(Math.max(0, normalized.length() - 4));
  }

  private List<Map<String, Object>> articles(Reservation r,
      com.swp391.selfstorage.modules.facility.entity.Facility facility,
      com.swp391.selfstorage.modules.facility.entity.Unit unit, User customer, String staffName) {
    return List.of(
      Map.of("title", "Điều 1. Thông tin các bên", "items", List.of(
          "Bên cho thuê: " + facility.getName() + "; đại diện tiếp nhận hồ sơ: " + staffName + " (nhân viên được cơ sở phân công).",
          "Bên thuê: " + r.getCustomerName() + "; CCCD: " + maskedIdentity(customer.getCccd()) + "; email: " + customer.getEmail() + "; điện thoại: " + Objects.toString(customer.getPhone(), "") + ".")),
      Map.of("title", "Điều 2. Thông tin kho thuê", "items", List.of(
          "Cơ sở: " + facility.getName() + " (" + facility.getCode() + "), " + facility.getAddress() + ", " + facility.getCity() + ".",
          "Kho: " + unit.getCode() + "; loại " + unit.getType() + "; diện tích " + Objects.toString(unit.getSizeDesc(), "chưa cập nhật") + ".",
          "Chỉ lưu trữ tài sản hợp pháp, an toàn, không thuộc danh mục cấm/nguy hiểm theo nội quy cơ sở.")),
      Map.of("title", "Điều 3. Thời hạn thuê", "items", List.of(
          "Thời hạn: " + r.getDurationMonths() + " tháng; bắt đầu " + r.getStartDate() + "; dự kiến kết thúc " + Objects.toString(r.getRentalStartAt() == null ? null : r.getRentalStartAt().plusMonths(r.getDurationMonths()).toLocalDate(), "theo ngày bàn giao thực tế") + ".",
          "Lịch check-in dự kiến: " + Objects.toString(r.getAppointmentAt(), "theo lịch đã xác nhận") + "; ngày bàn giao thực tế được ghi trong biên bản.",
          "Gia hạn/chấm dứt thực hiện theo xác nhận trên hệ thống và điều kiện thông báo trong chính sách thuê.")),
      Map.of("title", "Điều 4. Giá thuê và thanh toán", "items", List.of(
          "Giá thuê kỳ đầu: " + r.getMonthlyPriceSnapshot() + " VND; chu kỳ tiếp theo theo kỳ hạn ghi trên hóa đơn.",
          "Hóa đơn thuê kỳ đầu cần thanh toán trước bàn giao; ngày đến hạn hiển thị trên hóa đơn.",
          "Phương thức thanh toán khả dụng hiển thị tại bước thanh toán; khoản phí phát sinh phải có hóa đơn riêng.")),
      Map.of("title", "Điều 5. Tiền cọc", "items", List.of(
          "Tiền cọc đã nhận: " + r.getDepositAmount() + " VND.",
          "Tiền cọc bảo đảm nghĩa vụ thuê; khấu trừ chỉ thực hiện theo khoản phải trả/thiệt hại có căn cứ và được đối soát.",
          "Số dư cọc được hoàn theo quy trình kiểm tra kho, đối trừ công nợ và chính sách hoàn tiền hiện hành.")),
      Map.of("title", "Điều 6. Quyền và nghĩa vụ", "items", List.of(
          "Bên thuê sử dụng kho đúng mục đích, tự bảo quản tài sản và tuân thủ nội quy cơ sở.",
          "Không lưu trữ hàng cấm, chất cháy nổ, hàng nguy hiểm hoặc tài sản vi phạm pháp luật.",
          "PIN/mã truy cập phải được giữ bí mật; lượt truy cập và xử lý sự cố được ghi nhận theo quy trình vận hành.")),
      Map.of("title", "Điều 7. Bàn giao và tình trạng kho", "items", List.of(
          "Bàn giao chỉ sau khi Staff xác nhận khách, khách chấp thuận hợp đồng và hóa đơn thuê đã thanh toán.",
          "Staff và khách cùng ghi nhận tình trạng kho, ảnh/chứng cứ nếu có; khách xác nhận biên bản bàn giao.",
          "Ngày bàn giao và người thực hiện được lưu cùng hồ sơ hợp đồng.")),
      Map.of("title", "Điều 8. Chấm dứt và hoàn trả kho", "items", List.of(
          "Khách gửi yêu cầu trả kho trên hệ thống; hợp đồng/PIN còn hiệu lực đến khi Staff hoàn tất kiểm tra.",
          "Thiệt hại, mất mát hoặc phí phát sinh phải có ghi nhận/bằng chứng và được đối soát theo chính sách.",
          "Tiền cọc còn lại được hoàn sau khi hoàn tất kiểm tra kho và thanh toán các nghĩa vụ hợp lệ.")),
      Map.of("title", "Điều 9. Vi phạm và giải quyết tranh chấp", "items", List.of(
          "Các bên thông báo và phối hợp xử lý vi phạm, khiếu nại qua kênh hỗ trợ của cơ sở.",
          "Sửa đổi điều khoản cần được lưu nhận trên hệ thống; phiên bản được khách xác nhận gắn với hợp đồng.",
          "Hồ sơ hợp đồng, hóa đơn và biên bản được lưu trong tài khoản khách hàng."))
    );
  }
}
