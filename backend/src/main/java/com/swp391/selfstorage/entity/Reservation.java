package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "facility_code")
    private String facilityCode;

    @Column(name = "unit_type", nullable = false)
    private String unitType;

    @Column(name = "unit_code")
    private String unitCode;

    @Column(name = "duration_months")
    private Integer durationMonths = 1;

    @Column(name = "start_date")
    private LocalDate startDate = LocalDate.now();

    @Column(name = "deposit_amount")
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "status")
    private String status = "PENDING_PAYMENT"; // PENDING_PAYMENT, RESERVED, CHECKED_IN, CANCELLED, EXPIRED

    @Column(name = "appointment")
    private String appointment;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Reservation() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public String getUnitType() { return unitType; }
    public void setUnitType(String unitType) { this.unitType = unitType; }

    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }

    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public BigDecimal getDepositAmount() { return depositAmount; }
    public void setDepositAmount(BigDecimal depositAmount) { this.depositAmount = depositAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAppointment() { return appointment; }
    public void setAppointment(String appointment) { this.appointment = appointment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
