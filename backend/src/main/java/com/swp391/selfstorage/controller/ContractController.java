package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.service.ContractService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Contract>>> getAllContracts() {
        List<Contract> list = contractService.getAllContracts();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPin(@RequestBody Map<String, String> body) {
        String unitCode = body.get("unitCode");
        String pin = body.get("pin");
        boolean authorized = contractService.verifyPin(unitCode, pin);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("authorized", authorized);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PatchMapping("/{unitCode}/pin")
    public ResponseEntity<ApiResponse<Contract>> updatePin(
            @PathVariable String unitCode,
            @RequestBody Map<String, String> body) {
        try {
            Contract updated = contractService.updatePin(unitCode, body.get("newPin"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/handover")
    public ResponseEntity<ApiResponse<Contract>> completeHandover(@RequestBody Map<String, Object> body) {
        Contract contract = contractService.completeHandover(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(contract));
    }

    @PostMapping("/return-inspection")
    public ResponseEntity<ApiResponse<Map<String, Object>>> returnInspection(@RequestBody Map<String, Object> body) {
        try {
            String unitCode = (String) body.get("unitCode");
            Object dedObj = body.get("deductions");
            long deductions = dedObj instanceof Number ? ((Number) dedObj).longValue() : 0L;

            Map<String, Object> result = contractService.returnInspection(unitCode, deductions);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}
