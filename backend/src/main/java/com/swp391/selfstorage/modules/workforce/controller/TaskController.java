package com.swp391.selfstorage.modules.workforce.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import com.swp391.selfstorage.application.workflow.CheckinWorkflow;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

  private final TaskService s;
  private final CheckinWorkflow checkin;

  public TaskController(TaskService s, CheckinWorkflow checkin) {
    this.s = s;
    this.checkin = checkin;
  }

  @GetMapping({ "", "/daily" })
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }

  @GetMapping("/staff-options")
  public ApiResponse<?> staffOptions() { return ApiResponse.ok(s.staffOptions()); }

  @GetMapping("/manager-dashboard")
  public ApiResponse<?> managerDashboard() { return ApiResponse.ok(s.managerDashboard()); }

  @PostMapping("/dispatch")
  public ApiResponse<?> assign(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.assign(d));
  }

  @PatchMapping("/{id}/status")
  public ApiResponse<?> progress(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.progress(id, d));
  }

  @PatchMapping("/{id}/assign")
  public ApiResponse<?> assignExisting(@PathVariable String id, @RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.assignExisting(id, d));
  }

  @PostMapping("/{id}/checkin/verify")
  public ApiResponse<?> verifyCheckin(@PathVariable String id, @RequestBody Map<String, Object> d) {
    return ApiResponse.ok(checkin.verify(s.find(id), d));
  }

  @GetMapping("/{id}/checkin/credentials")
  public ApiResponse<?> checkinCredentials(@PathVariable String id) {
    return ApiResponse.ok(s.credentials(id));
  }
}
