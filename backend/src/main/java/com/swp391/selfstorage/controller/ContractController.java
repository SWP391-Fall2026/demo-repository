package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.RefundRequest;
import com.swp391.selfstorage.service.ContractService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Contract>>> getAllContracts(
            @AuthenticationPrincipal UserDetails principal) {
        List<Contract> list = contractService.getAllContracts(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/verify-pin")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPin(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {
        String unitCode = body.get("unitCode");
        String pin = body.get("pin");
        boolean authorized = contractService.verifyPin(principal.getUsername(), unitCode, pin);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("authorized", authorized);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PatchMapping("/{unitCode}/pin")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Contract>> updatePin(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String unitCode,
            @RequestBody Map<String, String> body) {
        try {
            Contract updated = contractService.updatePin(principal.getUsername(), unitCode, body.get("newPin"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/handover")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Contract>> completeHandover(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Contract contract = contractService.completeHandover(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(contract));
    }

    @PostMapping("/checkout-request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Contract>> requestCheckout(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {
        String contractId = body.get("contractId");
        LocalDate requestedDate;
        try {
            requestedDate = body.get("requestedDate") == null
                    ? LocalDate.now() : LocalDate.parse(body.get("requestedDate"));
        } catch (RuntimeException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "requestedDate must use yyyy-MM-dd format");
        }
        Contract contract = contractService.requestCheckout(principal.getUsername(), contractId, requestedDate);
        return ResponseEntity.ok(ApiResponse.ok(contract));
    }

    @GetMapping("/{contractId}/renewal-quote")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> renewalQuote(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String contractId,
            @RequestParam(defaultValue = "1") int months) {
        return ResponseEntity.ok(ApiResponse.ok(
                contractService.getRenewalQuote(principal.getUsername(), contractId, months)));
    }

    @PostMapping("/return-inspection")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> returnInspection(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> result = contractService.returnInspection(
                principal.getUsername(), Objects.toString(body.get("unitCode"), null), body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{contractId}/refund/approve")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<RefundRequest>> approveRefund(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String contractId) {
        return ResponseEntity.ok(ApiResponse.ok(contractService.approveRefund(principal.getUsername(), contractId)));
    }

    @PatchMapping("/reservations/{reservationId}/refund/approve")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<RefundRequest>> approveReservationRefund(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String reservationId) {
        return ResponseEntity.ok(ApiResponse.ok(
                contractService.approveReservationRefund(principal.getUsername(), reservationId)));
    }

    @GetMapping("/refunds/pending")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<List<RefundRequest>>> getPendingRefunds(
            @AuthenticationPrincipal UserDetails principal) {
        List<RefundRequest> refunds = contractService.getPendingRefunds(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(refunds.size(), refunds));
    }

    @PatchMapping("/{contractId}/overdue-lockout")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Contract>> lockOverdueContract(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String contractId) {
        return ResponseEntity.ok(ApiResponse.ok(
                contractService.lockOverdueContract(principal.getUsername(), contractId)));
    }
}
