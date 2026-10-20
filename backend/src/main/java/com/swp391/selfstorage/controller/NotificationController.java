package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.Notification;
import com.swp391.selfstorage.service.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> list(@AuthenticationPrincipal UserDetails principal) {
        List<Notification> data = service.forUsername(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.list(data.size(), data));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@AuthenticationPrincipal UserDetails principal, @PathVariable String id) {
        service.markRead(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/renewal-reminder")
    @PreAuthorize("hasAnyRole('FMANAGER', 'FACILITY_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> renewalReminder(@AuthenticationPrincipal UserDetails principal, @RequestBody java.util.Map<String, String> body) {
        service.sendRenewalReminder(principal.getUsername(), body.get("contractId"));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
    }
}
