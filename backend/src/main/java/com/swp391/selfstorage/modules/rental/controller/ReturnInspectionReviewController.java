package com.swp391.selfstorage.modules.rental.controller;

import com.swp391.selfstorage.application.workflow.ReturnInspectionReviewWorkflow;
import com.swp391.selfstorage.common.storage.AttachmentStorage;
import com.swp391.selfstorage.common.web.ApiResponse;
import java.nio.file.Files;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/return-inspection-reviews")
public class ReturnInspectionReviewController {

  private final ReturnInspectionReviewWorkflow workflow;
  private final AttachmentStorage storage;

  public ReturnInspectionReviewController(
    ReturnInspectionReviewWorkflow workflow,
    AttachmentStorage storage
  ) {
    this.workflow = workflow;
    this.storage = storage;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(workflow.list());
  }

  @PostMapping("/{id}/decision")
  public ApiResponse<?> decide(@PathVariable String id, @RequestBody Map<String, Object> input) {
    return ApiResponse.ok(workflow.decide(id, input));
  }

  @GetMapping("/{id}/evidence")
  public ResponseEntity<?> evidence(@PathVariable String id) throws java.io.IOException {
    var dispute = workflow.evidence(id);
    var file = storage.resolve(dispute.getEvidencePath());
    String contentType = Files.probeContentType(file);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(contentType == null
        ? MediaType.APPLICATION_OCTET_STREAM_VALUE
        : contentType))
      .body(new FileSystemResource(file));
  }
}
