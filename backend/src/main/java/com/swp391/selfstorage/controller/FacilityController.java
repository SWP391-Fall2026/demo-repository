package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Facility;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.service.FacilityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Facility>>> getAllFacilities() {
        List<Facility> list = facilityService.getAllFacilities();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OPS_MGR', 'OPS_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<Facility>> createFacility(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Facility facility = facilityService.createFacility(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(facility));
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasAnyRole('OPS_MGR', 'OPS_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    public ResponseEntity<ApiResponse<Facility>> updateFacility(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String code,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(facilityService.updateFacility(principal.getUsername(), code, body)));
    }

    @GetMapping("/unit-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUnitTypes() {
        List<Map<String, Object>> list = facilityService.getUnitTypes();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @GetMapping("/inventory/{facilityCode}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPublicInventory(@PathVariable String facilityCode) {
        return ResponseEntity.ok(ApiResponse.ok(facilityService.getPublicInventory(facilityCode)));
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<Unit>>> getAllUnits(
            @RequestParam(required = false) String facilityCode,
            @RequestParam(required = false) String type) {
        List<Unit> list = facilityService.getAvailableUnits(facilityCode, type);
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @GetMapping("/units/manage")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<List<Unit>>> getManagedUnits(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        List<Unit> list = facilityService.getManagedUnits(principal.getUsername(), status, type);
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping("/units")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Unit>> createUnit(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Unit unit = facilityService.createUnit(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(unit));
    }

    @PutMapping("/units/{code}")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Unit>> updateUnit(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String code,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(facilityService.updateUnit(principal.getUsername(), code, body)));
    }

    @PatchMapping("/units/{code}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Unit>> updateUnitStatus(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String code,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            String tenant = body.get("tenant");
            Unit updated = facilityService.updateUnitStatus(principal.getUsername(), code, status, tenant);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/units/{code}")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<Void> deleteUnit(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String code) {
        facilityService.deleteUnit(principal.getUsername(), code);
        return ResponseEntity.noContent().build();
    }
}
