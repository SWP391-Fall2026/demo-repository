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
}
