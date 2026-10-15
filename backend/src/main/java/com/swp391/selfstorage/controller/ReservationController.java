package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Reservation>>> getAllReservations() {
        List<Reservation> list = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Reservation>> getById(@PathVariable String id) {
        Reservation rsv = reservationService.getReservationById(id);
        if (rsv == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Reservation not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(rsv));
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateCost(@RequestBody Map<String, Object> body) {
        Object monthlyRateObj = body.get("monthlyRate");
        long rate = monthlyRateObj instanceof Number ? ((Number) monthlyRateObj).longValue() : 1450000L;

        Object durationObj = body.get("durationMonths");
        int duration = durationObj instanceof Number ? ((Number) durationObj).intValue() : 1;

        Map<String, Object> result = reservationService.calculateCost(rate, duration);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Reservation>> createReservation(@RequestBody Map<String, Object> body) {
        Reservation rsv = reservationService.createReservation(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(rsv));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Reservation>> assignUnit(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            Reservation updated = reservationService.assignUnit(id, body.get("unitCode"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}
