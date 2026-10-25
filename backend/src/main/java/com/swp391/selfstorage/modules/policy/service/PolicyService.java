package com.swp391.selfstorage.modules.policy.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
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
    AuditLogService au
  ) {
    repo = r;
    actor = a;
    audit = au;
  }

  public BigDecimal value(String key, BigDecimal fallback) {
    return repo
      .findById(key)
      .map(p -> {
        try {
          return new BigDecimal(p.getPolicyValue());
        } catch (Exception e) {
          return fallback;
        }
      })
      .orElse(fallback);
  }

  public BigDecimal monthly(String type) {
    String key = "price." + type;
    return value(key, new BigDecimal(DEFAULTS.getOrDefault(key, "1450000")));
  }

  public void validatePrice(String type, BigDecimal price) {
    BigDecimal base = monthly(type);
    if (
      price.compareTo(value("price.min." + type, base)) < 0 ||
      price.compareTo(value("price.max." + type, base)) > 0
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
    if ("depositMonths".equals(key) && number.compareTo(BigDecimal.ZERO) <= 0) throw Inputs.bad(
      "Tiền cọc phải lớn hơn 0"
    );
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
    if (
      ("cleaningFee".equals(key) || "overdueDailyFee".equals(key) || "newLockFee".equals(key) ||
        key.startsWith("price.")) && number.compareTo(BigDecimal.ZERO) < 0
    ) throw Inputs.bad("Khung giá không hợp lệ");
    if (
      key.startsWith("discount.") && number.compareTo(BigDecimal.ONE) >= 0
    ) throw Inputs.bad("Tỷ lệ giảm giá phải nhỏ hơn 1");
    if (
      key.startsWith("price.min.") &&
      number.compareTo(
        value(key.replace(".min.", ".max."), monthly(key.substring(10)))
      ) > 0
    ) throw Inputs.bad("Giá tối thiểu vượt tối đa");
    if (
      key.startsWith("price.max.") &&
      number.compareTo(
        value(key.replace(".max.", ".min."), monthly(key.substring(10)))
      ) < 0
    ) throw Inputs.bad("Giá tối đa thấp hơn tối thiểu");
    put(key, value, u.getId());
    audit.record("UPDATE_POLICY", key, "Thay đổi cấu hình chính sách");
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
}
