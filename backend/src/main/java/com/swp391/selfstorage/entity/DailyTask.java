package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_tasks")
public class DailyTask {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "staff", nullable = false)
    private String staff;

    @Column(name = "deadline")
    private String deadline;

    @Column(name = "status")
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public DailyTask() {}

    public DailyTask(String id, String title, String staff, String deadline, String status) {
        this.id = id;
        this.title = title;
        this.staff = staff;
        this.deadline = deadline;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStaff() { return staff; }
    public void setStaff(String staff) { this.staff = staff; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
