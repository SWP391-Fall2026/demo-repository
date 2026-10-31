package com.swp391.selfstorage.modules.rental.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_inspection_disputes")
public class ReturnInspectionDispute {

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "inspection_id", nullable = false)
  private String inspectionId;

  @Column(name = "contract_id", nullable = false)
  private String contractId;

  @Column(name = "facility_code", nullable = false)
  private String facilityCode;

  @Column(name = "customer_id", nullable = false)
  private String customerId;

  @Column(name = "reason", nullable = false, columnDefinition = "text")
  private String reason;

  @JsonIgnore
  @Column(name = "evidence_path", nullable = false)
  private String evidencePath;

  @Column(name = "evidence_content_type", nullable = false)
  private String evidenceContentType;

  @Column(name = "status", nullable = false)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "manager_id")
  private String managerId;

  @Column(name = "manager_note", columnDefinition = "text")
  private String managerNote;

  @Column(name = "proposed_deduction")
  private BigDecimal proposedDeduction;

  @Column(name = "decided_at")
  private LocalDateTime decidedAt;

  @Transient
  private BigDecimal maximumDeduction;

  @Transient
  private String unitCode;

  @Transient
  private BigDecimal depositAmount;

  @Transient
  private BigDecimal currentDeduction;

  @Transient
  private BigDecimal repairFee;

  @Transient
  private String cleanlinessStatus;

  @Transient
  private String damageNotes;

  @Transient
  private boolean inspectionEvidenceAvailable;

  public String getId() { return id; }
  public void setId(String value) { id = value; }
  public String getInspectionId() { return inspectionId; }
  public void setInspectionId(String value) { inspectionId = value; }
  public String getContractId() { return contractId; }
  public void setContractId(String value) { contractId = value; }
  public String getFacilityCode() { return facilityCode; }
  public void setFacilityCode(String value) { facilityCode = value; }
  public String getCustomerId() { return customerId; }
  public void setCustomerId(String value) { customerId = value; }
  public String getReason() { return reason; }
  public void setReason(String value) { reason = value; }
  public String getEvidencePath() { return evidencePath; }
  public void setEvidencePath(String value) { evidencePath = value; }
  public String getEvidenceContentType() { return evidenceContentType; }
  public void setEvidenceContentType(String value) { evidenceContentType = value; }
  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime value) { createdAt = value; }
  public String getManagerId() { return managerId; }
  public void setManagerId(String value) { managerId = value; }
  public String getManagerNote() { return managerNote; }
  public void setManagerNote(String value) { managerNote = value; }
  public BigDecimal getProposedDeduction() { return proposedDeduction; }
  public void setProposedDeduction(BigDecimal value) { proposedDeduction = value; }
  public LocalDateTime getDecidedAt() { return decidedAt; }
  public void setDecidedAt(LocalDateTime value) { decidedAt = value; }
  public BigDecimal getMaximumDeduction() { return maximumDeduction; }
  public void setMaximumDeduction(BigDecimal value) { maximumDeduction = value; }
  public String getUnitCode() { return unitCode; }
  public void setUnitCode(String value) { unitCode = value; }
  public BigDecimal getDepositAmount() { return depositAmount; }
  public void setDepositAmount(BigDecimal value) { depositAmount = value; }
  public BigDecimal getCurrentDeduction() { return currentDeduction; }
  public void setCurrentDeduction(BigDecimal value) { currentDeduction = value; }
  public BigDecimal getRepairFee() { return repairFee; }
  public void setRepairFee(BigDecimal value) { repairFee = value; }
  public String getCleanlinessStatus() { return cleanlinessStatus; }
  public void setCleanlinessStatus(String value) { cleanlinessStatus = value; }
  public String getDamageNotes() { return damageNotes; }
  public void setDamageNotes(String value) { damageNotes = value; }
  public boolean isInspectionEvidenceAvailable() { return inspectionEvidenceAvailable; }
  public void setInspectionEvidenceAvailable(boolean value) { inspectionEvidenceAvailable = value; }
}
