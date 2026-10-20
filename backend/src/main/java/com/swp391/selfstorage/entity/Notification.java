package com.swp391.selfstorage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @Column(length = 80)
    private String id = UUID.randomUUID().toString();
    @Column(name = "user_id", nullable = false)
    private String userId;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false, length = 2000)
    private String message;
    @Column(nullable = false)
    private String type;
    @Column(name = "reference_id")
    private String referenceId;
    @Column(nullable = false)
    private boolean read;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}
    public Notification(String userId, String title, String message, String type, String referenceId) {
        this.userId = userId; this.title = title; this.message = message; this.type = type; this.referenceId = referenceId;
    }
    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public String getReferenceId() { return referenceId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
