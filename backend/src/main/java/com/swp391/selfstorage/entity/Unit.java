package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "units")
public class Unit {

    @Id
    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "facility_code", length = 50)
    private String facilityCode;

    @Column(name = "type", nullable = false)
    private String type; // S, M, L, CLIMATE

    @Column(name = "size_desc")
    private String sizeDesc;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "size_sqm", nullable = false)
    private BigDecimal sizeSqm;

    @Column(name = "price_per_month", nullable = false)
    private BigDecimal pricePerMonth;

    @Column(name = "status", nullable = false)
    private String status = "available"; // available, reserved, occupied, cleaning, maintenance

    @Column(name = "tenant_name")
    private String tenantName;

    @Column(name = "pin_code")
    private String pinCode = "842916";

    @Column(name = "temporary_pin")
    private String temporaryPin;

    @Column(name = "temporary_pin_expires_at")
    private LocalDateTime temporaryPinExpiresAt;

    public Unit() {}

    public Unit(String code, String facilityCode, String type, String sizeDesc, BigDecimal sizeSqm, BigDecimal pricePerMonth, String status, String tenantName, String pinCode) {
        this.code = code;
        this.facilityCode = facilityCode;
        this.type = type;
        this.sizeDesc = sizeDesc;
        this.sizeSqm = sizeSqm;
        this.pricePerMonth = pricePerMonth;
        this.status = status;
        this.tenantName = tenantName;
        this.pinCode = pinCode;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSizeDesc() { return sizeDesc; }
    public void setSizeDesc(String sizeDesc) { this.sizeDesc = sizeDesc; }

    public BigDecimal getSizeSqm() { return sizeSqm; }
    public void setSizeSqm(BigDecimal sizeSqm) { this.sizeSqm = sizeSqm; }

    public BigDecimal getPricePerMonth() { return pricePerMonth; }
    public void setPricePerMonth(BigDecimal pricePerMonth) { this.pricePerMonth = pricePerMonth; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    @JsonIgnore
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    @JsonIgnore
    public String getTemporaryPin() { return temporaryPin; }
    public void setTemporaryPin(String temporaryPin) { this.temporaryPin = temporaryPin; }

    @JsonIgnore
    public LocalDateTime getTemporaryPinExpiresAt() { return temporaryPinExpiresAt; }
    public void setTemporaryPinExpiresAt(LocalDateTime temporaryPinExpiresAt) { this.temporaryPinExpiresAt = temporaryPinExpiresAt; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
}
