package com.swp391.selfstorage.modules.support.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.support.service.SupportTicketService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class SupportTicketController {

  private final SupportTicketService s;

  public SupportTicketController(SupportTicketService s) {
    this.s = s;
  }

  @GetMapping({ "/api/tickets", "/api/tasks/tickets" })
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }

  @PostMapping({ "/api/tickets", "/api/tasks/tickets" })
  public ApiResponse<?> create(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.create(d));
  }

  @PatchMapping({ "/api/tickets/{id}", "/api/tasks/tickets/{id}" })
  public ApiResponse<?> update(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(s.update(id, d));
  }

  @PatchMapping({ "/api/tickets/{id}/assign", "/api/tasks/tickets/{id}/assign" })
  public ApiResponse<?> assign(@PathVariable String id, @RequestBody Map<String, Object> d) {
    return ApiResponse.ok(s.assign(id, d));
  }

  @PostMapping({ "/api/tickets/{id}/reset-pin", "/api/tasks/tickets/{id}/reset-pin" })
  public ApiResponse<?> resetPin(@PathVariable String id, @RequestBody(required = false) Map<String, Object> d) {
    return ApiResponse.ok(s.resetTemporaryPin(id, d == null ? Map.of() : d));
  }

  @PostMapping(value = "/api/tickets/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> upload(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
    return ApiResponse.ok(s.uploadAttachment(file));
  }
}
