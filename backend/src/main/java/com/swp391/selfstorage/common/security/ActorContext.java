package com.swp391.selfstorage.common.security;

import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ActorContext {

  private final UserRepository users;

  public ActorContext(UserRepository users) {
    this.users = users;
  }

  public User current() {
    var a = SecurityContextHolder.getContext().getAuthentication();
    if (
      a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getName())
    ) throw new ResponseStatusException(
      HttpStatus.UNAUTHORIZED,
      "Đăng nhập để tiếp tục"
    );
    User u = users
      .findByUsername(a.getName())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    if (
      !"ACTIVE".equalsIgnoreCase(u.getStatus())
    ) throw new ResponseStatusException(
      HttpStatus.UNAUTHORIZED,
      "Tài khoản không hoạt động"
    );
    return u;
  }

  public String role(User u) {
    return switch (u.getRole()) {
      case "FACILITY_MANAGER" -> "FMANAGER";
      case "OPS_MANAGER" -> "OPS_MGR";
      case "SYSTEM_ADMIN" -> "ADMIN";
      default -> u.getRole();
    };
  }

  public User require(String... roles) {
    User u = current();
    if (
      !Arrays.asList(roles).contains(role(u))
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Vai trò không được phép thực hiện"
    );
    return u;
  }

  public boolean visible(User u, String owner, String facility) {
    return switch (role(u)) {
      case "CUSTOMER" -> Objects.equals(u.getId(), owner);
      case "STAFF", "FMANAGER" -> u.getFacilityCode() != null &&
        Objects.equals(u.getFacilityCode(), facility);
      case "OPS_MGR", "ADMIN" -> true;
      default -> false;
    };
  }

  public void facility(User u, String code) {
    if (
      u.getFacilityCode() == null || !u.getFacilityCode().equals(code)
    ) throw new ResponseStatusException(
      HttpStatus.FORBIDDEN,
      "Chi nhánh không thuộc phạm vi phụ trách"
    );
  }
}
