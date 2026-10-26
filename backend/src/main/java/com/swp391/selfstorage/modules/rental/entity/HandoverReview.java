package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "handover_reviews")
public class HandoverReview {
  @Id
  @Column(name = "id")
  private String id;
  @Column(name = "handover_id")
  private String handoverId;
  @Column(name = "contract_id")
  private String contractId;
  @Column(name = "reservation_id")
  private String reservationId;
  @Column(name = "facility_code")
  private String facilityCode;
  @Column(name = "user_id")
  private String userId;
  @Column(name = "kind")
  private String kind;
  @Column(name = "status")
  private String status;
  @Column(name = "reason", columnDefinition = "text")
  private String reason;
  @Column(name = "requested_by")
  private String requestedBy;
  @Column(name = "source")
  private String source;
  @Column(name = "created_at")
  private LocalDateTime createdAt;
  @Column(name = "confirmation_deadline")
  private LocalDateTime confirmationDeadline;
  @Column(name = "handover_snapshot", columnDefinition = "text")
  private String handoverSnapshot;
  @Column(name = "decided_by")
  private String decidedBy;
  @Column(name = "decided_at")
  private LocalDateTime decidedAt;
  @Column(name = "decision_reason", columnDefinition = "text")
  private String decisionReason;
  @Column(name = "conditions", columnDefinition = "text")
  private String conditions;
  @Column(name = "next_steps", columnDefinition = "text")
  private String nextSteps;
  @Column(name = "new_confirmation_deadline")
  private LocalDateTime newConfirmationDeadline;
  @Column(name = "customer_response", columnDefinition = "text")
  private String customerResponse;
  @Column(name = "customer_responded_at")
  private LocalDateTime customerRespondedAt;
  @Column(name = "policy_version")
  private String policyVersion;
  @Column(name = "paid_rent_amount")
  private BigDecimal paidRentAmount;
  @Column(name = "refund_amount")
  private BigDecimal refundAmount;

  public String getId() { return id; }
  public void setId(String value) { id = value; }

  public String getHandoverId() { return handoverId; }
  public void setHandoverId(String value) { handoverId = value; }

  public String getContractId() { return contractId; }
  public void setContractId(String value) { contractId = value; }

  public String getReservationId() { return reservationId; }
  public void setReservationId(String value) { reservationId = value; }

  public String getFacilityCode() { return facilityCode; }
  public void setFacilityCode(String value) { facilityCode = value; }

  public String getUserId() { return userId; }
  public void setUserId(String value) { userId = value; }

  public String getKind() { return kind; }
  public void setKind(String value) { kind = value; }

  public String getStatus() { return status; }
  public void setStatus(String value) { status = value; }

  public String getReason() { return reason; }
  public void setReason(String value) { reason = value; }

  public String getRequestedBy() { return requestedBy; }
  public void setRequestedBy(String value) { requestedBy = value; }

  public String getSource() { return source; }
  public void setSource(String value) { source = value; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime value) { createdAt = value; }

  public LocalDateTime getConfirmationDeadline() { return confirmationDeadline; }
  public void setConfirmationDeadline(LocalDateTime value) { confirmationDeadline = value; }

  public String getHandoverSnapshot() { return handoverSnapshot; }
  public void setHandoverSnapshot(String value) { handoverSnapshot = value; }

  public String getDecidedBy() { return decidedBy; }
  public void setDecidedBy(String value) { decidedBy = value; }

  public LocalDateTime getDecidedAt() { return decidedAt; }
  public void setDecidedAt(LocalDateTime value) { decidedAt = value; }

  public String getDecisionReason() { return decisionReason; }
  public void setDecisionReason(String value) { decisionReason = value; }

  public String getConditions() { return conditions; }
  public void setConditions(String value) { conditions = value; }

  public String getNextSteps() { return nextSteps; }
  public void setNextSteps(String value) { nextSteps = value; }

  public LocalDateTime getNewConfirmationDeadline() { return newConfirmationDeadline; }
  public void setNewConfirmationDeadline(LocalDateTime value) { newConfirmationDeadline = value; }

  public String getCustomerResponse() { return customerResponse; }
  public void setCustomerResponse(String value) { customerResponse = value; }

  public LocalDateTime getCustomerRespondedAt() { return customerRespondedAt; }
  public void setCustomerRespondedAt(LocalDateTime value) { customerRespondedAt = value; }

  public String getPolicyVersion() { return policyVersion; }
  public void setPolicyVersion(String value) { policyVersion = value; }

  public BigDecimal getPaidRentAmount() { return paidRentAmount; }
  public void setPaidRentAmount(BigDecimal value) { paidRentAmount = value; }

  public BigDecimal getRefundAmount() { return refundAmount; }
  public void setRefundAmount(BigDecimal value) { refundAmount = value; }
}
