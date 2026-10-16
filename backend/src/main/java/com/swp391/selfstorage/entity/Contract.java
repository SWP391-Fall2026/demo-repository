package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "reservation_id")
    private String reservationId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "unit_code")
    private String unitCode;

    @Column(name = "facility_code")
    private String facilityCode;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "duration_months")
    private Integer durationMonths = 1;

    @Column(name = "monthly_fee")
    private BigDecimal monthlyFee = BigDecimal.ZERO;

    @Column(name = "deposit_fee")
    private BigDecimal depositFee = BigDecimal.ZERO;

    @Column(name = "pin_code")
    private String pinCode = "842916";

    @Column(name = "physical_lock")
    private String physicalLock;

    @Column(name = "rfid_card")
    private String rfidCard;

    @Column(name = "status")
    private String status = "ACTIVE"; // ACTIVE, EXPIRING_SOON, OVERDUE, CHECKOUT_REQUESTED, TERMINATED

    @Column(name = "checkout_requested_at")
    private LocalDateTime checkoutRequestedAt;

    @Column(name = "checkout_requested_date")
    private LocalDate checkoutRequestedDate;

    @Column(name = "last_renewal_at")
    private LocalDateTime lastRenewalAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Contract() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getDurationMonths() { return durationMonths; }
    public void setDurationMonths(Integer durationMonths) { this.durationMonths = durationMonths; }

    public BigDecimal getMonthlyFee() { return monthlyFee; }
    public void setMonthlyFee(BigDecimal monthlyFee) { this.monthlyFee = monthlyFee; }

    public BigDecimal getDepositFee() { return depositFee; }
    public void setDepositFee(BigDecimal depositFee) { this.depositFee = depositFee; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getPhysicalLock() { return physicalLock; }
    public void setPhysicalLock(String physicalLock) { this.physicalLock = physicalLock; }

    public String getRfidCard() { return rfidCard; }
    public void setRfidCard(String rfidCard) { this.rfidCard = rfidCard; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCheckoutRequestedAt() { return checkoutRequestedAt; }
    public void setCheckoutRequestedAt(LocalDateTime checkoutRequestedAt) { this.checkoutRequestedAt = checkoutRequestedAt; }

    public LocalDate getCheckoutRequestedDate() { return checkoutRequestedDate; }
    public void setCheckoutRequestedDate(LocalDate checkoutRequestedDate) { this.checkoutRequestedDate = checkoutRequestedDate; }

    public LocalDateTime getLastRenewalAt() { return lastRenewalAt; }
    public void setLastRenewalAt(LocalDateTime lastRenewalAt) { this.lastRenewalAt = lastRenewalAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
