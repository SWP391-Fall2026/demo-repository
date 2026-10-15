package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.AuditLog;
import com.swp391.selfstorage.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getLogs() {
        return auditLogRepository.findAllByOrderByIdDesc();
    }

    public AuditLog createLog(Map<String, Object> data) {
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")) + " Hôm nay";
        String user = (String) data.getOrDefault("user", "Anonymous");
        String role = (String) data.getOrDefault("role", "SYSTEM");
        String action = (String) data.getOrDefault("action", "EVENT");
        String detail = (String) data.getOrDefault("detail", "");
        String ip = (String) data.getOrDefault("ip", "192.168.1.1");
        String status = (String) data.getOrDefault("status", "SUCCESS");

        AuditLog log = new AuditLog(timeStr, user, role, action, detail, ip, status);
        return auditLogRepository.save(log);
    }
}
