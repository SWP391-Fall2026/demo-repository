package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
public class Contract {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "reservation_id")
  private String reservationId;

  @Column(name = "user_id")
  private String userId;

  @Column(name = "customer_name", nullable = false)
  private String customerName;

  @Column(name = "customer_phone")
  private String customerPhone;

  @Column(name = "unit_code")
  private String unitCode;

  @Column(name = "facility_code")
  private String facilityCode;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  @Column(name = "duration_months")
  private Integer durationMonths = 1;

  @Column(name = "monthly_fee")
  private BigDecimal monthlyFee = BigDecimal.ZERO;

  @Column(name = "deposit_fee")
  private BigDecimal depositFee = BigDecimal.ZERO;

  @Column(name = "pin_code")
  private String pinCode;

  @Column(name = "physical_lock")
  private String physicalLock;

  @Column(name = "rfid_card")
  private String rfidCard;

  @Column(name = "status")
  private String status = "ACTIVE"; // ACTIVE, EXPIRING_SOON, OVERDUE, TERMINATED

  @Column(name = "created_at")
  private LocalDateTime createdAt = LocalDateTime.now();

  @Transient
  private String handoverStatus;

  @Transient
  private String facilityPin;

  @Transient private String handoverConditionStatus;
  @Transient private String handoverConditionNotes;
  @Transient private String handoverStaffNotes;
  @Transient private String handoverDate;
  @Transient private boolean handoverEvidenceAvailable;
  @Transient private String handoverStaffId;

  public Contract() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getReservationId() {
    return reservationId;
  }

  public void setReservationId(String reservationId) {
    this.reservationId = reservationId;
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

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public LocalDate getEndDate() {
    return endDate;
  }

  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  public Integer getDurationMonths() {
    return durationMonths;
  }

  public void setDurationMonths(Integer durationMonths) {
    this.durationMonths = durationMonths;
  }

  public BigDecimal getMonthlyFee() {
    return monthlyFee;
  }

  public void setMonthlyFee(BigDecimal monthlyFee) {
    this.monthlyFee = monthlyFee;
  }

  public BigDecimal getDepositFee() {
    return depositFee;
  }

  public void setDepositFee(BigDecimal depositFee) {
    this.depositFee = depositFee;
  }

  public String getPinCode() {
    return pinCode;
  }

  public void setPinCode(String pinCode) {
    this.pinCode = pinCode;
  }

  public String getPhysicalLock() {
    return physicalLock;
  }

  public void setPhysicalLock(String physicalLock) {
    this.physicalLock = physicalLock;
  }

  public String getRfidCard() {
    return rfidCard;
  }

  public void setRfidCard(String rfidCard) {
    this.rfidCard = rfidCard;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getHandoverStatus() { return handoverStatus; }

  public void setHandoverStatus(String value) { handoverStatus = value; }

  public String getFacilityPin() { return facilityPin; }

  public void setFacilityPin(String value) { facilityPin = value; }

  public String getHandoverConditionNotes() { return handoverConditionNotes; }
  public void setHandoverConditionNotes(String value) { handoverConditionNotes = value; }
  public String getHandoverStaffNotes() { return handoverStaffNotes; }
  public void setHandoverStaffNotes(String value) { handoverStaffNotes = value; }
  public String getHandoverConditionStatus() { return handoverConditionStatus; }
  public void setHandoverConditionStatus(String value) { handoverConditionStatus = value; }
  public String getHandoverDate() { return handoverDate; }
  public void setHandoverDate(String value) { handoverDate = value; }
  public boolean isHandoverEvidenceAvailable() { return handoverEvidenceAvailable; }
  public void setHandoverEvidenceAvailable(boolean value) { handoverEvidenceAvailable = value; }
  public String getHandoverStaffId() { return handoverStaffId; }
  public void setHandoverStaffId(String value) { handoverStaffId = value; }

  @Column(name = "checkout_requested_at")
  private java.time.LocalDateTime checkoutRequestedAt;

  public java.time.LocalDateTime getCheckoutRequestedAt() {
    return checkoutRequestedAt;
  }

  public void setCheckoutRequestedAt(java.time.LocalDateTime value) {
    this.checkoutRequestedAt = value;
  }

  @Column(name = "checkout_requested_date")
  private java.time.LocalDate checkoutRequestedDate;

  public java.time.LocalDate getCheckoutRequestedDate() {
    return checkoutRequestedDate;
  }

  public void setCheckoutRequestedDate(java.time.LocalDate value) {
    this.checkoutRequestedDate = value;
  }

  @Column(name = "checkout_reason")
  private String checkoutReason;

  public String getCheckoutReason() {
    return checkoutReason;
  }

  public void setCheckoutReason(String value) {
    this.checkoutReason = value;
  }

  @Column(name = "last_renewal_at")
  private java.time.LocalDateTime lastRenewalAt;

  public java.time.LocalDateTime getLastRenewalAt() {
    return lastRenewalAt;
  }

  public void setLastRenewalAt(java.time.LocalDateTime value) {
    this.lastRenewalAt = value;
  }

  @Column(name = "start_at")
  private java.time.LocalDateTime startAt;

  public java.time.LocalDateTime getStartAt() {
    return startAt;
  }

  public void setStartAt(java.time.LocalDateTime v) {
    startAt = v;
  }

  @Column(name = "end_at")
  private java.time.LocalDateTime endAt;

  public java.time.LocalDateTime getEndAt() {
    return endAt;
  }

  public void setEndAt(java.time.LocalDateTime v) {
    endAt = v;
  }

  @Column(name = "terminated_at")
  private java.time.LocalDateTime terminatedAt;

  public java.time.LocalDateTime getTerminatedAt() {
    return terminatedAt;
  }

  public void setTerminatedAt(java.time.LocalDateTime v) {
    terminatedAt = v;
  }
}
