package com.swp391.selfstorage.modules.audit.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

  private final AuditLogService service;

  public AuditLogController(AuditLogService s) {
    service = s;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(service.getLogs());
  }
}
