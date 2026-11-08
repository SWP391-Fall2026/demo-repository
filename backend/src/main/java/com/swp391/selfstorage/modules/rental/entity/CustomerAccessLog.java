package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_access_logs")
public class CustomerAccessLog {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "contract_id", length = 50, nullable = false)
  private String contractId;

  @Column(name = "unit_code", length = 50, nullable = false)
  private String unitCode;

  @Column(name = "facility_code", length = 20, nullable = false)
  private String facilityCode;

  @Column(name = "user_id", length = 50, nullable = false)
  private String userId;

  @Column(name = "customer_name", length = 100, nullable = false)
  private String customerName;

  @Column(name = "customer_phone", length = 20)
  private String customerPhone;

  @Column(name = "access_type", length = 20, nullable = false)
  private String accessType = "ENTRY"; // ENTRY, EXIT, SIMULATION

  @Column(name = "access_method", length = 30, nullable = false)
  private String accessMethod = "PIN_CODE"; // PIN_CODE, QR_SCAN, RFID_CARD

  @Column(name = "status", length = 20, nullable = false)
  private String status = "GRANTED"; // GRANTED, DENIED

  @Column(name = "deny_reason", length = 100)
  private String denyReason;

  @Column(name = "checkin_at")
  private LocalDateTime checkinAt;

  @Column(name = "checkout_at")
  private LocalDateTime checkoutAt;

  @Column(name = "duration_minutes")
  private Integer durationMinutes;

  @Column(name = "notes", length = 255)
  private String notes;

  @Column(name = "created_at")
  private LocalDateTime createdAt = LocalDateTime.now();

  public CustomerAccessLog() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getContractId() {
    return contractId;
  }

  public void setContractId(String contractId) {
    this.contractId = contractId;
  }

  public String getUnitCode() {
    return unitCode;
  }

  public void setUnitCode(String unitCode) {
    this.unitCode = unitCode;
  }

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String facilityCode) {
    this.facilityCode = facilityCode;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getCustomerPhone() {
    return customerPhone;
  }

  public void setCustomerPhone(String customerPhone) {
    this.customerPhone = customerPhone;
  }

  public String getAccessType() {
    return accessType;
  }

  public void setAccessType(String accessType) {
    this.accessType = accessType;
  }

  public String getAccessMethod() {
    return accessMethod;
  }

  public void setAccessMethod(String accessMethod) {
    this.accessMethod = accessMethod;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getDenyReason() {
    return denyReason;
  }

  public void setDenyReason(String denyReason) {
    this.denyReason = denyReason;
  }

  public LocalDateTime getCheckinAt() {
    return checkinAt;
  }

  public void setCheckinAt(LocalDateTime checkinAt) {
    this.checkinAt = checkinAt;
  }

  public LocalDateTime getCheckoutAt() {
    return checkoutAt;
  }

  public void setCheckoutAt(LocalDateTime checkoutAt) {
    this.checkoutAt = checkoutAt;
  }

  public Integer getDurationMinutes() {
    return durationMinutes;
  }

  public void setDurationMinutes(Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
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
}

