package com.swp391.selfstorage.modules.facility.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.rental.service.CustomerAccessService;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

  private final FacilityService s;
  private final TaskService tasks;
  private final CustomerAccessService access;

  public FacilityController(FacilityService s, TaskService tasks, CustomerAccessService access) {
    this.s = s;
    this.tasks = tasks;
    this.access = access;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.facilities());
  }

  @GetMapping("/{code}/access-logs")
  public ApiResponse<?> accessLogs(@PathVariable String code) {
    return ApiResponse.ok(access.facilityLogs(code));
  }

  @PostMapping("/{code}/access-requests/{requestId}/approve")
  public ApiResponse<?> approveAccessRequest(
    @PathVariable String code,
    @PathVariable String requestId,
    @RequestBody(required = false) Map<String, Object> d
  ) {
    return ApiResponse.ok(access.approveRequest(code, requestId, d != null ? d : Map.of()));
  }

  @PostMapping("/{code}/access-requests/{requestId}/reject")
  public ApiResponse<?> rejectAccessRequest(
    @PathVariable String code,
    @PathVariable String requestId,
    @RequestBody(required = false) Map<String, Object> d
  ) {
    return ApiResponse.ok(access.rejectRequest(code, requestId, d != null ? d : Map.of()));
  }

  @PostMapping
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.create(d));
  }

  @PutMapping("/{code}")
  public ApiResponse<?> update(
    @PathVariable String code,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.update(code, d));
  }

  @PutMapping("/{code}/checkin-pin")
  public ApiResponse<?> setCheckinPin(@PathVariable String code) {
    return ApiResponse.ok(tasks.setFacilityCheckinPin(code));
  }

  @GetMapping("/units")
  public ApiResponse<?> units(
      @RequestParam(required = false) String facilityCode,
      @RequestParam(required = false) BigDecimal minSize,
      @RequestParam(required = false) BigDecimal maxSize,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice) {
    return ApiResponse.ok(s.catalog(facilityCode, minSize, maxSize, minPrice, maxPrice));
  }

  @GetMapping("/units/manage")
  public ApiResponse<?> managed() {
    return ApiResponse.ok(s.managed());
  }

  @PostMapping("/units")
  public ApiResponse<?> createUnit(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.createUnit(d));
  }


  @PutMapping("/units/{code}")
  public ApiResponse<?> updateUnit(
    @PathVariable String code,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.updateUnit(code, d));
  }

  @PostMapping("/units/{code}/ready")
  public ApiResponse<?> ready(
    @PathVariable String code,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.readiness(code, d, false));
  }

  @PostMapping("/units/{code}/ready/approve")
  public ApiResponse<?> approve(
    @PathVariable String code,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.readiness(code, d, true));
  }
}
