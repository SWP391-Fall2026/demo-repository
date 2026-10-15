package com.swp391.selfstorage.controller;

import com.swp391.selfstorage.dto.ApiResponse;
import com.swp391.selfstorage.entity.AuditLog;
import com.swp391.selfstorage.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<List<AuditLog>>> getLogs() {
        List<AuditLog> list = auditLogService.getLogs();
        return ResponseEntity.ok(ApiResponse.list(list.size(), list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AuditLog>> createLog(@RequestBody Map<String, Object> body) {
        AuditLog log = auditLogService.createLog(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(log));
    }
}
