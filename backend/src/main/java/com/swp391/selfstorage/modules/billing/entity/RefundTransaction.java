package com.swp391.selfstorage.modules.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "refund_transactions")
public class RefundTransaction {

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "refund_request_id")
  private String refundRequestId;

  @Column(name = "performed_by")
  private String performedBy;

  @Column(name = "confirmed_by")
  private String confirmedBy;

  @Column(name = "transfer_reference")
  private String reference;

  @Column(name = "evidence_path")
  private String evidencePath;

  @Column(name = "original_name")
  private String originalName;

  @Column(name = "content_type")
  private String contentType;

  @Column(name = "status")
  private String status;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "confirmed_at")
  private LocalDateTime confirmedAt;

  public String getId() {
    return id;
  }

  public void setId(String value) {
    this.id = value;
  }

  public String getRefundRequestId() {
    return refundRequestId;
  }

  public void setRefundRequestId(String value) {
    this.refundRequestId = value;
  }

  public String getPerformedBy() {
    return performedBy;
  }

  public void setPerformedBy(String value) {
    this.performedBy = value;
  }

  public String getConfirmedBy() {
    return confirmedBy;
  }

  public void setConfirmedBy(String value) {
    this.confirmedBy = value;
  }

  public String getReference() {
    return reference;
  }

  public void setReference(String value) {
    this.reference = value;
  }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEvidencePath() {
    return evidencePath;
  }

  public void setEvidencePath(String value) {
    this.evidencePath = value;
  }

  public String getOriginalName() {
    return originalName;
  }

  public void setOriginalName(String value) {
    this.originalName = value;
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String value) {
    this.contentType = value;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String value) {
    this.status = value;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime value) {
    this.createdAt = value;
  }

  public LocalDateTime getConfirmedAt() {
    return confirmedAt;
  }

  public void setConfirmedAt(LocalDateTime value) {
    this.confirmedAt = value;
  }
}
