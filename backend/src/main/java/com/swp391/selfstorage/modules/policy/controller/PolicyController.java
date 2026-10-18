package com.swp391.selfstorage.modules.policy.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

  private final PolicyService s;

  public PolicyController(PolicyService s) {
    this.s = s;
  }

  @GetMapping
  public ApiResponse<?> get() {
    return ApiResponse.ok(s.get());
  }

  @PatchMapping
  public ApiResponse<?> save(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.save(d));
  }

  @PatchMapping("/facility-cap")
  public ApiResponse<?> cap(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.cap(d));
  }
}
