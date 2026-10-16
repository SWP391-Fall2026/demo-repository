package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "facility_code", length = 50)
    private String facilityCode;

    @Column(name = "unit_code")
    private String unitCode;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category")
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "priority")
    private String priority = "NORMAL"; // URGENT, HIGH, NORMAL, LOW

    @Column(name = "status")
    private String status = "IN_PROGRESS"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @Column(name = "staff_assigned")
    private String staffAssigned;

    @Column(name = "notes")
    private String notes;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public SupportTicket() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStaffAssigned() { return staffAssigned; }
    public void setStaffAssigned(String staffAssigned) { this.staffAssigned = staffAssigned; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
