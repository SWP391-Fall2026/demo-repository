package com.swp391.selfstorage.modules.reporting.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.reporting.service.ReportService;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReportController {

  private final ReportService s;

  public ReportController(ReportService s) {
    this.s = s;
  }

  @GetMapping("/api/policies/stats")
  public ApiResponse<?> chain() {
    return ApiResponse.ok(s.chain());
  }

  @GetMapping("/api/reports/facility")
  public ApiResponse<?> facility() {
    return ApiResponse.ok(s.facility());
  }

  @GetMapping("/api/reports/system")
  public ApiResponse<?> system() {
    return ApiResponse.ok(s.system());
  }
}
