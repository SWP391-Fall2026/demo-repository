package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.service.PolicyAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
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
    @PreAuthorize("hasAnyRole('OPS_MGR', 'OPS_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updatePolicies(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> updates) {
        Map<String, Object> updated = policyAnalyticsService.updatePricingPolicies(updates, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OPS_MGR', 'OPS_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(policyAnalyticsService.getChainStats(parseMonth(month))));
    }

    @GetMapping("/reports/facility")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFacilityReport(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(
                policyAnalyticsService.getFacilityStats(principal.getUsername(), parseMonth(month))));
    }

    private static YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) return YearMonth.now();
        try {
            return YearMonth.parse(month);
        } catch (RuntimeException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "month must use yyyy-MM format");
        }
    }
}
