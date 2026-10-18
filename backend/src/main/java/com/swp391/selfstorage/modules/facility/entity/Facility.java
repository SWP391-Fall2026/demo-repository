package com.swp391.selfstorage.modules.facility.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "facilities")
public class Facility {

  @Id
  @Column(name = "code", length = 50)
  private String code;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "address", nullable = false)
  private String address;

  @Column(name = "city", nullable = false)
  private String city;

  @Column(name = "hotline")
  private String hotline;

  @Column(name = "total_units")
  private Integer totalUnits = 0;

  @Column(name = "occupied_units")
  private Integer occupiedUnits = 0;

  @Column(name = "occupancy_rate")
  private BigDecimal occupancyRate = BigDecimal.ZERO;

  @Column(name = "status")
  private String status = "ACTIVE";

  public Facility() {}

  public Facility(
    String code,
    String name,
    String address,
    String city,
    String hotline,
    Integer totalUnits,
    Integer occupiedUnits,
    BigDecimal occupancyRate,
    String status
  ) {
    this.code = code;
    this.name = name;
    this.address = address;
    this.city = city;
    this.hotline = hotline;
    this.totalUnits = totalUnits;
    this.occupiedUnits = occupiedUnits;
    this.occupancyRate = occupancyRate;
    this.status = status;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public String getHotline() {
    return hotline;
  }

  public void setHotline(String hotline) {
    this.hotline = hotline;
  }

  public Integer getTotalUnits() {
    return totalUnits;
  }

  public void setTotalUnits(Integer totalUnits) {
    this.totalUnits = totalUnits;
  }

  public Integer getOccupiedUnits() {
    return occupiedUnits;
  }

  public void setOccupiedUnits(Integer occupiedUnits) {
    this.occupiedUnits = occupiedUnits;
  }

  public BigDecimal getOccupancyRate() {
    return occupancyRate;
  }

  public void setOccupancyRate(BigDecimal occupancyRate) {
    this.occupancyRate = occupancyRate;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }
}
