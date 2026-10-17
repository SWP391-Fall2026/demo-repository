package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.AuditLog;
import com.swp391.selfstorage.repository.AuditLogRepository;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public List<AuditLog> getLogs() {
        return auditLogRepository.findAllByOrderByIdDesc();
    }

    public AuditLog createLog(String username, Map<String, Object> data, String requestIp) {
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")) + " Hôm nay";
        String action = text(data.get("action"), "EVENT");
        String detail = text(data.get("detail"), "");
        String status = text(data.get("status"), "SUCCESS");

        // Identity and role come from authenticated principal, never request payload.
        AuditLog log = new AuditLog(timeStr, actor.getName(), actor.getRole(), action, detail,
                requestIp == null || requestIp.isBlank() ? "unknown" : requestIp, status);
        return auditLogRepository.save(log);
    }

    private static String text(Object value, String fallback) {
        return value == null || value.toString().isBlank() ? fallback : value.toString().trim();
    }
}
