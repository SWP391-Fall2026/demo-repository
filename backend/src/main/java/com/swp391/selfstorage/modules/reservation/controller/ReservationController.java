package com.swp391.selfstorage.modules.reservation.controller;

import com.swp391.selfstorage.application.workflow.*;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.modules.reservation.service.ReservationService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

  private final ReservationService service;
  private final CreateReservationWorkflow create;
  private final AssignUnitWorkflow assign;
  private final CancelReservationWorkflow cancel;
  private final NoShowWorkflow noShow;

  public ReservationController(
    ReservationService s,
    CreateReservationWorkflow c,
    AssignUnitWorkflow a,
    CancelReservationWorkflow ca,
    NoShowWorkflow n
  ) {
    service = s;
    create = c;
    assign = a;
    cancel = ca;
    noShow = n;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(service.list());
  }

  @GetMapping("/{id}")
  public ApiResponse<?> get(@PathVariable String id) {
    return ApiResponse.ok(service.get(id));
  }

  @PostMapping("/calculate")
  public ApiResponse<?> quote(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(service.quote(d));
  }

  @PostMapping
  public ApiResponse<?> create(@Valid @RequestBody CreateReservationRequest d) {
    return ApiResponse.ok(create.execute(d));
  }

  @PatchMapping("/{id}/assign-unit")
  public ApiResponse<?> assign(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(assign.execute(id, d));
  }

  @PostMapping("/{id}/cancel")
  public ApiResponse<?> cancel(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(cancel.execute(id, d));
  }

  @PostMapping("/{id}/arrived")
  public ApiResponse<?> arrived(@PathVariable String id) {
    return ApiResponse.ok(noShow.arrived(id));
  }

  @PostMapping("/{id}/extension")
  public ApiResponse<?> extend(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(noShow.extend(id, d));
  }

  @PostMapping("/{id}/schedule")
  public ApiResponse<?> schedule(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(noShow.schedule(id, d));
  }

  @PostMapping("/{id}/incident")
  public ApiResponse<?> incident(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(noShow.incident(id, d));
  }

  @PostMapping("/{id}/no-show")
  public ApiResponse<?> noShow(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(noShow.confirm(id, d));
  }
}
