package com.swp391.selfstorage.modules.identity.controller;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.identity.service.UserAdminService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserAdminController {

  private final UserAdminService service;
  private final ActorContext actor;

  public UserAdminController(UserAdminService s, ActorContext a) {
    service = s;
    actor = a;
  }

  @GetMapping("/users")
  public ApiResponse<?> users() {
    return ApiResponse.ok(service.list());
  }

  @PostMapping("/users")
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(service.create(d));
  }

  @PatchMapping("/users/{id}")
  public ApiResponse<?> update(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(service.update(id, d));
  }

  @GetMapping("/login-history")
  public ApiResponse<?> history() {
    return ApiResponse.ok(service.history());
  }

  @GetMapping("/rbac-matrix")
  public ApiResponse<?> roles() {
    actor.require("ADMIN");
    return ApiResponse.ok(
      Map.of(
        "CUSTOMER",
        "Chỉ dữ liệu của mình",
        "STAFF",
        "Vận hành đúng chi nhánh; không duyệt hoàn cuối",
        "FMANAGER",
        "Quản lý cơ sở, duyệt hoàn và kho sẵn sàng",
        "OPS_MGR",
        "Chính sách và báo cáo toàn chuỗi",
        "ADMIN",
        "Tài khoản, chi nhánh nhân sự, audit"
      )
    );
  }
}
