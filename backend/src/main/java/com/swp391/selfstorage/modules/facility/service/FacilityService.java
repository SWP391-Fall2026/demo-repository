package com.swp391.selfstorage.modules.facility.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacilityService {

  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final com.swp391.selfstorage.modules.policy.service.PolicyService policy;
  private final ReservationRepository reservations;
  private final ReservationHoldPolicy holdPolicy;
  private final Clock clock;

  public FacilityService(
    FacilityRepository f,
    UnitRepository u,
    ActorContext a,
    AuditLogService l,
    com.swp391.selfstorage.modules.policy.service.PolicyService policy,
    ReservationRepository reservations,
    ReservationHoldPolicy holdPolicy,
    Clock clock
  ) {
    facilities = f;
    units = u;
    actor = a;
    audit = l;
    this.policy = policy;
    this.reservations = reservations;
    this.holdPolicy = holdPolicy;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public List<Facility> facilities() {
    // Summary columns are kept for compatibility with existing records, but
    // unit status is source of truth. Recompute before exposing public data so
    // newly added, reserved, or occupied units are reflected immediately.
    Map<String, UnitRepository.FacilityCount> counts = new HashMap<>();
    for (var count : units.countByFacility()) counts.put(count.getFacilityCode(), count);
    return facilities.findAll().stream().map(facility -> {
      var count = counts.get(facility.getCode());
      int total = count == null ? 0 : Math.toIntExact(count.getTotal());
      int occupied = count == null ? 0 : Math.toIntExact(count.getOccupied());
      BigDecimal rate = total == 0
          ? BigDecimal.ZERO
          : BigDecimal.valueOf(occupied).multiply(BigDecimal.valueOf(100))
              .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
      return new Facility(facility.getCode(), facility.getName(), facility.getAddress(),
          facility.getCity(), facility.getHotline(), total, occupied, rate, facility.getStatus());
    }).toList();
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> catalog(String facilityCode, BigDecimal minSize,
      BigDecimal maxSize, BigDecimal minPrice, BigDecimal maxPrice) {
    validateRange("kích thước", minSize, maxSize);
    validateRange("giá", minPrice, maxPrice);
    if (facilityCode != null && facilityCode.isBlank()) facilityCode = null;
    var candidates = units.findAvailableForCatalog(facilityCode, minSize, maxSize, minPrice, maxPrice);
    if (candidates.isEmpty()) return List.of();

    // Holds reserve capacity by facility/type, not a particular unit or a filtered subset.
    Map<String, Map<String, Long>> remaining = new HashMap<>();
    for (var count : units.countAvailableByType(facilityCode)) {
      remaining.computeIfAbsent(count.getFacilityCode(), key -> new HashMap<>())
          .put(count.getUnitType(), count.getQuantity());
    }
    var pendingCreatedAfter = LocalDateTime.now(clock).minus(holdPolicy.pendingPaymentHold());
    for (var hold : reservations.countUnassignedHolds(facilityCode, pendingCreatedAfter)) {
      var byType = remaining.get(hold.getFacilityCode());
      if (byType != null) {
        byType.computeIfPresent(hold.getUnitType(),
            (type, available) -> Math.max(0L, available - hold.getQuantity()));
      }
    }
    return candidates
      .stream()
      .filter(u -> {
        var byType = remaining.get(u.getFacilityCode());
        long available = byType == null ? 0 : byType.getOrDefault(u.getType(), 0L);
        if (available == 0) return false;
        byType.put(u.getType(), available - 1);
        return true;
      })
      .map(u -> {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", u.getCode());
        m.put("facilityCode", u.getFacilityCode());
        m.put("type", u.getType());
        m.put("sizeDesc", u.getSizeDesc());
        m.put("sizeSqm", u.getSizeSqm());
        m.put("pricePerMonth", u.getPricePerMonth());
        m.put("status", u.getStatus());
        m.put("imageUrl", u.getImageUrl());
        m.put("imageAltText", u.getImageAltText());
        return m;
      })
      .toList();
  }

  private void validateRange(String label, BigDecimal minimum, BigDecimal maximum) {
    if (minimum != null && minimum.signum() < 0 || maximum != null && maximum.signum() < 0) {
      throw Inputs.bad("Khoảng " + label + " không được âm");
    }
    if (minimum != null && maximum != null && minimum.compareTo(maximum) > 0) {
      throw Inputs.bad("Giá trị tối thiểu của " + label + " không được lớn hơn tối đa");
    }
  }

  public List<Unit> managed() {
    var u = actor.require("STAFF", "FMANAGER");
    return units.findByFacilityCode(u.getFacilityCode());
  }

  @Transactional
  public Facility create(Map<String, Object> d) {
    actor.require("OPS_MGR");
    String code = Inputs.text(d, "code");
    if (facilities.existsById(code)) throw Inputs.conflict(
      "Mã cơ sở đã tồn tại"
    );
    Facility f = new Facility();
    f.setCode(code);
    f.setName(Inputs.text(d, "name"));
    f.setAddress(Inputs.text(d, "address"));
    f.setCity(Inputs.text(d, "city"));
    f.setHotline(Inputs.optional(d, "hotline"));
    f.setStatus("ACTIVE");
    facilities.save(f);
    audit.record("CREATE_FACILITY", code, "Tạo chi nhánh");
    return f;
  }

  @Transactional
  public Unit createUnit(Map<String, Object> d) {
    var a = actor.require("FMANAGER");
    String code = Inputs.text(d, "code");
    if (units.existsById(code)) throw Inputs.conflict("Mã kho đã tồn tại");
    Unit u = new Unit();
    u.setCode(code);
    u.setFacilityCode(a.getFacilityCode());
    u.setType(Inputs.text(d, "type"));
    if (
      !Set.of("S", "M", "L", "CLIMATE").contains(u.getType())
    ) throw Inputs.bad("Loại kho không hợp lệ");
    u.setSizeSqm(Inputs.money(d.get("sizeSqm")));
    u.setSizeDesc(u.getSizeSqm() + " m²");
    u.setPricePerMonth(Inputs.money(d.get("pricePerMonth")));
    policy.validatePrice(u.getType(), u.getPricePerMonth());
    u.setFloor(Integer.valueOf(Objects.toString(d.getOrDefault("floor", 0))));
    setImageLink(u, d);
    u.setStatus("available");
    u.setPinCode(null);
    units.save(u);
    audit.record("CREATE_UNIT", code, "Tạo kho tại chi nhánh");
    return u;
  }

  @Transactional
  public Unit updateUnit(String code, Map<String, Object> d) {
    var a = actor.require("FMANAGER");
    var u = units.lockByCode(code).orElseThrow(Inputs::missing);
    actor.facility(a, u.getFacilityCode());
    if (d.containsKey("pricePerMonth")) {
      var price = Inputs.money(d.get("pricePerMonth"));
      policy.validatePrice(u.getType(), price);
      u.setPricePerMonth(price);
    }
    if (d.containsKey("floor")) u.setFloor(
      Integer.valueOf(Inputs.text(d, "floor"))
    );
    if (d.containsKey("imageUrl") || d.containsKey("imageAltText")) setImageLink(u, d);
    audit.record(
      "UPDATE_UNIT",
      code,
      "Cập nhật thông tin kho và ảnh"
    );
    return units.save(u);
  }

  private void setImageLink(Unit unit, Map<String, Object> data) {
    if (data.containsKey("imageUrl")) {
      String url = Inputs.optional(data, "imageUrl");
      if (!url.isBlank()) {
        try {
          java.net.URI parsed = java.net.URI.create(url);
          if (!"https".equalsIgnoreCase(parsed.getScheme()) || parsed.getHost() == null || parsed.getUserInfo() != null)
            throw Inputs.bad("Link ảnh phải là URL HTTPS hợp lệ");
        } catch (IllegalArgumentException e) {
          throw Inputs.bad("Link ảnh phải là URL HTTPS hợp lệ");
        }
      }
      if (url.length() > 2048) throw Inputs.bad("Link ảnh tối đa 2048 ký tự");
      unit.setImageUrl(url.isBlank() ? null : url);
    }
    if (data.containsKey("imageAltText")) {
      String alt = Inputs.optional(data, "imageAltText");
      if (alt.length() > 255) throw Inputs.bad("Mô tả ảnh tối đa 255 ký tự");
      unit.setImageAltText(alt.isBlank() ? null : alt);
    }
  }

  @Transactional
  public Unit readiness(String code, Map<String, Object> d, boolean approve) {
    var a = actor.require(
      approve ? new String[] { "FMANAGER" } : new String[] { "STAFF" }
    );
    Unit u = units.lockByCode(code).orElseThrow(Inputs::missing);
    actor.facility(a, u.getFacilityCode());
    if (
      !Set.of("cleaning", "maintenance").contains(u.getStatus())
    ) throw Inputs.conflict("Kho chưa ở bước vệ sinh/bảo trì");
    if (approve) {
      if (!"PENDING".equals(u.getReadinessStatus())) throw Inputs.conflict(
        "Chưa có yêu cầu từ Staff"
      );
      u.setStatus("available");
      u.setTenantName(null);
      u.setReadinessStatus("APPROVED");
    } else {
      u.setReadinessStatus("PENDING");
      u.setReadinessRequestedBy(a.getId());
      u.setReadinessNotes(Inputs.text(d, "notes"));
    }
    units.save(u);
    audit.record(
      approve ? "APPROVE_UNIT_READY" : "REQUEST_UNIT_READY",
      code,
      "Xác nhận vệ sinh/sẵn sàng"
    );
    return u;
  }
}
