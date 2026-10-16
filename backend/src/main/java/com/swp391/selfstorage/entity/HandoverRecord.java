package com.swp391.selfstorage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "handover_records")
public class HandoverRecord {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "contract_id", nullable = false, length = 50)
    private String contractId;

    @Column(name = "reservation_id", nullable = false, length = 50)
    private String reservationId;

    @Column(name = "staff_id", nullable = false, length = 50)
    private String staffId;

    @Column(name = "handover_date", nullable = false)
    private LocalDateTime handoverDate;

    @Column(name = "lock_type", length = 80)
    private String lockType;

    @Column(name = "unit_condition_notes", columnDefinition = "TEXT")
    private String unitConditionNotes;

    @Column(name = "customer_signature_confirmed", nullable = false)
    private boolean customerSignatureConfirmed;

    public HandoverRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public LocalDateTime getHandoverDate() { return handoverDate; }
    public void setHandoverDate(LocalDateTime handoverDate) { this.handoverDate = handoverDate; }
    public String getLockType() { return lockType; }
    public void setLockType(String lockType) { this.lockType = lockType; }
    public String getUnitConditionNotes() { return unitConditionNotes; }
    public void setUnitConditionNotes(String unitConditionNotes) { this.unitConditionNotes = unitConditionNotes; }
    public boolean isCustomerSignatureConfirmed() { return customerSignatureConfirmed; }
    public void setCustomerSignatureConfirmed(boolean customerSignatureConfirmed) {
        this.customerSignatureConfirmed = customerSignatureConfirmed;
    }
}