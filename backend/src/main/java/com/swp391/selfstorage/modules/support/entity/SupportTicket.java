package com.swp391.selfstorage.modules.support.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "unit_code")
  private String unitCode;

  @Column(name = "customer_name")
  private String customerName;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "priority")
  private String priority = "NORMAL"; // URGENT, HIGH, NORMAL, LOW

  @Column(name = "status")
  private String status = "IN_PROGRESS"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

  @Column(name = "staff_assigned")
  private String staffAssigned;

  @Column(name = "notes")
  private String notes;

  @Column(name = "created_at")
  private LocalDateTime createdAt = LocalDateTime.now();

  public SupportTicket() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUnitCode() {
    return unitCode;
  }

  public void setUnitCode(String unitCode) {
    this.unitCode = unitCode;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getPriority() {
    return priority;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getStaffAssigned() {
    return staffAssigned;
  }

  public void setStaffAssigned(String staffAssigned) {
    this.staffAssigned = staffAssigned;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Column(name = "user_id")
  private String userId;

  public String getUserId() {
    return userId;
  }

  public void setUserId(String value) {
    this.userId = value;
  }

  @Column(name = "facility_code")
  private String facilityCode;

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String value) {
    this.facilityCode = value;
  }

  @Column(name = "category")
  private String category;

  public String getCategory() {
    return category;
  }

  public void setCategory(String value) {
    this.category = value;
  }

  @Column(name = "description")
  private String description;

  public String getDescription() {
    return description;
  }

  public void setDescription(String value) {
    this.description = value;
  }

  @Column(name = "attachment_url")
  private String attachmentUrl;

  public String getAttachmentUrl() {
    return attachmentUrl;
  }

  public void setAttachmentUrl(String value) {
    this.attachmentUrl = value;
  }

  @Column(name = "rating")
  private Integer rating;

  public Integer getRating() {
    return rating;
  }

  public void setRating(Integer value) {
    this.rating = value;
  }

  @Column(name = "resolved_at")
  private java.time.LocalDateTime resolvedAt;

  public java.time.LocalDateTime getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(java.time.LocalDateTime value) {
    this.resolvedAt = value;
  }
}
