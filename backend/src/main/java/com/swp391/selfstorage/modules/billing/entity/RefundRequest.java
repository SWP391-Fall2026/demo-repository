package com.swp391.selfstorage.modules.billing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "refund_requests")
public class RefundRequest {

  @Column(name = "handover_review_id")
  private String handoverReviewId;

  public String getHandoverReviewId() { return handoverReviewId; }
  public void setHandoverReviewId(String value) { handoverReviewId = value; }

  @Id
  @Column(name = "id")
  private String id;

  @Column(name = "payment_id")
  private String paymentId;

  @Column(name = "reservation_id")
  private String reservationId;

  @Column(name = "contract_id")
  private String contractId;

  @Column(name = "inspection_id")
  private String inspectionId;

  @Column(name = "facility_code")
  private String facilityCode;

  @Column(name = "user_id")
  private String userId;

  @Column(name = "requested_by")
  private String requestedBy;

  @Column(name = "on_behalf_basis")
  private String onBehalfBasis;

  @Column(name = "refund_type")
  private String refundType;

  @Column(name = "requested_amount")
  private BigDecimal requestedAmount;

  @Column(name = "approved_amount")
  private BigDecimal approvedAmount;

  @Column(name = "reason")
  private String reason;

  @Column(name = "decision_reason")
  private String decisionReason;

  @Column(name = "approved_by")
  private String approvedBy;

  @Column(name = "status")
  private String status;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  public String getId() {
    return id;
  }

  public void setId(String value) {
    this.id = value;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String value) {
    this.paymentId = value;
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

  public String getInspectionId() {
    return inspectionId;
  }

  public void setInspectionId(String value) {
    this.inspectionId = value;
  }

  public String getFacilityCode() {
    return facilityCode;
  }

  public void setFacilityCode(String value) {
    this.facilityCode = value;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String value) {
    this.userId = value;
  }

  public String getRequestedBy() {
    return requestedBy;
  }

  public void setRequestedBy(String value) {
    this.requestedBy = value;
  }

  public String getOnBehalfBasis() {
    return onBehalfBasis;
  }

  public void setOnBehalfBasis(String value) {
    this.onBehalfBasis = value;
  }

  public String getRefundType() {
    return refundType;
  }

  public void setRefundType(String value) {
    this.refundType = value;
  }

  public BigDecimal getRequestedAmount() {
    return requestedAmount;
  }

  public void setRequestedAmount(BigDecimal value) {
    this.requestedAmount = value;
  }

  public BigDecimal getApprovedAmount() {
    return approvedAmount;
  }

  public void setApprovedAmount(BigDecimal value) {
    this.approvedAmount = value;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String value) {
    this.reason = value;
  }

  public String getDecisionReason() {
    return decisionReason;
  }

  public void setDecisionReason(String value) {
    this.decisionReason = value;
  }

  public String getApprovedBy() {
    return approvedBy;
  }

  public void setApprovedBy(String value) {
    this.approvedBy = value;
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

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(LocalDateTime value) {
    this.completedAt = value;
  }

  @Column(name = "exception_requested")
  private Boolean exceptionRequested;

  public Boolean getExceptionRequested() {
    return exceptionRequested;
  }

  public void setExceptionRequested(Boolean v) {
    exceptionRequested = v;
  }

  @Column(name = "idempotency_key")
  private String idempotencyKey;

  public String getIdempotencyKey() {
    return idempotencyKey;
  }

  public void setIdempotencyKey(String v) {
    idempotencyKey = v;
  }
}
