package com.swp391.selfstorage.modules.reservation.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

  @Id
  @Column(name = "id", length = 50)
  private String id;

  @Column(name = "user_id")
  private String userId;

  @Column(name = "customer_name", nullable = false)
  private String customerName;

  @Column(name = "customer_phone")
  private String customerPhone;

  @Column(name = "facility_code")
  private String facilityCode;

  @Column(name = "unit_type", nullable = false)
  private String unitType;

  @Column(name = "unit_code")
  private String unitCode;

  @Column(name = "duration_months")
  private Integer durationMonths = 1;

  @Column(name = "start_date")
  private LocalDate startDate = LocalDate.now();

  @Column(name = "deposit_amount")
  private BigDecimal depositAmount = BigDecimal.ZERO;

  @Column(name = "status")
  private String status = "PENDING_PAYMENT"; // PENDING_PAYMENT, RESERVED, CHECKED_IN, CANCELLED, EXPIRED

  @Column(name = "appointment")
  private String appointment;

  @Column(name = "created_at")
  private LocalDateTime createdAt = LocalDateTime.now();

  public Reservation() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
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

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String facilityCode) {
    this.facilityCode = facilityCode;
  }

  public String getUnitType() {
    return unitType;
  }

  public void setUnitType(String unitType) {
    this.unitType = unitType;
  }

  public String getUnitCode() {
    return unitCode;
  }

  public void setUnitCode(String unitCode) {
    this.unitCode = unitCode;
  }

  public Integer getDurationMonths() {
    return durationMonths;
  }

  public void setDurationMonths(Integer durationMonths) {
    this.durationMonths = durationMonths;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public BigDecimal getDepositAmount() {
    return depositAmount;
  }

  public void setDepositAmount(BigDecimal depositAmount) {
    this.depositAmount = depositAmount;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getAppointment() {
    return appointment;
  }

  public void setAppointment(String appointment) {
    this.appointment = appointment;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Column(name = "appointment_at")
  private java.time.LocalDateTime appointmentAt;

  public java.time.LocalDateTime getAppointmentAt() {
    return appointmentAt;
  }

  public void setAppointmentAt(java.time.LocalDateTime value) {
    this.appointmentAt = value;
  }

  @Column(name = "approved_appointment_at")
  private java.time.LocalDateTime approvedAppointmentAt;

  public java.time.LocalDateTime getApprovedAppointmentAt() {
    return approvedAppointmentAt;
  }

  public void setApprovedAppointmentAt(java.time.LocalDateTime value) {
    this.approvedAppointmentAt = value;
  }

  @Column(name = "hold_until")
  private java.time.LocalDateTime holdUntil;

  public java.time.LocalDateTime getHoldUntil() {
    return holdUntil;
  }

  public void setHoldUntil(java.time.LocalDateTime value) {
    this.holdUntil = value;
  }

  @Column(name = "reservation_expires_at")
  private java.time.LocalDateTime reservationExpiresAt;

  public java.time.LocalDateTime getReservationExpiresAt() {
    return reservationExpiresAt;
  }

  public void setReservationExpiresAt(java.time.LocalDateTime value) {
    this.reservationExpiresAt = value;
  }

  @Column(name = "reservation_hold_days_snapshot")
  private Integer reservationHoldDaysSnapshot;

  public Integer getReservationHoldDaysSnapshot() {
    return reservationHoldDaysSnapshot;
  }

  public void setReservationHoldDaysSnapshot(Integer value) {
    this.reservationHoldDaysSnapshot = value;
  }

  @Column(name = "refund_cancel_hours_snapshot")
  private Integer refundCancelHoursSnapshot;

  public Integer getRefundCancelHoursSnapshot() {
    return refundCancelHoursSnapshot;
  }

  public void setRefundCancelHoursSnapshot(Integer value) {
    this.refundCancelHoursSnapshot = value;
  }

  @Column(name = "arrived_at")
  private java.time.LocalDateTime arrivedAt;

  public java.time.LocalDateTime getArrivedAt() {
    return arrivedAt;
  }

  public void setArrivedAt(java.time.LocalDateTime value) {
    this.arrivedAt = value;
  }

  @Column(name = "no_show_alert_at")
  private java.time.LocalDateTime noShowAlertAt;

  public java.time.LocalDateTime getNoShowAlertAt() {
    return noShowAlertAt;
  }

  public void setNoShowAlertAt(java.time.LocalDateTime value) {
    this.noShowAlertAt = value;
  }

  @Column(name = "extension_minutes")
  private Integer extensionMinutes;

  public Integer getExtensionMinutes() {
    return extensionMinutes;
  }

  public void setExtensionMinutes(Integer value) {
    this.extensionMinutes = value;
  }

  @Column(name = "extension_used")
  private Boolean extensionUsed;

  public Boolean getExtensionUsed() {
    return extensionUsed;
  }

  public void setExtensionUsed(Boolean value) {
    this.extensionUsed = value;
  }

  @Column(name = "incident_open")
  private Boolean incidentOpen;

  public Boolean getIncidentOpen() {
    return incidentOpen;
  }

  public void setIncidentOpen(Boolean value) {
    this.incidentOpen = value;
  }

  @Column(name = "exception_reason")
  private String exceptionReason;

  public String getExceptionReason() {
    return exceptionReason;
  }

  public void setExceptionReason(String value) {
    this.exceptionReason = value;
  }

  @Column(name = "monthly_price_snapshot")
  private java.math.BigDecimal monthlyPriceSnapshot;

  public java.math.BigDecimal getMonthlyPriceSnapshot() {
    return monthlyPriceSnapshot;
  }

  public void setMonthlyPriceSnapshot(java.math.BigDecimal value) {
    this.monthlyPriceSnapshot = value;
  }

  @Column(name = "schedule_approved_by")
  private String scheduleApprovedBy;

  public String getScheduleApprovedBy() {
    return scheduleApprovedBy;
  }

  public void setScheduleApprovedBy(String value) {
    this.scheduleApprovedBy = value;
  }

  @Column(name = "rental_start_at")
  private java.time.LocalDateTime rentalStartAt;

  public java.time.LocalDateTime getRentalStartAt() {
    return rentalStartAt;
  }

  public void setRentalStartAt(java.time.LocalDateTime v) {
    rentalStartAt = v;
  }

  @Column(name = "contract_terms_accepted_at")
  private java.time.LocalDateTime contractTermsAcceptedAt;

  public java.time.LocalDateTime getContractTermsAcceptedAt() { return contractTermsAcceptedAt; }

  public void setContractTermsAcceptedAt(java.time.LocalDateTime value) { contractTermsAcceptedAt = value; }

  @Column(name = "contract_terms_version")
  private String contractTermsVersion;

  public String getContractTermsVersion() { return contractTermsVersion; }

  public void setContractTermsVersion(String value) { contractTermsVersion = value; }

  @Column(name = "identity_verified_at")
  private java.time.LocalDateTime identityVerifiedAt;

  public java.time.LocalDateTime getIdentityVerifiedAt() { return identityVerifiedAt; }

  public void setIdentityVerifiedAt(java.time.LocalDateTime value) { identityVerifiedAt = value; }

  @Column(name = "identity_verified_by")
  private String identityVerifiedBy;

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getIdentityVerifiedBy() { return identityVerifiedBy; }

  public void setIdentityVerifiedBy(String value) { identityVerifiedBy = value; }

  @Column(name = "contract_terms_snapshot", columnDefinition = "text")
  private String contractTermsSnapshot;

  public String getContractTermsSnapshot() { return contractTermsSnapshot; }

  public void setContractTermsSnapshot(String value) { contractTermsSnapshot = value; }

  @Column(name = "cancelled_at")
  private java.time.LocalDateTime cancelledAt;

  public java.time.LocalDateTime getCancelledAt() {
    return cancelledAt;
  }

  public void setCancelledAt(java.time.LocalDateTime v) {
    cancelledAt = v;
  }
}
