package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Keep entity mapping aligned with docs/supabase_schema.sql.
    @Column(name = "time_display")
    private String timeStr;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "role")
    private String role;

    @Column(name = "action")
    private String action;

    @Column(name = "detail", length = 1000)
    private String detail;

    @Column(name = "ip_address")
    private String ip;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String timeStr, String userName, String role, String action, String detail, String ip, String status) {
        this.timeStr = timeStr;
        this.userName = userName;
        this.role = role;
        this.action = action;
        this.detail = detail;
        this.ip = ip;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTimeStr() { return timeStr; }
    public void setTimeStr(String timeStr) { this.timeStr = timeStr; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
