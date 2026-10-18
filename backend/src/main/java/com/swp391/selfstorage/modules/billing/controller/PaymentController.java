package com.swp391.selfstorage.modules.billing.controller;

import com.swp391.selfstorage.application.workflow.PayInvoiceWorkflow;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.billing.service.PaymentService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentService s;
  private final PayInvoiceWorkflow pay;

  public PaymentController(PaymentService s, PayInvoiceWorkflow p) {
    this.s = s;
    pay = p;
  }

  @GetMapping("/transactions")
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }

  @GetMapping("/bank-info")
  public ApiResponse<?> bank() {
    return ApiResponse.ok(s.bank());
  }

  @PostMapping("/simulate")
  public ApiResponse<?> pay(
    @RequestBody Map<String, Object> d,
    @RequestHeader(value = "Idempotency-Key", required = false) String key
  ) {
    return ApiResponse.ok(pay.execute(d, key));
  }
}
