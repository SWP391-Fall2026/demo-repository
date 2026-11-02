package com.swp391.selfstorage.modules.identity.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.identity.service.AccessPolicyService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/access-policy")
public class AccessPolicyController {
  private final AccessPolicyService service;
  public AccessPolicyController(AccessPolicyService service) { this.service = service; }
  @GetMapping
  public ApiResponse<?> get() { return ApiResponse.ok(service.matrix()); }
  @PatchMapping
  public ApiResponse<?> update(@RequestBody Map<String, Object> input) { return ApiResponse.ok(service.update(input)); }
}
