package com.swp391.selfstorage.modules.billing.controller;

import com.swp391.selfstorage.application.workflow.PayInvoiceWorkflow;
import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.billing.service.PaymentService;
import java.util.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

  private final PaymentService s;
  private final PayInvoiceWorkflow pay;
  private final com.swp391.selfstorage.modules.billing.service.VnPayService vnPay;

  public PaymentController(PaymentService s, PayInvoiceWorkflow p,
      com.swp391.selfstorage.modules.billing.service.VnPayService vnPay) {
    this.s = s;
    pay = p;
    this.vnPay = vnPay;
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

  @PostMapping("/vnpay/create")
  public ApiResponse<?> createVnPay(@RequestBody Map<String, String> body, HttpServletRequest request) {
    return ApiResponse.ok(Map.of("paymentUrl", vnPay.createPaymentUrl(body.get("invoiceId"), request.getRemoteAddr())));
  }

  @GetMapping("/vnpay/ipn")
  public Map<String, String> vnPayIpn(@RequestParam Map<String, String> params) {
    return vnPay.processIpn(params);
  }

  @GetMapping("/vnpay/return")
  public ResponseEntity<Void> vnPayReturn(@RequestParam Map<String, String> params) {
    return ResponseEntity.status(HttpStatus.FOUND).location(java.net.URI.create(vnPay.returnTarget(params))).build();
  }
}
