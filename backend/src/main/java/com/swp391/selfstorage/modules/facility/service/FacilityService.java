package com.swp391.selfstorage.modules.facility.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
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

  public FacilityService(
    FacilityRepository f,
    UnitRepository u,
    ActorContext a,
    AuditLogService l,
    com.swp391.selfstorage.modules.policy.service.PolicyService policy
  ) {
    facilities = f;
    units = u;
    actor = a;
    audit = l;
    this.policy = policy;
  }

  public List<Facility> facilities() {
    return facilities.findAll();
  }

  public List<Map<String, Object>> catalog(String facilityCode, BigDecimal minSize,
      BigDecimal maxSize, BigDecimal minPrice, BigDecimal maxPrice) {
    validateRange("kích thước", minSize, maxSize);
    validateRange("giá", minPrice, maxPrice);
    if (facilityCode != null && facilityCode.isBlank()) facilityCode = null;
    return units
      .findAvailableForCatalog(facilityCode, minSize, maxSize, minPrice, maxPrice)
      .stream()
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
    setFacilityProfile(f, d, true);
    f.setStatus("ACTIVE");
    facilities.save(f);
    audit.record("CREATE_FACILITY", code, "Tạo chi nhánh");
    return f;
  }

  @Transactional
  public Facility update(String code, Map<String, Object> d) {
    actor.require("OPS_MGR");
    var f = facilities.lockByCode(code).orElseThrow(Inputs::missing);
    setFacilityProfile(f, d, false);
    String status = Inputs.optional(d, "status");
    if (!status.isBlank()) {
      String normalized = status.trim().toUpperCase();
      if (!Set.of("ACTIVE", "INACTIVE", "MAINTENANCE").contains(normalized)) throw Inputs.bad(
        "Trạng thái cơ sở không hợp lệ"
      );
      f.setStatus(normalized);
    }
    facilities.save(f);
    audit.record("UPDATE_FACILITY", code, "Cập nhật chi nhánh");
    return f;
  }

  private void setFacilityProfile(Facility f, Map<String, Object> d, boolean required) {
    String name = required ? Inputs.text(d, "name") : Inputs.optional(d, "name");
    if (!name.isBlank()) {
      String trimmed = name.trim();
      if (trimmed.length() > 255) throw Inputs.bad("Tên cơ sở tối đa 255 ký tự");
      boolean duplicate = facilities.findAll().stream().anyMatch(existing ->
        existing.getName() != null &&
        trimmed.equalsIgnoreCase(existing.getName().trim()) && !existing.getCode().equals(f.getCode()));
      if (duplicate) throw Inputs.conflict("Trùng tên cơ sở");
      f.setName(trimmed);
    } else if (required) throw Inputs.bad("name is required");
    String address = required ? Inputs.text(d, "address") : Inputs.optional(d, "address");
    if (!address.isBlank()) f.setAddress(address);
    else if (required) throw Inputs.bad("address is required");
    String city = required ? Inputs.text(d, "city") : Inputs.optional(d, "city");
    if (!city.isBlank()) f.setCity(city);
    else if (required) throw Inputs.bad("city is required");
    String hotline = Inputs.optional(d, "hotline");
    if (!hotline.isBlank()) {
      if (!hotline.matches("[0-9+\\s.()-]{8,20}")) throw Inputs.bad("Hotline không hợp lệ");
      f.setHotline(hotline);
    } else if (d.containsKey("hotline")) f.setHotline(null);
    String openingHours = Inputs.optional(d, "openingHours");
    if (!openingHours.isBlank()) {
      if (openingHours.length() > 255) throw Inputs.bad("Giờ mở cửa tối đa 255 ký tự");
      f.setOpeningHours(openingHours);
    } else if (d.containsKey("openingHours")) f.setOpeningHours(null);
    if (d.containsKey("imageUrl")) setFacilityImage(f, Inputs.optional(d, "imageUrl"));
  }

  private void setFacilityImage(Facility f, String url) {
    if (url == null || url.isBlank()) {
      f.setImageUrl(null);
      return;
    }
    try {
      var parsed = java.net.URI.create(url);
      if (!"https".equalsIgnoreCase(parsed.getScheme()) || parsed.getHost() == null || parsed.getUserInfo() != null)
        throw Inputs.bad("Ảnh đại diện phải là URL HTTPS hợp lệ");
    } catch (IllegalArgumentException e) {
      throw Inputs.bad("Ảnh đại diện phải là URL HTTPS hợp lệ");
    }
    if (url.length() > 2048) throw Inputs.bad("Link ảnh tối đa 2048 ký tự");
    f.setImageUrl(url);
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
