package com.swp391.selfstorage.modules.facility.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

  private final FacilityService s;
  private final TaskService tasks;

  public FacilityController(FacilityService s, TaskService tasks) {
    this.s = s;
    this.tasks = tasks;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.facilities());
  }

  @PostMapping
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.create(d));
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
