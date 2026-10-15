package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.service.PolicyAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/policies")
public class PolicyAnalyticsController {

    private final PolicyAnalyticsService policyAnalyticsService;

    public PolicyAnalyticsController(PolicyAnalyticsService policyAnalyticsService) {
        this.policyAnalyticsService = policyAnalyticsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPolicies() {
        return ResponseEntity.ok(ApiResponse.ok(policyAnalyticsService.getPricingPolicies()));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePolicies(@RequestBody Map<String, Object> updates) {
        Map<String, Object> updated = policyAnalyticsService.updatePricingPolicies(updates);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(policyAnalyticsService.getChainStats()));
    }
}
