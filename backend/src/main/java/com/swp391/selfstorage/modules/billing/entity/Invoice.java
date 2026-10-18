package com.swp391.selfstorage.modules.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "invoices")
public class Invoice {

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "reservation_id")
  private String reservationId;

  @Column(name = "contract_id")
  private String contractId;

  @Column(name = "user_id")
  private String userId;

  @Column(name = "facility_code")
  private String facilityCode;

  @Column(name = "invoice_type")
  private String invoiceType;

  @Column(name = "amount")
  private BigDecimal amount;

  @Column(name = "status")
  private String status;

  @Column(name = "issued_at")
  private LocalDateTime issuedAt;

  @Column(name = "due_at")
  private LocalDateTime dueAt;

  @Column(name = "description")
  private String description;

  @Column(name = "price_snapshot")
  private String priceSnapshot;

  public String getId() {
    return id;
  }

  public void setId(String value) {
    this.id = value;
  }

  public String getReservationId() {
    return reservationId;
  }

  public void setReservationId(String value) {
    this.reservationId = value;
  }

  public String getContractId() {
    return contractId;
  }

  public void setContractId(String value) {
    this.contractId = value;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String value) {
    this.userId = value;
  }

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String value) {
    this.facilityCode = value;
  }

  public String getInvoiceType() {
    return invoiceType;
  }

  public void setInvoiceType(String value) {
    this.invoiceType = value;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public void setAmount(BigDecimal value) {
    this.amount = value;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String value) {
    this.status = value;
  }

  public LocalDateTime getIssuedAt() {
    return issuedAt;
  }

  public void setIssuedAt(LocalDateTime value) {
    this.issuedAt = value;
  }

  public LocalDateTime getDueAt() {
    return dueAt;
  }

  public void setDueAt(LocalDateTime value) {
    this.dueAt = value;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String value) {
    this.description = value;
  }

  public String getPriceSnapshot() {
    return priceSnapshot;
  }

  public void setPriceSnapshot(String value) {
    this.priceSnapshot = value;
  }
}
