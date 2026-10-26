package com.swp391.selfstorage.modules.rental.controller;

import com.swp391.selfstorage.application.workflow.HandoverReviewWorkflow;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.ApiResponse;
import java.util.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/handover-reviews")
public class HandoverReviewController {
  private final HandoverReviewWorkflow workflow;
  private final AttachmentStorage storage;

  public HandoverReviewController(HandoverReviewWorkflow workflow, AttachmentStorage storage) {
    this.workflow = workflow; this.storage = storage;
  }

  @GetMapping
  public ApiResponse<?> list() { return ApiResponse.ok(workflow.list()); }

  @GetMapping("/{id}")
  public ApiResponse<?> detail(@PathVariable String id) { return ApiResponse.ok(workflow.detail(id)); }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> create(@RequestParam Map<String, String> fields,
      @RequestParam(value = "file", required = false) MultipartFile file) {
    return ApiResponse.ok(workflow.requestCancellation(new HashMap<>(fields), file));
  }

  @PostMapping("/{id}/decision")
  public ApiResponse<?> decide(@PathVariable String id, @RequestBody Map<String, Object> input) {
    return ApiResponse.ok(workflow.decide(id, input));
  }

  @PostMapping("/{id}/response")
  public ApiResponse<?> respond(@PathVariable String id, @RequestBody Map<String, Object> input) {
    return ApiResponse.ok(workflow.respond(id, input));
  }

  @PostMapping(value = "/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> evidence(@PathVariable String id, @RequestParam String note,
      @RequestParam(value = "file", required = false) MultipartFile file) {
    return ApiResponse.ok(workflow.addEvidence(id, note, file));
  }

  @GetMapping("/evidence/{id}")
  public ResponseEntity<?> download(@PathVariable String id) {
    var row = workflow.evidence(id);
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(row.getContentType()))
        .header("Content-Disposition", "attachment; filename=handover-review-evidence")
        .body(new FileSystemResource(storage.resolve(row.getEvidencePath())));
  }
}
