package com.swp391.selfstorage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_records")
public class InspectionRecord {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "contract_id", nullable = false, length = 50)
    private String contractId;

    @Column(name = "staff_id", nullable = false, length = 50)
    private String staffId;

    @Column(name = "inspection_date", nullable = false)
    private LocalDateTime inspectionDate;

    @Column(name = "cleanliness_status", length = 40)
    private String cleanlinessStatus;

    @Column(name = "damage_notes", columnDefinition = "TEXT")
    private String damageNotes;

    @Column(name = "penalty_fee", nullable = false)
    private BigDecimal penaltyFee = BigDecimal.ZERO;

    @Column(name = "deposit_refund_amount", nullable = false)
    private BigDecimal depositRefundAmount = BigDecimal.ZERO;

    @Column(name = "is_cleared", nullable = false)
    private boolean cleared;

    public InspectionRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public LocalDateTime getInspectionDate() { return inspectionDate; }
    public void setInspectionDate(LocalDateTime inspectionDate) { this.inspectionDate = inspectionDate; }
    public String getCleanlinessStatus() { return cleanlinessStatus; }
    public void setCleanlinessStatus(String cleanlinessStatus) { this.cleanlinessStatus = cleanlinessStatus; }
    public String getDamageNotes() { return damageNotes; }
    public void setDamageNotes(String damageNotes) { this.damageNotes = damageNotes; }
    public BigDecimal getPenaltyFee() { return penaltyFee; }
    public void setPenaltyFee(BigDecimal penaltyFee) { this.penaltyFee = penaltyFee; }
    public BigDecimal getDepositRefundAmount() { return depositRefundAmount; }
    public void setDepositRefundAmount(BigDecimal depositRefundAmount) { this.depositRefundAmount = depositRefundAmount; }
    public boolean isCleared() { return cleared; }
    public void setCleared(boolean cleared) { this.cleared = cleared; }
}