package com.swp391.selfstorage.config;

import com.swp391.selfstorage.modules.audit.entity.AuditLog;
import com.swp391.selfstorage.modules.audit.repository.AuditLogRepository;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.entity.Payment;
import com.swp391.selfstorage.modules.billing.entity.RefundRequest;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import com.swp391.selfstorage.modules.billing.repository.RefundRequestRepository;
import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.entity.CustomerAccessLog;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.CustomerAccessLogRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import com.swp391.selfstorage.modules.support.repository.SupportTicketRepository;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import java.math.*;
import java.time.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class LocalDataInitializer implements CommandLineRunner {

  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final ContractRepository contracts;
  private final SupportTicketRepository tickets;
  private final DailyTaskRepository tasks;
  private final ReservationRepository reservations;
  private final InvoiceRepository invoices;
  private final PaymentRepository payments;
  private final RefundRequestRepository refundRequests;
  private final AuditLogRepository auditLogs;
  private final CustomerAccessLogRepository accessLogs;

  public LocalDataInitializer(
    FacilityRepository f,
    UnitRepository u,
    UserRepository us,
    PasswordEncoder p
  ) {
    this(f, u, us, p, null, null, null, null, null, null, null, null, null);
  }

  @Autowired
  public LocalDataInitializer(
    FacilityRepository f,
    UnitRepository u,
    UserRepository us,
    PasswordEncoder p,
    ContractRepository c,
    SupportTicketRepository t,
    DailyTaskRepository dt,
    ReservationRepository rsv,
    InvoiceRepository inv,
    PaymentRepository pay,
    RefundRequestRepository ref,
    AuditLogRepository audit,
    CustomerAccessLogRepository accessLogs
  ) {
    this.facilities = f;
    this.units = u;
    this.users = us;
    this.passwords = p;
    this.contracts = c;
    this.tickets = t;
    this.tasks = dt;
    this.reservations = rsv;
    this.invoices = inv;
    this.payments = pay;
    this.refundRequests = ref;
    this.auditLogs = audit;
    this.accessLogs = accessLogs;
  }

  public void run(String... args) {
    if (facilities.count() > 0) return;
    String[] codes = { "HN-CG", "HCM-Q7", "HCM-TB" };
    String[] names = { "Cơ sở Cầu Giấy", "Cơ sở Quận 7", "Cơ sở Tân Bình" };
    for (int i = 0; i < codes.length; i++) {
      Facility f = new Facility();
      f.setCode(codes[i]);
      f.setName(names[i]);
      f.setAddress(i == 0 ? "Duy Tân, Cầu Giấy" : "Khu lưu trữ " + names[i]);
      f.setCity(i == 0 ? "Hà Nội" : "TP. Hồ Chí Minh");
      f.setStatus("ACTIVE");
      f.setCheckinPinHash(passwords.encode(switch (codes[i]) {
        case "HN-CG" -> "246810";
        case "HCM-Q7" -> "357924";
        default -> "468135";
      }));
      facilities.save(f);
      for (int n = 1; n <= 8; n++) {
        Unit u = new Unit();
        u.setCode(codes[i] + "-" + String.format("%03d", n));
        u.setFacilityCode(codes[i]);
        String type = n < 3 ? "S" : n < 7 ? "M" : "L";
        u.setType(type);
        u.setSizeSqm(
          BigDecimal.valueOf(type.equals("S") ? 2 : type.equals("M") ? 5 : 10)
        );
        u.setSizeDesc(u.getSizeSqm() + " m²");
        u.setPricePerMonth(
          BigDecimal.valueOf(
            type.equals("S") ? 800000 : type.equals("M") ? 1450000 : 2800000
          )
        );
        boolean occupied = (i == 0 && n == 1) || (i == 1 && n == 1);
        u.setStatus(occupied ? "OCCUPIED" : "available");
        u.setPinCode(i == 0 && n == 1 ? "123456" : (i == 1 && n == 1 ? "654321" : null));
        units.save(u);
      }
    }

    String[][] accounts = {
      { "customer", "Khách hàng demo", "CUSTOMER", "" },
      { "customer2", "Khách hàng thứ hai", "CUSTOMER", "" },
      { "staff", "Nhân viên Cầu Giấy", "STAFF", "HN-CG" },
      { "manager", "Quản lý Cầu Giấy", "FMANAGER", "HN-CG" },
      { "staff_q7", "Nhân viên Quận 7", "STAFF", "HCM-Q7" },
      { "manager_q7", "Quản lý Quận 7", "FMANAGER", "HCM-Q7" },
      { "staff_tb", "Nhân viên Tân Bình", "STAFF", "HCM-TB" },
      { "manager_tb", "Quản lý Tân Bình", "FMANAGER", "HCM-TB" },
      { "business", "Vận hành toàn chuỗi", "OPS_MGR", "" },
      { "admin", "Quản trị hệ thống", "ADMIN", "" },
    };
    for (var a : accounts) {
      User u = new User();
      u.setId("LOCAL-" + a[0]);
      u.setUsername(a[0]);
      u.setName(a[1]);
      u.setRole(a[2]);
      u.setRoleTitle(a[2]);
      u.setFacilityCode(a[3].isEmpty() ? null : a[3]);
      u.setEmail(a[0] + "@storage.local");
      u.setPassword(passwords.encode("Demo123!"));
      u.setStatus("ACTIVE");
      users.save(u);
    }

    // Seed Active Contracts
    if (contracts != null) {
      Contract contract1 = new Contract();
      contract1.setId("CTR-HN-CG-1001");
      contract1.setReservationId("RSV-DEMO-1001");
      contract1.setUserId("LOCAL-customer");
      contract1.setCustomerName("Khách hàng demo");
      contract1.setCustomerPhone("0901234567");
      contract1.setUnitCode("HN-CG-001");
      contract1.setFacilityCode("HN-CG");
      contract1.setStartDate(LocalDate.now().minusDays(10));
      contract1.setEndDate(LocalDate.now().plusMonths(3).minusDays(10));
      contract1.setDurationMonths(3);
      contract1.setMonthlyFee(BigDecimal.valueOf(800000));
      contract1.setDepositFee(BigDecimal.valueOf(800000));
      contract1.setPinCode("123456");
      contract1.setStatus("ACTIVE");
      contract1.setCreatedAt(LocalDateTime.now().minusDays(10));
      contracts.save(contract1);

      Contract contract2 = new Contract();
      contract2.setId("CTR-HCM-Q7-2001");
      contract2.setReservationId("RSV-DEMO-2001");
      contract2.setUserId("LOCAL-customer2");
      contract2.setCustomerName("Khách hàng thứ hai");
      contract2.setCustomerPhone("0908889999");
      contract2.setUnitCode("HCM-Q7-001");
      contract2.setFacilityCode("HCM-Q7");
      contract2.setStartDate(LocalDate.now().minusDays(5));
      contract2.setEndDate(LocalDate.now().plusMonths(1).minusDays(5));
      contract2.setDurationMonths(1);
      contract2.setMonthlyFee(BigDecimal.valueOf(800000));
      contract2.setDepositFee(BigDecimal.valueOf(800000));
      contract2.setPinCode("654321");
      contract2.setStatus("ACTIVE");
      contract2.setCreatedAt(LocalDateTime.now().minusDays(5));
      contracts.save(contract2);
    }

    // Seed Reservations
    if (reservations != null) {
      Reservation r1 = new Reservation();
      r1.setId("RSV-DEMO-1001");
      r1.setUserId("LOCAL-customer");
      r1.setCustomerName("Khách hàng demo");
      r1.setCustomerPhone("0901234567");
      r1.setFacilityCode("HN-CG");
      r1.setUnitType("S");
      r1.setUnitCode("HN-CG-001");
      r1.setDurationMonths(3);
      r1.setStartDate(LocalDate.now().minusDays(10));
      r1.setDepositAmount(BigDecimal.valueOf(800000));
      r1.setStatus("CHECKED_IN");
      r1.setCreatedAt(LocalDateTime.now().minusDays(10));
      reservations.save(r1);

      Reservation r2 = new Reservation();
      r2.setId("RSV-DEMO-2001");
      r2.setUserId("LOCAL-customer2");
      r2.setCustomerName("Khách hàng thứ hai");
      r2.setCustomerPhone("0908889999");
      r2.setFacilityCode("HCM-Q7");
      r2.setUnitType("S");
      r2.setUnitCode("HCM-Q7-001");
      r2.setDurationMonths(1);
      r2.setStartDate(LocalDate.now().minusDays(5));
      r2.setDepositAmount(BigDecimal.valueOf(800000));
      r2.setStatus("CHECKED_IN");
      r2.setCreatedAt(LocalDateTime.now().minusDays(5));
      reservations.save(r2);

      Reservation r3 = new Reservation();
      r3.setId("RSV-DEMO-1002");
      r3.setUserId("LOCAL-customer");
      r3.setCustomerName("Khách hàng demo");
      r3.setCustomerPhone("0901234567");
      r3.setFacilityCode("HN-CG");
      r3.setUnitType("M");
      r3.setUnitCode("HN-CG-003");
      r3.setDurationMonths(1);
      r3.setStartDate(LocalDate.now().plusDays(2));
      r3.setDepositAmount(BigDecimal.valueOf(1450000));
      r3.setStatus("RESERVED");
      r3.setCreatedAt(LocalDateTime.now().minusHours(2));
      reservations.save(r3);
    }

    // Seed Invoices
    if (invoices != null) {
      Invoice inv1 = new Invoice();
      inv1.setId("INV-DEMO-1001");
      inv1.setReservationId("RSV-DEMO-1001");
      inv1.setContractId("CTR-HN-CG-1001");
      inv1.setUserId("LOCAL-customer");
      inv1.setFacilityCode("HN-CG");
      inv1.setInvoiceType("DEPOSIT");
      inv1.setAmount(BigDecimal.valueOf(800000));
      inv1.setStatus("PAID");
      inv1.setIssuedAt(LocalDateTime.now().minusDays(10));
      inv1.setDueAt(LocalDateTime.now().minusDays(10).plusMinutes(5));
      inv1.setDescription("Tiền đặt cọc giữ chỗ khoang HN-CG-001 (Loại S)");
      invoices.save(inv1);

      Invoice inv2 = new Invoice();
      inv2.setId("INV-DEMO-1002");
      inv2.setReservationId("RSV-DEMO-1001");
      inv2.setContractId("CTR-HN-CG-1001");
      inv2.setUserId("LOCAL-customer");
      inv2.setFacilityCode("HN-CG");
      inv2.setInvoiceType("RENT");
      inv2.setAmount(BigDecimal.valueOf(2400000));
      inv2.setStatus("PAID");
      inv2.setIssuedAt(LocalDateTime.now().minusDays(10));
      inv2.setDueAt(LocalDateTime.now().minusDays(9));
      inv2.setDescription("Tiền thuê khoang HN-CG-001 kỳ 1 (3 tháng)");
      invoices.save(inv2);

      Invoice inv3 = new Invoice();
      inv3.setId("INV-DEMO-1003");
      inv3.setReservationId("RSV-DEMO-1002");
      inv3.setUserId("LOCAL-customer");
      inv3.setFacilityCode("HN-CG");
      inv3.setInvoiceType("DEPOSIT");
      inv3.setAmount(BigDecimal.valueOf(1450000));
      inv3.setStatus("PAID");
      inv3.setIssuedAt(LocalDateTime.now().minusHours(2));
      inv3.setDueAt(LocalDateTime.now().minusHours(2).plusMinutes(5));
      inv3.setDescription("Tiền đặt cọc giữ chỗ khoang HN-CG-003 (Loại M)");
      invoices.save(inv3);

      Invoice inv4 = new Invoice();
      inv4.setId("INV-DEMO-2001");
      inv4.setReservationId("RSV-DEMO-2001");
      inv4.setContractId("CTR-HCM-Q7-2001");
      inv4.setUserId("LOCAL-customer2");
      inv4.setFacilityCode("HCM-Q7");
      inv4.setInvoiceType("DEPOSIT");
      inv4.setAmount(BigDecimal.valueOf(800000));
      inv4.setStatus("PAID");
      inv4.setIssuedAt(LocalDateTime.now().minusDays(5));
      inv4.setDueAt(LocalDateTime.now().minusDays(5).plusMinutes(5));
      inv4.setDescription("Tiền đặt cọc giữ chỗ khoang HCM-Q7-001 (Loại S)");
      invoices.save(inv4);
    }

    // Seed Payments
    if (payments != null) {
      Payment p1 = new Payment();
      p1.setId("PAY-DEMO-1001");
      p1.setInvoiceId("INV-DEMO-1001");
      p1.setReservationId("RSV-DEMO-1001");
      p1.setContractId("CTR-HN-CG-1001");
      p1.setUserId("LOCAL-customer");
      p1.setCustomerName("Khách hàng demo");
      p1.setFacilityCode("HN-CG");
      p1.setInvoiceType("DEPOSIT");
      p1.setAmount(BigDecimal.valueOf(800000));
      p1.setPaymentMethod("VietQR Napas247");
      p1.setTransactionCode("TXN-DEMO-1001");
      p1.setStatus("PAID");
      p1.setTimeStr(LocalDateTime.now().minusDays(10).toString());
      p1.setCreatedAt(LocalDateTime.now().minusDays(10));
      p1.setPaidAt(p1.getCreatedAt());
      payments.save(p1);

      Payment p2 = new Payment();
      p2.setId("PAY-DEMO-1002");
      p2.setInvoiceId("INV-DEMO-1002");
      p2.setReservationId("RSV-DEMO-1001");
      p2.setContractId("CTR-HN-CG-1001");
      p2.setUserId("LOCAL-customer");
      p2.setCustomerName("Khách hàng demo");
      p2.setFacilityCode("HN-CG");
      p2.setInvoiceType("RENT");
      p2.setAmount(BigDecimal.valueOf(2400000));
      p2.setPaymentMethod("VietQR Napas247");
      p2.setTransactionCode("TXN-DEMO-1002");
      p2.setStatus("PAID");
      p2.setTimeStr(LocalDateTime.now().minusDays(10).toString());
      p2.setCreatedAt(LocalDateTime.now().minusDays(10));
      p2.setPaidAt(p2.getCreatedAt());
      payments.save(p2);

      Payment p3 = new Payment();
      p3.setId("PAY-DEMO-1003");
      p3.setInvoiceId("INV-DEMO-1003");
      p3.setReservationId("RSV-DEMO-1002");
      p3.setUserId("LOCAL-customer");
      p3.setCustomerName("Khách hàng demo");
      p3.setFacilityCode("HN-CG");
      p3.setInvoiceType("DEPOSIT");
      p3.setAmount(BigDecimal.valueOf(1450000));
      p3.setPaymentMethod("VietQR Napas247");
      p3.setTransactionCode("TXN-DEMO-1003");
      p3.setStatus("PAID");
      p3.setTimeStr(LocalDateTime.now().minusHours(2).toString());
      p3.setCreatedAt(LocalDateTime.now().minusHours(2));
      p3.setPaidAt(p3.getCreatedAt());
      payments.save(p3);

      Payment p4 = new Payment();
      p4.setId("PAY-DEMO-2001");
      p4.setInvoiceId("INV-DEMO-2001");
      p4.setReservationId("RSV-DEMO-2001");
      p4.setContractId("CTR-HCM-Q7-2001");
      p4.setUserId("LOCAL-customer2");
      p4.setCustomerName("Khách hàng thứ hai");
      p4.setFacilityCode("HCM-Q7");
      p4.setInvoiceType("DEPOSIT");
      p4.setAmount(BigDecimal.valueOf(800000));
      p4.setPaymentMethod("VietQR Napas247");
      p4.setTransactionCode("TXN-DEMO-2001");
      p4.setStatus("PAID");
      p4.setTimeStr(LocalDateTime.now().minusDays(5).toString());
      p4.setCreatedAt(LocalDateTime.now().minusDays(5));
      p4.setPaidAt(p4.getCreatedAt());
      payments.save(p4);
    }

    // Seed Refund Requests
    if (refundRequests != null) {
      RefundRequest ref1 = new RefundRequest();
      ref1.setId("REF-DEMO-001");
      ref1.setPaymentId("PAY-DEMO-1001");
      ref1.setReservationId("RSV-DEMO-1001");
      ref1.setContractId("CTR-HN-CG-1001");
      ref1.setUserId("LOCAL-customer");
      ref1.setRequestedBy("LOCAL-customer");
      ref1.setFacilityCode("HN-CG");
      ref1.setRefundType("DEPOSIT_REFUND");
      ref1.setRequestedAmount(BigDecimal.valueOf(800000));
      ref1.setReason("Khách hàng yêu cầu hoàn trả tiền cọc theo thỏa thuận");
      ref1.setStatus("PENDING");
      ref1.setCreatedAt(LocalDateTime.now().minusDays(1));
      refundRequests.save(ref1);

      RefundRequest ref2 = new RefundRequest();
      ref2.setId("REF-DEMO-002");
      ref2.setPaymentId("PAY-DEMO-2001");
      ref2.setReservationId("RSV-DEMO-2001");
      ref2.setContractId("CTR-HCM-Q7-2001");
      ref2.setUserId("LOCAL-customer2");
      ref2.setRequestedBy("LOCAL-customer2");
      ref2.setFacilityCode("HCM-Q7");
      ref2.setRefundType("DEPOSIT_REFUND");
      ref2.setRequestedAmount(BigDecimal.valueOf(800000));
      ref2.setApprovedAmount(BigDecimal.valueOf(800000));
      ref2.setApprovedBy("LOCAL-manager_q7");
      ref2.setDecisionReason("Đồng ý hoàn tiền cọc sau khi kiểm tra biên bản bàn giao và hiện trạng");
      ref2.setReason("Hủy hợp đồng do chuyển công tác");
      ref2.setStatus("APPROVED");
      ref2.setCreatedAt(LocalDateTime.now().minusDays(2));
      refundRequests.save(ref2);
    }

    // Seed Support Tickets
    if (tickets != null) {
      SupportTicket ticket1 = new SupportTicket();
      ticket1.setId("TCK-DEMO-001");
      ticket1.setUserId("LOCAL-customer");
      ticket1.setCustomerName("Khách hàng demo");
      ticket1.setFacilityCode("HN-CG");
      ticket1.setUnitCode("HN-CG-001");
      ticket1.setCategory("ACCESS");
      ticket1.setTitle("Yêu cầu kiểm tra bàn phím mã PIN khoang HN-CG-001");
      ticket1.setDescription("Bàn phím điện tử bấm phím số 6 hơi chập chờn, nhờ nhân viên kiểm tra lại pin hoặc vệ sinh cảm biến.");
      ticket1.setPriority("NORMAL");
      ticket1.setStatus("OPEN");
      ticket1.setCreatedAt(LocalDateTime.now().minusHours(2));
      tickets.save(ticket1);

      SupportTicket ticket2 = new SupportTicket();
      ticket2.setId("TCK-DEMO-002");
      ticket2.setUserId("LOCAL-customer2");
      ticket2.setCustomerName("Khách hàng thứ hai");
      ticket2.setFacilityCode("HCM-Q7");
      ticket2.setUnitCode("HCM-Q7-001");
      ticket2.setCategory("BILLING");
      ticket2.setTitle("Yêu cầu xuất hóa đơn điện tử cho kỳ thuê Q3");
      ticket2.setDescription("Nhờ bộ phận kế toán hỗ trợ xuất hóa đơn VAT điện tử gửi về email doanh nghiệp.");
      ticket2.setPriority("NORMAL");
      ticket2.setStatus("IN_PROGRESS");
      ticket2.setCreatedAt(LocalDateTime.now().minusHours(5));
      tickets.save(ticket2);

      SupportTicket ticket3 = new SupportTicket();
      ticket3.setId("TCK-DEMO-003");
      ticket3.setUserId("LOCAL-customer");
      ticket3.setCustomerName("Khách hàng demo");
      ticket3.setFacilityCode("HN-CG");
      ticket3.setUnitCode("HN-CG-001");
      ticket3.setCategory("FACILITY");
      ticket3.setTitle("Đề nghị kiểm tra nhiệt độ kho mát");
      ticket3.setDescription("Khu vực kho mát nhiệt độ hơi cao hơn 25 độ C, đề nghị kỹ thuật kiểm tra hệ thống điều hòa.");
      ticket3.setPriority("LOW");
      ticket3.setStatus("RESOLVED");
      ticket3.setCreatedAt(LocalDateTime.now().minusDays(2));
      tickets.save(ticket3);
    }

    // Seed Daily Tasks
    if (tasks != null) {
      DailyTask task1 = new DailyTask();
      task1.setId("TSK-DEMO-001");
      task1.setTitle("Kiểm tra thiết bị khóa điện tử buồng kho HN-CG-001");
      task1.setStaff("Nhân viên Cầu Giấy");
      task1.setStaffId("LOCAL-staff");
      task1.setFacilityCode("HN-CG");
      task1.setUnitCode("HN-CG-001");
      task1.setCustomerName("Khách hàng demo");
      task1.setCustomerPhone("0901234567");
      task1.setDeadline("Hôm nay 17:00");
      task1.setTaskType("SUPPORT");
      task1.setStatus("PENDING");
      task1.setCreatedAt(LocalDateTime.now().minusHours(1));
      tasks.save(task1);

      DailyTask task2 = new DailyTask();
      task2.setId("TSK-DEMO-002");
      task2.setTitle("Đón tiếp khách hàng làm thủ tục nhận kho buồng HCM-Q7-001");
      task2.setStaff("Nhân viên Quận 7");
      task2.setStaffId("LOCAL-staff_q7");
      task2.setFacilityCode("HCM-Q7");
      task2.setUnitCode("HCM-Q7-001");
      task2.setCustomerName("Khách hàng thứ hai");
      task2.setCustomerPhone("0908889999");
      task2.setDeadline("Hôm nay 15:30");
      task2.setTaskType("CHECKIN");
      task2.setStatus("IN_PROGRESS");
      task2.setCreatedAt(LocalDateTime.now().minusHours(3));
      tasks.save(task2);

      DailyTask task3 = new DailyTask();
      task3.setId("TSK-DEMO-003");
      task3.setTitle("Vệ sinh và kiểm tra buồng kho tiêu chuẩn HN-CG-005");
      task3.setStaff("Nhân viên Cầu Giấy");
      task3.setStaffId("LOCAL-staff");
      task3.setFacilityCode("HN-CG");
      task3.setUnitCode("HN-CG-005");
      task3.setCustomerName(null);
      task3.setCustomerPhone(null);
      task3.setDeadline("Hôm nay 11:00");
      task3.setTaskType("CLEANING");
      task3.setStatus("COMPLETED");
      task3.setCreatedAt(LocalDateTime.now().minusHours(6));
      tasks.save(task3);
    }

    // Seed Audit Logs
    if (auditLogs != null) {
      AuditLog l1 = new AuditLog(
        LocalDateTime.now().minusDays(10).toString(),
        "Quản trị hệ thống",
        "ADMIN",
        "INITIALIZE_SYSTEM",
        "Khởi tạo hệ thống dữ liệu vận hành cục bộ",
        "127.0.0.1",
        "SUCCESS"
      );
      auditLogs.save(l1);

      AuditLog l2 = new AuditLog(
        LocalDateTime.now().minusDays(5).toString(),
        "Quản trị hệ thống",
        "ADMIN",
        "ALLOCATE_STAFF",
        "Điều phối phân công cơ sở chi nhánh HN-CG và HCM-Q7",
        "127.0.0.1",
        "SUCCESS"
      );
      auditLogs.save(l2);

      AuditLog l3 = new AuditLog(
        LocalDateTime.now().minusDays(2).toString(),
        "Vận hành toàn chuỗi",
        "OPS_MGR",
        "UPDATE_PRICE_POLICY",
        "Điều chỉnh biểu giá chuẩn buồng kho quy cách M và L",
        "127.0.0.1",
        "SUCCESS"
      );
      auditLogs.save(l3);

      AuditLog l4 = new AuditLog(
        LocalDateTime.now().minusHours(3).toString(),
        "Quản lý Cầu Giấy",
        "FMANAGER",
        "GENERATE_CHECKIN_PIN",
        "Sinh mã PIN check-in ca trực cơ sở HN-CG",
        "127.0.0.1",
        "SUCCESS"
      );
      auditLogs.save(l4);
    }

    // Seed Customer Access Logs
    if (accessLogs != null) {
      CustomerAccessLog a1 = new CustomerAccessLog();
      a1.setId("ACC-HN-1001");
      a1.setContractId("CTR-HN-CG-1001");
      a1.setUnitCode("HN-CG-001");
      a1.setFacilityCode("HN-CG");
      a1.setUserId("LOCAL-customer");
      a1.setCustomerName("Khách hàng demo");
      a1.setCustomerPhone("0901234567");
      a1.setAccessType("ENTRY");
      a1.setAccessMethod("PIN_CODE");
      a1.setStatus("GRANTED");
      a1.setCheckinAt(LocalDateTime.now().minusDays(5).withHour(9).withMinute(15));
      a1.setCheckoutAt(LocalDateTime.now().minusDays(5).withHour(9).withMinute(45));
      a1.setDurationMinutes(30);
      a1.setNotes("Cất đồ gia dụng sau khi nhận bàn giao buồng kho");
      a1.setCreatedAt(a1.getCheckinAt());
      accessLogs.save(a1);

      CustomerAccessLog a2 = new CustomerAccessLog();
      a2.setId("ACC-HN-1002");
      a2.setContractId("CTR-HN-CG-1001");
      a2.setUnitCode("HN-CG-001");
      a2.setFacilityCode("HN-CG");
      a2.setUserId("LOCAL-customer");
      a2.setCustomerName("Khách hàng demo");
      a2.setCustomerPhone("0901234567");
      a2.setAccessType("ENTRY");
      a2.setAccessMethod("PIN_CODE");
      a2.setStatus("GRANTED");
      a2.setCheckinAt(LocalDateTime.now().minusDays(2).withHour(14).withMinute(10));
      a2.setCheckoutAt(LocalDateTime.now().minusDays(2).withHour(14).withMinute(35));
      a2.setDurationMinutes(25);
      a2.setNotes("Lấy tài liệu và hồ sơ cá nhân");
      a2.setCreatedAt(a2.getCheckinAt());
      accessLogs.save(a2);

      CustomerAccessLog a3 = new CustomerAccessLog();
      a3.setId("ACC-HN-1003");
      a3.setContractId("CTR-HN-CG-1001");
      a3.setUnitCode("HN-CG-001");
      a3.setFacilityCode("HN-CG");
      a3.setUserId("LOCAL-customer");
      a3.setCustomerName("Khách hàng demo");
      a3.setCustomerPhone("0901234567");
      a3.setAccessType("ENTRY");
      a3.setAccessMethod("PIN_CODE");
      a3.setStatus("GRANTED");
      a3.setCheckinAt(LocalDateTime.now().minusMinutes(35));
      a3.setCheckoutAt(null); // Currently inside unit
      a3.setNotes("Đang kiểm tra và cất thêm thiết bị điện tử");
      a3.setCreatedAt(a3.getCheckinAt());
      accessLogs.save(a3);

      CustomerAccessLog a4 = new CustomerAccessLog();
      a4.setId("ACC-HCM-2001");
      a4.setContractId("CTR-HCM-Q7-2001");
      a4.setUnitCode("HCM-Q7-001");
      a4.setFacilityCode("HCM-Q7");
      a4.setUserId("LOCAL-customer2");
      a4.setCustomerName("Khách hàng thứ hai");
      a4.setCustomerPhone("0908889999");
      a4.setAccessType("ENTRY");
      a4.setAccessMethod("QR_SCAN");
      a4.setStatus("GRANTED");
      a4.setCheckinAt(LocalDateTime.now().minusDays(1).withHour(16).withMinute(0));
      a4.setCheckoutAt(LocalDateTime.now().minusDays(1).withHour(16).withMinute(40));
      a4.setDurationMinutes(40);
      a4.setNotes("Nhập thêm hàng mẫu kinh doanh");
      a4.setCreatedAt(a4.getCheckinAt());
      accessLogs.save(a4);

      // Pending Check-in Request waiting for Manager approval & PIN generation
      CustomerAccessLog req1 = new CustomerAccessLog();
      req1.setId("REQ-HN-9001");
      req1.setContractId("CTR-HN-CG-1001");
      req1.setUnitCode("HN-CG-001");
      req1.setFacilityCode("HN-CG");
      req1.setUserId("LOCAL-customer");
      req1.setCustomerName("Khách hàng demo");
      req1.setCustomerPhone("0901234567");
      req1.setAccessType("ENTRY");
      req1.setAccessMethod("PIN_CODE");
      req1.setPurpose("Cất tài liệu và hợp đồng lưu trữ quý 4");
      req1.setStatus("PENDING_APPROVAL");
      req1.setExpectedAt(LocalDateTime.now().plusHours(1));
      req1.setNotes("Khách hẹn vào kho chiều nay");
      req1.setCreatedAt(LocalDateTime.now().minusMinutes(20));
      accessLogs.save(req1);

      // Approved Check-in Request with 6-digit PIN ready for customer check-in
      CustomerAccessLog req2 = new CustomerAccessLog();
      req2.setId("REQ-HN-9002");
      req2.setContractId("CTR-HN-CG-1001");
      req2.setUnitCode("HN-CG-001");
      req2.setFacilityCode("HN-CG");
      req2.setUserId("LOCAL-customer");
      req2.setCustomerName("Khách hàng demo");
      req2.setCustomerPhone("0901234567");
      req2.setAccessType("ENTRY");
      req2.setAccessMethod("PIN_CODE");
      req2.setPurpose("Lấy kiện hàng mẫu");
      req2.setAccessPin("889900");
      req2.setStatus("PIN_ISSUED");
      req2.setApprovedBy("manager");
      req2.setApprovedAt(LocalDateTime.now().minusMinutes(10));
      req2.setExpectedAt(LocalDateTime.now().plusMinutes(30));
      req2.setNotes("Quản lý đã duyệt cấp mã PIN 889900");
      req2.setCreatedAt(LocalDateTime.now().minusMinutes(30));
      accessLogs.save(req2);
    }
  }
}
