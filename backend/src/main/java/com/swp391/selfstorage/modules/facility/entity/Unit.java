package com.swp391.selfstorage.modules.facility.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "units")
public class Unit {

  @Id
  @Column(name = "code", length = 50)
  private String code;

  @Column(name = "facility_code", length = 50)
  private String facilityCode;

  @Column(name = "type", nullable = false)
  private String type; // S, M, L, CLIMATE

  @Column(name = "size_desc")
  private String sizeDesc;

  @Column(name = "size_sqm", nullable = false)
  private BigDecimal sizeSqm;

  @Column(name = "price_per_month", nullable = false)
  private BigDecimal pricePerMonth;

  @Column(name = "status", nullable = false)
  private String status = "available"; // available, reserved, occupied, cleaning, maintenance

  @Column(name = "tenant_name")
  private String tenantName;

  @Column(name = "pin_code")
  private String pinCode;

  public Unit() {}

  public Unit(
    String code,
    String facilityCode,
    String type,
    String sizeDesc,
    BigDecimal sizeSqm,
    BigDecimal pricePerMonth,
    String status,
    String tenantName,
    String pinCode
  ) {
    this.code = code;
    this.facilityCode = facilityCode;
    this.type = type;
    this.sizeDesc = sizeDesc;
    this.sizeSqm = sizeSqm;
    this.pricePerMonth = pricePerMonth;
    this.status = status;
    this.tenantName = tenantName;
    this.pinCode = pinCode;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String facilityCode) {
    this.facilityCode = facilityCode;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getSizeDesc() {
    return sizeDesc;
  }

  public void setSizeDesc(String sizeDesc) {
    this.sizeDesc = sizeDesc;
  }

  public BigDecimal getSizeSqm() {
    return sizeSqm;
  }

  public void setSizeSqm(BigDecimal sizeSqm) {
    this.sizeSqm = sizeSqm;
  }

  public BigDecimal getPricePerMonth() {
    return pricePerMonth;
  }

  public void setPricePerMonth(BigDecimal pricePerMonth) {
    this.pricePerMonth = pricePerMonth;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getTenantName() {
    return tenantName;
  }

  public void setTenantName(String tenantName) {
    this.tenantName = tenantName;
  }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getPinCode() {
    return pinCode;
  }

  public void setPinCode(String pinCode) {
    this.pinCode = pinCode;
  }

  @Column(name = "floor")
  private Integer floor;

  public Integer getFloor() {
    return floor;
  }

  public void setFloor(Integer value) {
    this.floor = value;
  }

  @Column(name = "temporary_pin")
  private String temporaryPin;

  public String getTemporaryPin() {
    return temporaryPin;
  }

  public void setTemporaryPin(String value) {
    this.temporaryPin = value;
  }

  @Column(name = "temporary_pin_expires_at")
  private java.time.LocalDateTime temporaryPinExpiresAt;

  public java.time.LocalDateTime getTemporaryPinExpiresAt() {
    return temporaryPinExpiresAt;
  }

  public void setTemporaryPinExpiresAt(java.time.LocalDateTime value) {
    this.temporaryPinExpiresAt = value;
  }

  @Column(name = "held_by_reservation_id")
  private String heldByReservationId;

  public String getHeldByReservationId() {
    return heldByReservationId;
  }

  public void setHeldByReservationId(String value) {
    this.heldByReservationId = value;
  }

  @Column(name = "readiness_status")
  private String readinessStatus;

  public String getReadinessStatus() {
    return readinessStatus;
  }

  public void setReadinessStatus(String value) {
    this.readinessStatus = value;
  }

  @Column(name = "readiness_requested_by")
  private String readinessRequestedBy;

  public String getReadinessRequestedBy() {
    return readinessRequestedBy;
  }

  public void setReadinessRequestedBy(String value) {
    this.readinessRequestedBy = value;
  }

  @Column(name = "readiness_notes")
  private String readinessNotes;

  public String getReadinessNotes() {
    return readinessNotes;
  }

  public void setReadinessNotes(String value) {
    this.readinessNotes = value;
  }
}
