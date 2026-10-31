package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "inspection_records")
public class InspectionRecord {

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "contract_id")
  private String contractId;

  @Column(name = "staff_id")
  private String staffId;

  @Column(name = "inspection_date")
  private LocalDateTime inspectionDate;

  @Column(name = "cleanliness_status")
  private String cleanlinessStatus;

  @Column(name = "damage_notes")
  private String damageNotes;

  @Column(name = "goods_cleared")
  private Boolean goodsCleared;

  @Column(name = "repair_fee")
  private BigDecimal repairFee;

  @Column(name = "penalty_fee")
  private BigDecimal penaltyFee;

  @Column(name = "original_penalty_fee")
  private BigDecimal originalPenaltyFee;

  @Column(name = "deposit_refund_amount")
  private BigDecimal depositRefundAmount;

  @Column(name = "is_cleared")
  private Boolean isCleared;

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

  public String getStaffId() {
    return staffId;
  }

  public void setStaffId(String value) {
    this.staffId = value;
  }

  public LocalDateTime getInspectionDate() {
    return inspectionDate;
  }

  public void setInspectionDate(LocalDateTime value) {
    this.inspectionDate = value;
  }

  public String getCleanlinessStatus() {
    return cleanlinessStatus;
  }

  public void setCleanlinessStatus(String value) {
    this.cleanlinessStatus = value;
  }

  public String getDamageNotes() {
    return damageNotes;
  }

  public void setDamageNotes(String value) {
    this.damageNotes = value;
  }

  public Boolean getGoodsCleared() {
    return goodsCleared;
  }

  public void setGoodsCleared(Boolean value) {
    this.goodsCleared = value;
  }

  public BigDecimal getRepairFee() {
    return repairFee;
  }

  public void setRepairFee(BigDecimal value) {
    this.repairFee = value;
  }

  public BigDecimal getPenaltyFee() {
    return penaltyFee;
  }

  public void setPenaltyFee(BigDecimal value) {
    this.penaltyFee = value;
  }

  public BigDecimal getOriginalPenaltyFee() {
    return originalPenaltyFee;
  }

  public void setOriginalPenaltyFee(BigDecimal value) {
    this.originalPenaltyFee = value;
  }

  public BigDecimal getDepositRefundAmount() {
    return depositRefundAmount;
  }

  public void setDepositRefundAmount(BigDecimal value) {
    this.depositRefundAmount = value;
  }

  public Boolean getIsCleared() {
    return isCleared;
  }

  public void setIsCleared(Boolean value) {
    this.isCleared = value;
  }

  @Column(name = "status")
  private String status = "PENDING_CONFIRM";

  public String getStatus() {
    return status;
  }

  public void setStatus(String value) {
    this.status = value;
  }

  @Column(name = "customer_confirmed_at")
  private LocalDateTime customerConfirmedAt;

  @Column(name = "evidence_path")
  @com.fasterxml.jackson.annotation.JsonIgnore
  private String evidencePath;

  @Column(name = "evidence_content_type")
  private String evidenceContentType;

  public LocalDateTime getCustomerConfirmedAt() {
    return customerConfirmedAt;
  }

  public void setCustomerConfirmedAt(LocalDateTime value) {
    this.customerConfirmedAt = value;
  }

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(LocalDateTime value) {
    this.completedAt = value;
  }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEvidencePath() {
    return evidencePath;
  }

  public void setEvidencePath(String value) {
    this.evidencePath = value;
  }

  public String getEvidenceContentType() {
    return evidenceContentType;
  }

  public void setEvidenceContentType(String value) {
    this.evidenceContentType = value;
  }
}
