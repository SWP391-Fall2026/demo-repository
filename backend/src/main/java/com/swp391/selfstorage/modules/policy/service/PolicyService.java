package com.swp391.selfstorage.modules.policy.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.entity.BusinessPolicy;
import com.swp391.selfstorage.modules.policy.repository.BusinessPolicyRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PolicyService {

  private final BusinessPolicyRepository repo;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final UnitRepository units;
  private final FacilityRepository facilities;
  private static final Map<String, String> DEFAULTS = Map.ofEntries(
    Map.entry("discount.3", "0.05"),
    Map.entry("discount.6", "0.10"),
    Map.entry("discount.12", "0.15"),
    Map.entry("price.S", "800000"),
    Map.entry("price.M", "1450000"),
    Map.entry("price.L", "2800000"),
    Map.entry("price.CLIMATE", "2200000"),
    Map.entry("depositMonths", "1"),
    Map.entry("reservationHoldDays", "3"),
    Map.entry("refundCancelHours", "24"),
    Map.entry("renewalMaxMonths", "36"),
    Map.entry("gracePeriodDays", "0"),
    Map.entry("cleaningFee", "200000"),
    Map.entry("overdueDailyFee", "50000"),
    Map.entry("newLockFee", "150000")
  );

  public PolicyService(
    BusinessPolicyRepository r,
    ActorContext a,
    AuditLogService au,
    UnitRepository units,
    FacilityRepository facilities
  ) {
    repo = r;
    actor = a;
    audit = au;
    this.units = units;
    this.facilities = facilities;
  }

  public BigDecimal value(String key, BigDecimal fallback) {
    return repo
      .findById(key)
      .map(p -> {
        try {
          return new BigDecimal(p.getPolicyValue());
        } catch (NumberFormatException e) {
          throw new IllegalStateException("Invalid stored policy value for " + key, e);
        }
      })
      .orElse(fallback);
  }

  public BigDecimal monthly(String type) {
    String key = "price." + type;
    return value(key, new BigDecimal(DEFAULTS.getOrDefault(key, "1450000")));
  }

  public Optional<BigDecimal> facilityMonthly(String facilityCode, String type) {
    return repo.findById(facilityPriceKey(facilityCode, type))
      .map(policy -> {
        try {
          return new BigDecimal(policy.getPolicyValue());
        } catch (NumberFormatException e) {
          throw new IllegalStateException("Invalid stored policy value for facility price", e);
        }
      });
  }

  public void validatePrice(String type, BigDecimal price) {
    BigDecimal minimum = value("price.min." + type, null);
    BigDecimal maximum = value("price.max." + type, null);
    if (
      minimum != null && price.compareTo(minimum) < 0 ||
      maximum != null && price.compareTo(maximum) > 0
    ) throw Inputs.bad("Giá nằm ngoài khoảng Ops cho phép");
  }

  public BigDecimal fee(String key) {
    return value(key, new BigDecimal(DEFAULTS.getOrDefault(key, "0")));
  }

  public BigDecimal cap(String facility) {
    return value("cap." + facility, new BigDecimal("50"));
  }

  public Map<String, String> get() {
    Map<String, String> result = new TreeMap<>(DEFAULTS);
    repo.findAll().forEach(p -> result.put(p.getId(), p.getPolicyValue()));
    return result;
  }

  @Transactional
  public Map<String, String> save(Map<String, Object> d) {
    var u = actor.require("OPS_MGR");
    String key = Inputs.text(d, "key"),
      value = Inputs.text(d, "value");
    if (
      !DEFAULTS.containsKey(key) &&
      !key.matches("price\\.(min|max)\\.(S|M|L|CLIMATE)")
    ) throw Inputs.bad("Khóa chính sách không hợp lệ");
    BigDecimal number = Inputs.money(value);
    if ("depositMonths".equals(key)) {
      if (number.compareTo(BigDecimal.ZERO) <= 0) throw Inputs.bad("Tiền cọc phải lớn hơn 0");
      try {
        number = new BigDecimal(number.toBigIntegerExact().toString());
      } catch (ArithmeticException e) {
        throw Inputs.bad("Số tháng tiền cọc phải là số nguyên");
      }
      value = number.toPlainString();
    }
    if (
      "reservationHoldDays".equals(key) || "refundCancelHours".equals(key) ||
        "renewalMaxMonths".equals(key) || "gracePeriodDays".equals(key)
    ) {
      if (number.signum() < 0) throw Inputs.bad("Thông số chính sách không được âm");
      try {
        number = new BigDecimal(number.toBigIntegerExact().toString());
      } catch (ArithmeticException e) {
        throw Inputs.bad("Thông số chính sách phải là số nguyên");
      }
      value = number.toPlainString();
    }
    if ("reservationHoldDays".equals(key) && number.signum() == 0) {
      throw Inputs.bad("Thời hạn giữ reservation phải lớn hơn 0");
    }
    if (
      ("cleaningFee".equals(key) || "overdueDailyFee".equals(key) || "newLockFee".equals(key) ||
        key.startsWith("price.")) && number.compareTo(BigDecimal.ZERO) < 0
    ) throw Inputs.bad("Khung giá không hợp lệ");
    if (
      key.startsWith("discount.") && number.compareTo(BigDecimal.ONE) >= 0
    ) throw Inputs.bad("Tỷ lệ giảm giá phải nhỏ hơn 1");
    if (key.matches("price\\.(S|M|L|CLIMATE)")) {
      validatePrice(key.substring("price.".length()), number);
    }
    if (key.startsWith("price.min.") || key.startsWith("price.max.")) {
      String type = key.substring(key.lastIndexOf('.') + 1);
      BigDecimal minimum = key.startsWith("price.min.") ? number : value("price.min." + type, null);
      BigDecimal maximum = key.startsWith("price.max.") ? number : value("price.max." + type, null);
      validateConfiguredPriceRange(type, minimum, maximum);
    }
    String oldValue = repo.findById(key).map(BusinessPolicy::getPolicyValue).orElse(null);
    put(key, value, u.getId());
    String propagation = propagateUnitPrice(key, number);
    audit.record("UPDATE_POLICY", key, "Giá trị cũ: " + oldValue + " → giá trị mới: " + value + propagation);
    return get();
  }

  @Transactional
  public Map<String, String> saveFacilityPrice(Map<String, Object> d) {
    var u = actor.require("OPS_MGR");
    String facilityCode = Inputs.text(d, "facilityCode");
    String type = Inputs.text(d, "unitType").toUpperCase(Locale.ROOT);
    if (!Set.of("S", "M", "L", "CLIMATE").contains(type)) {
      throw Inputs.bad("Loại kho không hợp lệ");
    }
    if (!facilities.existsById(facilityCode)) throw Inputs.missing();
    BigDecimal price = Inputs.money(d.get("pricePerMonth"));
    validatePrice(type, price);
    String key = facilityPriceKey(facilityCode, type);
    String oldValue = repo.findById(key).map(BusinessPolicy::getPolicyValue).orElse(null);
    put(key, price.toPlainString(), u.getId());
    var affected = units.findByFacilityCode(facilityCode).stream()
      .filter(unit -> type.equals(unit.getType()) && "available".equalsIgnoreCase(unit.getStatus()))
      .peek(unit -> unit.setPricePerMonth(price))
      .toList();
    units.saveAll(affected);
    audit.record(
      "UPDATE_POLICY",
      key,
      "Giá cũ: " + Objects.toString(oldValue, "chưa cấu hình") + " → giá mới: "
        + price.toPlainString() + "; đồng bộ " + affected.size() + " kho available"
    );
    return get();
  }

  @Transactional
  public Map<String, String> cap(Map<String, Object> d) {
    var u = actor.require("FMANAGER");
    BigDecimal p = Inputs.money(d.get("percentage"));
    if (p.compareTo(BigDecimal.valueOf(100)) > 0) throw Inputs.bad(
      "Trần không vượt 100%"
    );
    put("cap." + u.getFacilityCode(), p.toPlainString(), u.getId());
    audit.record("UPDATE_OVERDUE_CAP", u.getFacilityCode(), "Tỷ lệ trần " + p);
    return get();
  }

  private void put(String key, String value, String by) {
    BusinessPolicy p = new BusinessPolicy();
    p.setId(key);
    p.setPolicyValue(value);
    p.setUpdatedBy(by);
    p.setUpdatedAt(LocalDateTime.now());
    repo.save(p);
  }

  private String facilityPriceKey(String facilityCode, String type) {
    return "price.facility." + facilityCode + "." + type;
  }

  private void validateConfiguredPriceRange(String type, BigDecimal minimum, BigDecimal maximum) {
    if (minimum != null && maximum != null && minimum.compareTo(maximum) > 0) {
      throw Inputs.bad("Giá tối thiểu vượt tối đa");
    }
    BigDecimal standardPrice = monthly(type);
    if (
      minimum != null && standardPrice.compareTo(minimum) < 0 ||
      maximum != null && standardPrice.compareTo(maximum) > 0
    ) throw Inputs.bad("Khoảng giá phải bao gồm giá chuẩn toàn chuỗi");
    String suffix = "." + type;
    for (BusinessPolicy stored : repo.findAll()) {
      if (!stored.getId().startsWith("price.facility.") || !stored.getId().endsWith(suffix)) continue;
      BigDecimal facilityPrice;
      try {
        facilityPrice = new BigDecimal(stored.getPolicyValue());
      } catch (NumberFormatException e) {
        throw new IllegalStateException("Invalid stored facility price: " + stored.getId(), e);
      }
      if (
        minimum != null && facilityPrice.compareTo(minimum) < 0 ||
        maximum != null && facilityPrice.compareTo(maximum) > 0
      ) throw Inputs.bad("Khoảng giá mới không bao gồm giá đã cấu hình tại cơ sở");
    }
  }

  private String propagateUnitPrice(String key, BigDecimal number) {
    if (!key.matches("price\\.(S|M|L|CLIMATE)")) return "";
    String type = key.substring("price.".length());
    var affected = units.findAll().stream()
      .filter(unit -> type.equals(unit.getType()) && "available".equalsIgnoreCase(unit.getStatus()))
      .peek(unit -> unit.setPricePerMonth(number))
      .toList();
    units.saveAll(affected);
    return "; đồng bộ " + affected.size() + " kho available loại " + type;
  }
}
