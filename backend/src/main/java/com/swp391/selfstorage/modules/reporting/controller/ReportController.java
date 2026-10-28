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
  public ApiResponse<?> chain(
    @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
    @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
  ) {
    return ApiResponse.ok(s.chain(startDate, endDate));
  }

  @GetMapping("/api/reports/facility")
  public ApiResponse<?> facility(
    @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
    @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
  ) {
    return ApiResponse.ok(s.facility(startDate, endDate));
  }

  @GetMapping("/api/reports/system")
  public ApiResponse<?> system() {
    return ApiResponse.ok(s.system());
  }

  @GetMapping("/api/reports/export")
  public org.springframework.http.ResponseEntity<byte[]> exportCsv(
    @RequestParam(value = "facilityCode", required = false) String facilityCode,
    @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
    @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
    @RequestParam(value = "format", defaultValue = "csv") String format
  ) {
    String selectedFormat = format.toLowerCase(java.util.Locale.ROOT);
    byte[] data = s.export(facilityCode, startDate, endDate, selectedFormat);
    boolean xlsx = "xlsx".equals(selectedFormat);
    String filename = "report-" + (facilityCode != null ? facilityCode : "chain") + "-" + java.time.LocalDate.now() + (xlsx ? ".xlsx" : ".csv");
    return org.springframework.http.ResponseEntity.ok()
      .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
      .contentType(org.springframework.http.MediaType.parseMediaType(xlsx
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv; charset=UTF-8"))
      .body(data);
  }
}
