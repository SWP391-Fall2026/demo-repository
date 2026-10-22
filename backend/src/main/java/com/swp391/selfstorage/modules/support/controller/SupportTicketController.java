package com.swp391.selfstorage.modules.support.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.support.service.SupportTicketService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/tickets", "/api/tasks/tickets" })
public class SupportTicketController {

  private final SupportTicketService s;

  public SupportTicketController(SupportTicketService s) {
    this.s = s;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }

  @PostMapping
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.create(d));
  }

  @PatchMapping("/{id}")
  public ApiResponse<?> update(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.update(id, d));
  }
}
