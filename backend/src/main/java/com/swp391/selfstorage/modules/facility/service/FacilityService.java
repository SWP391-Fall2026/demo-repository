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

  public List<Map<String, Object>> catalog() {
    return units
      .findByStatus("available")
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
        return m;
      })
      .toList();
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
    var price = Inputs.money(d.get("pricePerMonth"));
    policy.validatePrice(u.getType(), price);
    u.setPricePerMonth(price);
    if (d.containsKey("floor")) u.setFloor(
      Integer.valueOf(Inputs.text(d, "floor"))
    );
    audit.record(
      "UPDATE_UNIT",
      code,
      "Cập nhật giá niêm yết trong giới hạn Ops"
    );
    return units.save(u);
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
