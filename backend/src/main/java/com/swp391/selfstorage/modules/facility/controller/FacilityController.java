package com.swp391.selfstorage.modules.facility.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

  private final FacilityService s;

  public FacilityController(FacilityService s) {
    this.s = s;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.facilities());
  }

  @PostMapping
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.create(d));
  }

  @GetMapping("/units")
  public ApiResponse<?> units() {
    return ApiResponse.ok(s.catalog());
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
