package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    public ResponseEntity<ApiResponse<List<Payment>>> getTransactions(
            @AuthenticationPrincipal UserDetails principal) {
        List<Payment> list = paymentService.getTransactions(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/simulate")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Payment>> simulatePayment(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Payment txn = paymentService.simulatePayment(principal.getUsername(), body, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(txn));
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Payment>> payDeposit(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Payment payment = paymentService.simulatePayment(principal.getUsername(), body, "DEPOSIT");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(payment));
    }

    @PostMapping("/rent")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Payment>> payFirstMonthRent(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Payment payment = paymentService.simulatePayment(principal.getUsername(), body, "RENT");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(payment));
    }

    @PostMapping("/renew")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Payment>> renewContract(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Payment payment = paymentService.simulatePayment(principal.getUsername(), body, "RENEW");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(payment));
    }

    @GetMapping("/reservations/{reservationId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getReservationPayments(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String reservationId) {
        List<Payment> payments = paymentService.getReservationPayments(principal.getUsername(), reservationId);
        return ResponseEntity.ok(ApiResponse.list(payments.size(), payments));
    }
}
