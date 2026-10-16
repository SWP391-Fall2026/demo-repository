package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Reservation>>> getAllReservations(
            @AuthenticationPrincipal UserDetails principal) {
        List<Reservation> list = reservationService.getAllReservations(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Reservation>> getById(
            @AuthenticationPrincipal UserDetails principal, @PathVariable String id) {
        Reservation rsv = reservationService.getReservationById(id, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(rsv));
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('STAFF', 'FMANAGER', 'FACILITY_MANAGER', 'OPS_MGR', 'OPS_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<Reservation>>> lookup(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String query) {
        List<Reservation> matches = reservationService.lookup(query, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(matches.size(), matches));
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateCost(@RequestBody Map<String, Object> body) {
        String unitType = Objects.toString(body.getOrDefault("unitType", "M"));
        Object durationObj = body.get("durationMonths");
        int duration = durationObj instanceof Number ? ((Number) durationObj).intValue() : 1;

        Map<String, Object> result = reservationService.calculateCost(unitType, duration);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Reservation>> createReservation(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        Reservation rsv = reservationService.createReservation(principal.getUsername(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(rsv));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Reservation>> assignUnit(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            Reservation updated = reservationService.assignUnit(principal.getUsername(), id, body.get("unitCode"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Reservation>> cancelReservation(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
                reservationService.cancelReservation(principal.getUsername(), id)));
    }
}
