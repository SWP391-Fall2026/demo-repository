package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "login_history")
public class LoginHistory {

    @Id
    @Column(name = "id", nullable = false, length = 100)
    private String id;

    @Column(name = "username")
    private String username;

    @Column(name = "name")
    private String name;

    @Column(name = "role")
    private String role;

    @Column(name = "time_str")
    private String time;

    @Column(name = "ip")
    private String ip;

    @Column(name = "device")
    private String device;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public LoginHistory() {}

    public LoginHistory(String username, String name, String role, String time, String ip, String device, String status) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
        this.name = name;
        this.role = role;
        this.time = time;
        this.ip = ip;
        this.device = device;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    private void ensureId() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
