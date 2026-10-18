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
    String username = Inputs.text(d, "username").toLowerCase(),
      email = Inputs.text(d, "email").toLowerCase();
    if (
      users.existsByUsername(username) || users.existsByEmail(email)
    ) throw Inputs.conflict("Tên đăng nhập hoặc email đã tồn tại");
    String password = Inputs.text(d, "password");
    if (password.length() < 8) throw Inputs.bad("Mật khẩu tối thiểu 8 ký tự");
    User u = new User();
    u.setId("USR-" + UUID.randomUUID());
    u.setName(Inputs.text(d, "name"));
    u.setUsername(username);
    u.setEmail(email);
    u.setPassword(encoder.encode(password));
    u.setCreatedAt(LocalDateTime.now());
    u.setStatus("ACTIVE");
    configure(u, d);
    users.save(u);
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
    u.setRoleTitle(role);
    if (Set.of("STAFF", "FMANAGER").contains(role)) {
      String code = d.containsKey("facilityCode")
        ? Inputs.text(d, "facilityCode")
        : u.getFacilityCode();
      if (code == null || code.isBlank()) throw Inputs.bad(
        "Cần chỉ định cơ sở"
      );
      var f = facilities.findById(code).orElseThrow(Inputs::missing);
      u.setFacilityCode(code);
      u.setFacility(f.getName());
    } else {
      u.setFacilityCode(null);
      u.setFacility(null);
    }
  }
}
