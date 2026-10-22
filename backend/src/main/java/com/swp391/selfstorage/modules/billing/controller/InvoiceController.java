package com.swp391.selfstorage.modules.billing.controller;

import com.swp391.selfstorage.common.web.ApiResponse;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

  private final InvoiceService s;

  public InvoiceController(InvoiceService s) {
    this.s = s;
  }

  @GetMapping
  public ApiResponse<?> list() {
    return ApiResponse.ok(s.list());
  }
}
