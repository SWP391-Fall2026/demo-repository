package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Payment;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private final PaymentRepository payments;
  private final ActorContext actor;

  public PaymentService(PaymentRepository p, ActorContext a) {
    payments = p;
    actor = a;
  }

  @Transactional(readOnly = true)
  public List<Payment> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR");
    return switch (actor.role(u)) {
      case "CUSTOMER" -> payments.findByUserId(u.getId());
      case "STAFF", "FMANAGER" -> payments.findByFacilityCode(u.getFacilityCode());
      default -> payments.findAll();
    };
  }

  public Map<String, String> bank() {
    return Map.of(
      "bankName",
      "Chuyển khoản QR mô phỏng",
      "accountName",
      "STORAGE DEMO",
      "gateway",
      "MOCK_ONLY"
    );
  }
}
