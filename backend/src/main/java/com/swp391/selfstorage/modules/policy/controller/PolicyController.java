package com.swp391.selfstorage.modules.policy.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.audit.repository.AuditLogRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

  private final PolicyService s;
  private final AuditLogRepository history;

  public PolicyController(PolicyService s, AuditLogRepository history) {
    this.s = s;
    this.history = history;
  }

  @GetMapping
  public ApiResponse<?> get() {
    return ApiResponse.ok(s.get());
  }

  @GetMapping("/history")
  public ApiResponse<?> history() {
    return ApiResponse.ok(history.findByActionOrderByIdDesc("UPDATE_POLICY"));
  }

  @PatchMapping
  public ApiResponse<?> save(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.save(d));
  }

  @PatchMapping("/facility-price")
  public ApiResponse<?> saveFacilityPrice(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.saveFacilityPrice(d));
  }

  @PatchMapping("/facility-cap")
  public ApiResponse<?> cap(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.cap(d));
  }
}
