package com.swp391.selfstorage.modules.policy.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "business_policies")
public class BusinessPolicy {

  @Id
  @Column(name = "policy_key")
  private String id;

  @Column(name = "policy_value")
  private String policyValue;

  @Column(name = "updated_by")
  private String updatedBy;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String value) {
    this.id = value;
  }

  public String getPolicyValue() {
    return policyValue;
  }

  public void setPolicyValue(String value) {
    this.policyValue = value;
  }

  public String getUpdatedBy() {
    return updatedBy;
  }

  public void setUpdatedBy(String value) {
    this.updatedBy = value;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime value) {
    this.updatedAt = value;
  }
}
