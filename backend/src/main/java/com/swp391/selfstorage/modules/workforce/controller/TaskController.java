package com.swp391.selfstorage.modules.workforce.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

  private final TaskService s;

  public TaskController(TaskService s) {
    this.s = s;
  }

  @GetMapping({ "", "/daily" })
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }

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
}
