package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "handover_records")
public class HandoverRecord {

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "contract_id")
  private String contractId;

  @Column(name = "reservation_id")
  private String reservationId;

  @Column(name = "staff_id")
  private String staffId;

  @Column(name = "handover_date")
  private LocalDateTime handoverDate;

  @Column(name = "lock_type")
  private String lockType;

  @Column(name = "unit_condition_notes")
  private String unitConditionNotes;

  @Column(name = "condition_status")
  private String conditionStatus;

  @Column(name = "staff_notes", columnDefinition = "text")
  private String staffNotes;

  @Column(name = "evidence_path")
  private String evidencePath;

  @Column(name = "customer_signature_confirmed")
  private Boolean customerSignatureConfirmed;

  @Column(name = "status", nullable = false)
  private String status = "PENDING_CUSTOMER_CONFIRMATION";

  @Column(name = "customer_confirmed_at")
  private LocalDateTime customerConfirmedAt;

  @Column(name = "customer_confirmed_by")
  private String customerConfirmedBy;

  @Column(name = "confirmation_version")
  private String confirmationVersion;

  @Column(name = "customer_issue_notes", columnDefinition = "text")
  private String customerIssueNotes;

  @Column(name = "customer_issue_reported_at")
  private LocalDateTime customerIssueReportedAt;

  @Column(name = "customer_issue_reported_by")
  private String customerIssueReportedBy;

  public String getId() {
    return id;
  }

  public void setId(String value) {
    this.id = value;
  }

  public String getContractId() {
    return contractId;
  }

  public void setContractId(String value) {
    this.contractId = value;
  }

  public String getReservationId() {
    return reservationId;
  }

  public void setReservationId(String value) {
    this.reservationId = value;
  }

  public String getStaffId() {
    return staffId;
  }

  public void setStaffId(String value) {
    this.staffId = value;
  }

  public LocalDateTime getHandoverDate() {
    return handoverDate;
  }

  public void setHandoverDate(LocalDateTime value) {
    this.handoverDate = value;
  }

  public String getLockType() {
    return lockType;
  }

  public void setLockType(String value) {
    this.lockType = value;
  }

  public String getUnitConditionNotes() {
    return unitConditionNotes;
  }

  public void setUnitConditionNotes(String value) {
    this.unitConditionNotes = value;
  }

  public String getConditionStatus() { return conditionStatus; }

  public void setConditionStatus(String value) { conditionStatus = value; }
  public String getStaffNotes() { return staffNotes; }
  public void setStaffNotes(String value) { staffNotes = value; }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEvidencePath() { return evidencePath; }

  public void setEvidencePath(String value) { evidencePath = value; }

  public Boolean getCustomerSignatureConfirmed() {
    return customerSignatureConfirmed;
  }

  public void setCustomerSignatureConfirmed(Boolean value) {
    this.customerSignatureConfirmed = value;
  }

  public String getStatus() { return status; }

  public void setStatus(String value) { status = value; }

  public LocalDateTime getCustomerConfirmedAt() { return customerConfirmedAt; }

  public void setCustomerConfirmedAt(LocalDateTime value) { customerConfirmedAt = value; }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getCustomerConfirmedBy() { return customerConfirmedBy; }
  public void setCustomerConfirmedBy(String value) { customerConfirmedBy = value; }
  public String getConfirmationVersion() { return confirmationVersion; }
  public void setConfirmationVersion(String value) { confirmationVersion = value; }
  public String getCustomerIssueNotes() { return customerIssueNotes; }
  public void setCustomerIssueNotes(String value) { customerIssueNotes = value; }
  public LocalDateTime getCustomerIssueReportedAt() { return customerIssueReportedAt; }
  public void setCustomerIssueReportedAt(LocalDateTime value) { customerIssueReportedAt = value; }
  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getCustomerIssueReportedBy() { return customerIssueReportedBy; }
  public void setCustomerIssueReportedBy(String value) { customerIssueReportedBy = value; }
}
