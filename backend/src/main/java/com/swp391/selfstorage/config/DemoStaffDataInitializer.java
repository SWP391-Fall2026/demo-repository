package com.swp391.selfstorage.config;

import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo-seed")
public class DemoStaffDataInitializer implements CommandLineRunner {
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final String password;

  public DemoStaffDataInitializer(FacilityRepository facilities, UnitRepository units, UserRepository users,
      PasswordEncoder encoder, @Value("${DEMO_SEED_PASSWORD:}") String password) {
    this.facilities = facilities; this.units = units; this.users = users; this.encoder = encoder; this.password = password;
  }

  @Override @Transactional
  public void run(String... args) {
    if (password.isBlank() || password.length() < 12) throw new IllegalStateException("DEMO_SEED_PASSWORD must be set and at least 12 characters");
    Facility facility = facilities.findById("HN-CG").orElseGet(() -> {
      Facility f = new Facility(); f.setCode("HN-CG"); f.setName("Cơ sở Cầu Giấy"); f.setAddress("Duy Tân, Cầu Giấy"); f.setCity("Hà Nội"); f.setStatus("ACTIVE"); return facilities.save(f);
    });
    if (facility.getCheckinPinHash() == null) { facility.setCheckinPinHash(encoder.encode("246810")); facilities.save(facility); }
    if (units.findById("HN-CG-001").isEmpty()) {
      Unit unit = new Unit(); unit.setCode("HN-CG-001"); unit.setFacilityCode(facility.getCode()); unit.setType("M"); unit.setSizeSqm(new BigDecimal("5")); unit.setSizeDesc("5 m²"); unit.setPricePerMonth(new BigDecimal("1450000")); unit.setStatus("available"); units.save(unit);
    }
    seedManagerIfMissing(facility.getCode());
    seedUser("DEMO-STAFF-HNCG", "staff_demo_hncg", "Staff demo Cầu Giấy", "staff.demo@storage.local", "STAFF", facility.getCode(), "000000000002");
  }

  private void seedManagerIfMissing(String facilityCode) {
    boolean managerExists = users.findAll().stream()
        .filter(user -> facilityCode.equals(user.getFacilityCode()))
        .filter(user -> Set.of("FMANAGER", "FACILITY_MANAGER").contains(user.getRole()))
        .findAny().isPresent();
    if (!managerExists) seedUser("DEMO-MANAGER-HNCG", "manager_demo_hncg", "Manager demo Cầu Giấy", "manager.demo@storage.local", "FMANAGER", facilityCode, "000000000001");
  }

  private void seedUser(String id, String username, String name, String email, String role, String facilityCode, String cccd) {
    if (users.findByUsername(username).isPresent()) return;
    User user = new User(); user.setId(id); user.setUsername(username); user.setName(name); user.setEmail(email); user.setPassword(encoder.encode(password)); user.setRole(role); user.setRoleTitle(role); user.setFacilityCode(facilityCode); user.setFacility("Cơ sở Cầu Giấy"); user.setCccd(cccd); user.setStatus("ACTIVE"); users.save(user);
  }
}
