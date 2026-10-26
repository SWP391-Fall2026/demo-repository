package com.swp391.selfstorage.modules.rental.controller;

import com.swp391.selfstorage.application.workflow.*;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.rental.service.*;
import java.util.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

  private final ContractService contracts;
  private final AccessCodeService access;
  private final HandoverWorkflow handover;
  private final RequestCheckoutWorkflow request;
  private final CompleteReturnWorkflow inspect;
  private final RenewalService renewal;

  public ContractController(
    ContractService c,
    AccessCodeService a,
    HandoverWorkflow h,
    RequestCheckoutWorkflow r,
    CompleteReturnWorkflow i,
    RenewalService re
  ) {
    contracts = c;
    access = a;
    handover = h;
    request = r;
    inspect = i;
    renewal = re;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(contracts.list());
  }

  @GetMapping("/{id}")
  public ApiResponse<?> detail(@PathVariable String id) {
    return ApiResponse.ok(contracts.detail(id));
  }

  @GetMapping("/handover/eligible")
  public ApiResponse<?> eligibleHandovers() { return ApiResponse.ok(handover.eligibleForStaff()); }

  @PostMapping(value = "/handover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> handover(@RequestParam Map<String, String> fields,
      @RequestParam(value = "evidence", required = false) MultipartFile evidence) {
    return ApiResponse.ok(handover.execute(new HashMap<>(fields), evidence));
  }

  @PostMapping(value = "/handover", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<?> handoverJson(@RequestBody Map<String, Object> fields) {
    return ApiResponse.ok(handover.execute(fields));
  }

  @PostMapping("/{id}/handover/confirm")
  public ApiResponse<?> confirmHandover(@PathVariable String id, @RequestBody Map<String, Object> d) {
    return ApiResponse.ok(handover.confirmByCustomer(id, d));
  }

  @PostMapping(value = "/{id}/handover/issue", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<?> reportHandoverIssue(@PathVariable String id, @RequestBody Map<String, Object> d) {
    return ApiResponse.ok(handover.reportIssue(id, d));
  }

  @PostMapping(value = "/{id}/handover/issue", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> reportHandoverIssueFile(@PathVariable String id, @RequestParam Map<String, String> fields,
      @RequestParam(value = "file", required = false) MultipartFile file) {
    return ApiResponse.ok(handover.reportIssue(id, new HashMap<>(fields), file));
  }

  @GetMapping("/{id}/handover/evidence")
  public ResponseEntity<?> handoverEvidence(@PathVariable String id) throws java.io.IOException {
    var file = handover.evidence(id);
    String contentType = java.nio.file.Files.probeContentType(file);
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType))
        .body(new FileSystemResource(file));
  }

  @PostMapping("/checkout-request")
  public ApiResponse<?> request(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(request.execute(d));
  }

  @PostMapping("/return-inspection")
  public ApiResponse<?> inspect(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(inspect.execute(d));
  }

  @PostMapping("/verify-pin")
  public ApiResponse<?> verify(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(access.verify(d));
  }

  @PatchMapping("/{unitCode}/pin")
  public ApiResponse<?> pin(
    @PathVariable String unitCode,
    @RequestBody Map<String, Object> d
  ) {
    access.update(unitCode, d);
    return ApiResponse.ok("Đã đổi PIN", Map.of());
  }

  @GetMapping("/{id}/renewal-quote")
  public ApiResponse<?> renew(
    @PathVariable String id,
    @RequestParam(defaultValue = "1") int months
  ) {
    return ApiResponse.ok(renewal.quote(id, months));
  }

  @PostMapping("/{id}/renewal-invoice")
  public ApiResponse<?> confirmRenewal(
    @PathVariable String id,
    @RequestBody Map<String, Object> d
  ) {
    return ApiResponse.ok(renewal.confirm(id, d));
  }
}
