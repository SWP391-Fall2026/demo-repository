package com.swp391.selfstorage.modules.rental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "handover_review_evidence")
public class HandoverReviewEvidence {
  public boolean isFileAvailable() { return evidencePath != null; }
  @Id
  @Column(name = "id")
  private String id;
  @Column(name = "review_id")
  private String reviewId;
  @Column(name = "note", columnDefinition = "text")
  private String note;
  @Column(name = "evidence_path")
  @com.fasterxml.jackson.annotation.JsonIgnore
  private String evidencePath;
  @Column(name = "content_type")
  private String contentType;
  @Column(name = "uploaded_by")
  private String uploadedBy;
  @Column(name = "created_at")
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String value) { id = value; }

  public String getReviewId() { return reviewId; }
  public void setReviewId(String value) { reviewId = value; }

  public String getNote() { return note; }
  public void setNote(String value) { note = value; }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEvidencePath() { return evidencePath; }
  public void setEvidencePath(String value) { evidencePath = value; }

  public String getContentType() { return contentType; }
  public void setContentType(String value) { contentType = value; }

  public String getUploadedBy() { return uploadedBy; }
  public void setUploadedBy(String value) { uploadedBy = value; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime value) { createdAt = value; }
}
