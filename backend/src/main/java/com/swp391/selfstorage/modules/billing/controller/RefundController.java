package com.swp391.selfstorage.modules.billing.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.billing.service.*;
import java.util.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

  private final RefundRequestService requests;
  private final RefundExecutionService execution;

  public RefundController(RefundRequestService r, RefundExecutionService e) {
    requests = r;
    execution = e;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(requests.list());
  }

  @PostMapping
  public ApiResponse<?> create(
    @RequestBody Map<String, Object> d,
    @RequestHeader(value = "Idempotency-Key", required = false) String key
  ) {
    return ApiResponse.ok(requests.create(d, key));
  }

  @PostMapping("/{id}/cancel")
  public ApiResponse<?> cancel(@PathVariable String id) {
    return ApiResponse.ok(requests.cancel(id));
  }

  @PostMapping("/{id}/decision")
  public ApiResponse<?> decision(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(requests.decide(id, d));
  }

  @PostMapping(
    value = "/{id}/evidence",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
  )
  public ApiResponse<?> evidence(
    @PathVariable String id,
    @RequestParam MultipartFile file,
    @RequestParam String reference
  ) {
    return ApiResponse.ok(execution.evidence(id, file, reference));
  }

  @GetMapping("/{id}/evidence")
  public ResponseEntity<?> file(@PathVariable String id) {
    var e = execution.latest(id);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(e.getContentType()))
      .header(
        "Content-Disposition",
        ContentDisposition.attachment()
          .filename("refund-evidence")
          .build()
          .toString()
      )
      .body(new FileSystemResource(execution.evidencePath(id)));
  }

  @PostMapping("/{id}/confirm")
  public ApiResponse<?> confirm(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(execution.confirm(id, d));
  }
}
