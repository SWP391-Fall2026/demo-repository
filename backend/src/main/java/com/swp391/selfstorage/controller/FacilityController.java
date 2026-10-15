package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Facility;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.service.FacilityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/unit-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUnitTypes() {
        List<Map<String, Object>> list = facilityService.getUnitTypes();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<Unit>>> getAllUnits() {
        List<Unit> list = facilityService.getAllUnits();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PatchMapping("/units/{code}/status")
    public ResponseEntity<ApiResponse<Unit>> updateUnitStatus(
            @PathVariable String code,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            String tenant = body.get("tenant");
            Unit updated = facilityService.updateUnitStatus(code, status, tenant);
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}
