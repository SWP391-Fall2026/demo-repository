package com.swp391.selfstorage.modules.rental.controller;

import com.swp391.selfstorage.application.workflow.*;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.rental.service.*;
import java.util.*;
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

  @PostMapping("/handover")
  public ApiResponse<?> handover(@RequestBody Map<String, Object> d) {
    return ApiResponse.ok(handover.execute(d));
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
