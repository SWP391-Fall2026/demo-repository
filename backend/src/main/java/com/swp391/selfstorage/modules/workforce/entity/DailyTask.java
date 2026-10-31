package com.swp391.selfstorage.modules.workforce.entity;

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

  public DailyTask(
    String id,
    String title,
    String staff,
    String deadline,
    String status
  ) {
    this.id = id;
    this.title = title;
    this.staff = staff;
    this.deadline = deadline;
    this.status = status;
    this.createdAt = LocalDateTime.now();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getStaff() {
    return staff;
  }

  public void setStaff(String staff) {
    this.staff = staff;
  }

  public String getDeadline() {
    return deadline;
  }

  public void setDeadline(String deadline) {
    this.deadline = deadline;
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

  @Column(name = "staff_id")
  private String staffId;

  public String getStaffId() {
    return staffId;
  }

  public void setStaffId(String value) {
    this.staffId = value;
  }

  @Column(name = "facility_code")
  private String facilityCode;

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String value) {
    this.facilityCode = value;
  }

  @Column(name = "reservation_id")
  private String reservationId;

  public String getReservationId() {
    return reservationId;
  }

  public void setReservationId(String value) {
    this.reservationId = value;
  }

  @Column(name = "contract_id")
  private String contractId;

  public String getContractId() {
    return contractId;
  }

  public void setContractId(String value) {
    this.contractId = value;
  }

  @Column(name = "unit_code")
  private String unitCode;

  public String getUnitCode() {
    return unitCode;
  }

  public void setUnitCode(String value) {
    this.unitCode = value;
  }

  @Column(name = "task_type")
  private String taskType;

  public String getTaskType() {
    return taskType;
  }

  public void setTaskType(String value) {
    this.taskType = value;
  }

  @Column(name = "due_date")
  private java.time.LocalDate dueDate;

  public java.time.LocalDate getDueDate() {
    return dueDate;
  }

  public void setDueDate(java.time.LocalDate value) {
    this.dueDate = value;
  }

  @Transient private String customerName;
  @Transient private String customerPhone;
  @Transient private java.time.LocalDate checkoutRequestedDate;
  @Transient private String checkoutReason;
  @Transient private String unitType;
  @Transient private String inspectionStatus;
  @Transient private java.math.BigDecimal inspectionPenaltyFee;
  @Transient private java.math.BigDecimal inspectionRefundAmount;

  public String getCustomerName() { return customerName; }
  public void setCustomerName(String value) { customerName = value; }
  public String getCustomerPhone() { return customerPhone; }
  public void setCustomerPhone(String value) { customerPhone = value; }
  public java.time.LocalDate getCheckoutRequestedDate() { return checkoutRequestedDate; }
  public void setCheckoutRequestedDate(java.time.LocalDate value) { checkoutRequestedDate = value; }
  public String getCheckoutReason() { return checkoutReason; }
  public void setCheckoutReason(String value) { checkoutReason = value; }
  public String getUnitType() { return unitType; }
  public void setUnitType(String value) { unitType = value; }
  public String getInspectionStatus() { return inspectionStatus; }
  public void setInspectionStatus(String value) { inspectionStatus = value; }
  public java.math.BigDecimal getInspectionPenaltyFee() { return inspectionPenaltyFee; }
  public void setInspectionPenaltyFee(java.math.BigDecimal value) { inspectionPenaltyFee = value; }
  public java.math.BigDecimal getInspectionRefundAmount() { return inspectionRefundAmount; }
  public void setInspectionRefundAmount(java.math.BigDecimal value) { inspectionRefundAmount = value; }
}
