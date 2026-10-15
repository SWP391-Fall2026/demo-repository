package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/bank-info")
    public ResponseEntity<ApiResponse<Map<String, String>>> getBankInfo() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getBankInfo()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<Payment>>> getTransactions() {
        List<Payment> list = paymentService.getTransactions();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<Payment>> simulatePayment(@RequestBody Map<String, Object> body) {
        Payment txn = paymentService.simulatePayment(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(txn));
    }
}
