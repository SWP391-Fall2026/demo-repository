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

  @Column(name = "customer_signature_confirmed")
  private Boolean customerSignatureConfirmed;

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

  public Boolean getCustomerSignatureConfirmed() {
    return customerSignatureConfirmed;
  }

  public void setCustomerSignatureConfirmed(Boolean value) {
    this.customerSignatureConfirmed = value;
  }
}
