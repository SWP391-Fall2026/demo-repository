package com.swp391.selfstorage.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getServices() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "ok");
        resp.put("framework", "Spring Boot 3.3.4 (Java 21)");

        List<Map<String, String>> services = new ArrayList<>();
        services.add(Map.of("name", "Auth & User Service", "endpoint", "/api/auth"));
        services.add(Map.of("name", "Facility & Unit Service", "endpoint", "/api/facilities"));
        services.add(Map.of("name", "Reservation Service", "endpoint", "/api/reservations"));
        services.add(Map.of("name", "Payment Service", "endpoint", "/api/payments"));
        services.add(Map.of("name", "Contract & Handover Service", "endpoint", "/api/contracts"));
        services.add(Map.of("name", "Task & Incident Service", "endpoint", "/api/tasks"));
        services.add(Map.of("name", "Policy & Analytics Service", "endpoint", "/api/policies"));
        services.add(Map.of("name", "Audit Log Service", "endpoint", "/api/audit-logs"));

        resp.put("services", services);
        return ResponseEntity.ok(resp);
    }
}
