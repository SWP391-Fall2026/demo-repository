package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.AuditLog;
import com.swp391.selfstorage.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getLogs() {
        List<AuditLog> list = auditLogService.getLogs();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AuditLog>> createLog(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        AuditLog log = auditLogService.createLog(principal.getUsername(), body, ip);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(log));
    }
}
