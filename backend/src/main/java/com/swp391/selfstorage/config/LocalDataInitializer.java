package com.swp391.selfstorage.config;

import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.math.*;
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

  public LocalDataInitializer(
    FacilityRepository f,
    UnitRepository u,
    UserRepository us,
    PasswordEncoder p
  ) {
    facilities = f;
    units = u;
    users = us;
    passwords = p;
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
        u.setStatus("available");
        u.setPinCode(null);
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
  }
}
