package com.swp391.selfstorage.modules.identity.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.identity.dto.UserDto;
import com.swp391.selfstorage.modules.identity.entity.*;
import com.swp391.selfstorage.modules.identity.repository.*;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAdminService {

  private final UserRepository users;
  private final LoginHistoryRepository history;
  private final FacilityRepository facilities;
  private final ActorContext actor;
  private final PasswordEncoder encoder;
  private final AuditLogService audit;

  public UserAdminService(
    UserRepository u,
    LoginHistoryRepository h,
    FacilityRepository f,
    ActorContext a,
    PasswordEncoder e,
    AuditLogService audit
  ) {
    users = u;
    history = h;
    facilities = f;
    actor = a;
    encoder = e;
    this.audit = audit;
  }

  public List<UserDto> list() {
    actor.require("ADMIN");
    return users.findAll().stream().map(UserDto::new).toList();
  }

  public List<LoginHistory> history() {
    actor.require("ADMIN");
    return history.findAllByOrderByIdDesc();
  }

  @Transactional
  public UserDto create(Map<String, Object> d) {
    actor.require("ADMIN");
    String username = Inputs.text(d, "username").trim().toLowerCase(Locale.ROOT),
      email = Inputs.text(d, "email").trim().toLowerCase(Locale.ROOT);
    if (!username.matches("^[a-z_][a-z0-9_]{3,19}$")) throw Inputs.bad("Tên đăng nhập gồm 4–20 chữ, số hoặc dấu gạch dưới");
    if (
      users.existsByUsernameIgnoreCase(username) || users.existsByEmailIgnoreCase(email)
    ) throw Inputs.conflict("Tên đăng nhập hoặc email đã tồn tại");
    String password = Inputs.text(d, "password");
    if (password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw Inputs.bad("Mật khẩu tạm thời phải có 8–72 byte UTF-8");
    String phone = Inputs.text(d, "phone").replaceAll("[\\s.-]", "");
    if (!phone.matches("^(03|05|07|08|09)[0-9]{8}$")) throw Inputs.bad("Số điện thoại Việt Nam không hợp lệ");
    if (users.existsByNormalizedPhone(phone)) throw Inputs.conflict("Số điện thoại đã được sử dụng");
    String cccd = Inputs.text(d, "cccd").replaceAll("\\s", "");
    if (!cccd.matches("^[0-9]{12}$")) throw Inputs.bad("CCCD phải có 12 chữ số");
    if (users.existsByCccd(cccd)) throw Inputs.conflict("CCCD đã được sử dụng");
    String name = Inputs.text(d, "name");
    if (name.length() < 2 || name.length() > 50) throw Inputs.bad("Họ tên phải có 2–50 ký tự");
    if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw Inputs.bad("Email không hợp lệ");
    User u = new User();
    u.setId("USR-" + UUID.randomUUID());
    u.setName(name);
    u.setUsername(username);
    u.setEmail(email);
    u.setPhone(phone);
    u.setCccd(cccd);
    u.setPassword(encoder.encode(password));
    u.setCreatedAt(LocalDateTime.now());
    u.setStatus("ACTIVE");
    configure(u, d);
    users.saveAndFlush(u);
    audit.record("CREATE_USER", u.getId(), "Tạo tài khoản nhân sự");
    return new UserDto(u);
  }

  @Transactional
  public UserDto update(String id, Map<String, Object> d) {
    actor.require("ADMIN");
    User u = users.findById(id).orElseThrow(Inputs::missing);
    configure(u, d);
    if (d.containsKey("status")) {
      String status = Inputs.text(d, "status");
      if (
        !Set.of("ACTIVE", "LOCKED", "DISABLED").contains(status)
      ) throw Inputs.bad("Trạng thái không hợp lệ");
      u.setStatus(status);
    }
    users.save(u);
    audit.record("UPDATE_USER", id, "Cập nhật role, chi nhánh hoặc trạng thái");
    return new UserDto(u);
  }

  private void configure(User u, Map<String, Object> d) {
    String role = d.containsKey("role")
      ? Inputs.text(d, "role")
      : actor.role(u);
    if (
      !Set.of("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN").contains(
        role
      )
    ) throw Inputs.bad("Vai trò không hợp lệ");
    u.setRole(role);
    u.setRoleTitle(switch (role) {
      case "FMANAGER" -> "Facility Manager";
      case "STAFF" -> "Facility Staff";
      case "OPS_MGR" -> "Business Operation Manager";
      case "ADMIN" -> "Admin";
      default -> role;
    });
    if ("ADMIN".equals(role) && users.existsOtherUserWithRole(Set.of("ADMIN", "SYSTEM_ADMIN"), u.getId()))
      throw Inputs.conflict("Hệ thống chỉ được có một Admin");
    if ("OPS_MGR".equals(role) && users.existsOtherUserWithRole(Set.of("OPS_MGR", "OPS_MANAGER"), u.getId()))
      throw Inputs.conflict("Hệ thống chỉ được có một Business Operation Manager");
    if (Set.of("STAFF", "FMANAGER").contains(role)) {
      String code = d.containsKey("facilityCode")
        ? Inputs.text(d, "facilityCode")
        : u.getFacilityCode();
      if (code == null || code.isBlank()) throw Inputs.bad(
        "Cần chỉ định cơ sở"
      );
      var f = facilities.findById(code.trim()).orElseThrow(Inputs::missing);
      if (!"ACTIVE".equalsIgnoreCase(f.getStatus())) throw Inputs.bad("Cơ sở phụ trách không hoạt động");
      if ("FMANAGER".equals(role) && users.existsOtherFacilityManager(f.getCode(), u.getId()))
        throw Inputs.conflict("Cơ sở này đã có Facility Manager; mỗi cơ sở chỉ có một người quản lý");
      u.setFacilityCode(f.getCode());
      u.setFacility(f.getName());
    } else {
      u.setFacilityCode(null);
      u.setFacility(null);
    }
  }
}
