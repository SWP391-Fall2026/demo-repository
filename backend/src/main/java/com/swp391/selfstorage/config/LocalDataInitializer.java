package com.swp391.selfstorage.config;

import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
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

  public LocalDataInitializer(
    FacilityRepository f,
    UnitRepository u,
    UserRepository us,
    PasswordEncoder p
  ) {
    this(f, u, us, p, null, null, null);
  }

  @Autowired
  public LocalDataInitializer(
    FacilityRepository f,
    UnitRepository u,
    UserRepository us,
    PasswordEncoder p,
    ContractRepository c,
    SupportTicketRepository t,
    DailyTaskRepository dt
  ) {
    this.facilities = f;
    this.units = u;
    this.users = us;
    this.passwords = p;
    this.contracts = c;
    this.tickets = t;
    this.tasks = dt;
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
        u.setStatus(i == 0 && n == 1 ? "OCCUPIED" : "available");
        u.setPinCode(i == 0 && n == 1 ? "123456" : null);
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

    // Seed 1 active contract for LOCAL-customer so Support Tickets and Rentals can be tested immediately
    if (contracts != null) {
      Contract contract = new Contract();
      contract.setId("CTR-HN-CG-1001");
      contract.setUserId("LOCAL-customer");
      contract.setCustomerName("Khách hàng demo");
      contract.setCustomerPhone("0901234567");
      contract.setUnitCode("HN-CG-001");
      contract.setFacilityCode("HN-CG");
      contract.setStartDate(LocalDate.now().minusDays(10));
      contract.setEndDate(LocalDate.now().plusMonths(3));
      contract.setDurationMonths(3);
      contract.setMonthlyFee(BigDecimal.valueOf(800000));
      contract.setDepositFee(BigDecimal.valueOf(800000));
      contract.setPinCode("123456");
      contract.setStatus("ACTIVE");
      contract.setCreatedAt(LocalDateTime.now().minusDays(10));
      contracts.save(contract);
    }

    // Seed 1 demo support ticket
    if (tickets != null) {
      SupportTicket ticket = new SupportTicket();
      ticket.setId("TCK-DEMO-001");
      ticket.setUserId("LOCAL-customer");
      ticket.setCustomerName("Khách hàng demo");
      ticket.setFacilityCode("HN-CG");
      ticket.setUnitCode("HN-CG-001");
      ticket.setCategory("ACCESS");
      ticket.setTitle("Yêu cầu kiểm tra bàn phím mã PIN khoang HN-CG-001");
      ticket.setDescription("Bàn phím điện tử bấm phím số 6 hơi chập chờn, nhờ nhân viên kiểm tra lại pin hoặc vệ sinh cảm biến.");
      ticket.setPriority("NORMAL");
      ticket.setStatus("OPEN");
      ticket.setCreatedAt(LocalDateTime.now().minusHours(2));
      tickets.save(ticket);
    }

    // Seed 1 demo daily task for staff
    if (tasks != null) {
      DailyTask task = new DailyTask();
      task.setId("TSK-DEMO-001");
      task.setTitle("Kiểm tra thiết bị khóa điện tử buồng kho HN-CG-001");
      task.setStaff("Nhân viên Cầu Giấy");
      task.setStaffId("LOCAL-staff");
      task.setFacilityCode("HN-CG");
      task.setUnitCode("HN-CG-001");
      task.setCustomerName("Khách hàng demo");
      task.setCustomerPhone("0901234567");
      task.setDeadline("Hôm nay 17:00");
      task.setTaskType("SUPPORT");
      task.setStatus("PENDING");
      task.setCreatedAt(LocalDateTime.now().minusHours(1));
      tasks.save(task);
    }
  }
}
