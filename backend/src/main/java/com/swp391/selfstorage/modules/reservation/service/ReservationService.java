package com.swp391.selfstorage.modules.reservation.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

  private final ReservationRepository repo;
  private final ActorContext actor;
  private final PolicyService policy;
  private final com.swp391.selfstorage.modules.facility.repository.UnitRepository units;

  public ReservationService(
    ReservationRepository r,
    ActorContext a,
    PolicyService p,
    com.swp391.selfstorage.modules.facility.repository.UnitRepository units
  ) {
    repo = r;
    actor = a;
    policy = p;
    this.units = units;
  }

  public List<Reservation> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return "CUSTOMER".equals(actor.role(u))
      ? repo.findByUserId(u.getId())
      : repo.findByFacilityCode(u.getFacilityCode());
  }

  public Reservation get(String id) {
    var u = actor.current();
    var r = repo.findById(id).orElseThrow(Inputs::missing);
    if (
      !actor.visible(u, r.getUserId(), r.getFacilityCode())
    ) throw Inputs.missing();
    return r;
  }

  public Map<String, Object> quote(Map<String, Object> d) {
    String type = Inputs.text(d, "unitType");
    int months = Integer.parseInt(
      Objects.toString(d.getOrDefault("durationMonths", 1))
    );
    if (months < 1 || months > 36) throw Inputs.bad(
      "Thời hạn thuê từ 1 đến 36 tháng"
    );
    if (!Set.of("S", "M", "L", "CLIMATE").contains(type)) throw Inputs.bad(
      "Loại kho không hợp lệ"
    );
    String facility = Inputs.optional(d, "facilityCode");
    BigDecimal rate = facility.isBlank()
      ? policy.monthly(type)
      : units
          .findByFacilityCode(facility)
          .stream()
          .filter(
            u -> type.equals(u.getType()) && "available".equals(u.getStatus())
          )
          .map(u -> u.getPricePerMonth())
          .min(BigDecimal::compareTo)
          .orElseThrow(() -> Inputs.conflict("Loại kho đã hết chỗ"));
    BigDecimal monthly = rate,
      deposit = monthly.multiply(policy.value("depositMonths", BigDecimal.ONE));
    BigDecimal discount = policy.value("discount." + months, BigDecimal.ZERO);
    monthly = monthly
      .multiply(BigDecimal.ONE.subtract(discount))
      .setScale(0, RoundingMode.HALF_UP);
    deposit = monthly.multiply(policy.value("depositMonths", BigDecimal.ONE));
    return Map.of(
      "monthlyRate",
      monthly,
      "durationMonths",
      months,
      "depositAmount",
      deposit,
      "payNowAmount",
      deposit,
      "totalRent",
      monthly.multiply(BigDecimal.valueOf(months)),
      "discountRate",
      discount
    );
  }
}
