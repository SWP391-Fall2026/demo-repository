package com.swp391.selfstorage.modules.rental.controller;

import com.swp391.selfstorage.application.workflow.*;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.rental.service.AccessCodeService;
import com.swp391.selfstorage.modules.rental.service.ContractService;
import com.swp391.selfstorage.modules.rental.service.RenewalService;
import java.util.*;
import java.nio.file.Files;
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
  private final ConfirmInspectionWorkflow confirmInspection;
  private final ReturnInspectionReviewWorkflow inspectionReviews;
  private final RenewalService renewal;

  public ContractController(
    ContractService c,
    AccessCodeService a,
    HandoverWorkflow h,
    RequestCheckoutWorkflow r,
    CompleteReturnWorkflow i,
    ConfirmInspectionWorkflow confirmInspection,
    RenewalService re,
    ReturnInspectionReviewWorkflow inspectionReviews
  ) {
    contracts = c;
    access = a;
    handover = h;
    request = r;
    inspect = i;
    this.confirmInspection = confirmInspection;
    renewal = re;
    this.inspectionReviews = inspectionReviews;
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

  @PostMapping(value = "/return-inspection", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> inspect(@RequestParam Map<String, String> fields,
      @RequestParam(value = "evidence", required = false) MultipartFile evidence) {
    return ApiResponse.ok(inspect.execute(new HashMap<>(fields), evidence));
  }

  @PostMapping(value = "/return-inspection", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ApiResponse<?> inspectJson(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(inspect.execute(d, null));
  }

  @PostMapping("/return-inspection/confirm")
  public ApiResponse<?> confirmInspection(@RequestBody Map<String, Object> d) {
    if (!Boolean.TRUE.equals(d.get("customerConfirmed")))
      throw Inputs.bad("Khách cần xác nhận phiếu nghiệm thu");
    return ApiResponse.ok(inspectionReviews.respond(
      Map.of("contractId", Inputs.text(d, "contractId"), "action", "ACCEPT"),
      null
    ));
  }

  @PostMapping(value = "/return-inspection/respond", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<?> respondInspection(
      @RequestParam Map<String, String> fields,
      @RequestParam(value = "evidence", required = false) MultipartFile evidence) {
    return ApiResponse.ok(inspectionReviews.respond(fields, evidence));
  }

  @PostMapping("/return-inspection/complete")
  public ApiResponse<?> completeInspection(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(confirmInspection.complete(d));
  }

  @GetMapping("/{contractId}/return-inspection/evidence")
  public ResponseEntity<?> inspectionEvidence(@PathVariable String contractId) throws java.io.IOException {
    var file = inspect.evidence(contractId);
    String contentType = Files.probeContentType(file);
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(contentType == null
        ? MediaType.APPLICATION_OCTET_STREAM_VALUE
        : contentType))
      .body(new FileSystemResource(file));
  }

  @PostMapping("/verify-pin")
  public ApiResponse<?> verify(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(access.verify(d));
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
