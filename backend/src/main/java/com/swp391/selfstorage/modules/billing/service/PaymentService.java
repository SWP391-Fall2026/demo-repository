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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private final PaymentRepository payments;
  private final ActorContext actor;
  private final boolean simulationEnabled;

  public PaymentService(PaymentRepository p, ActorContext a,
      @Value("${app.payments.simulation-enabled:false}") boolean simulationEnabled) {
    payments = p;
    actor = a;
    this.simulationEnabled = simulationEnabled;
  }

  public List<Payment> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR");
    return payments
      .findAll()
      .stream()
      .filter(p -> actor.visible(u, p.getUserId(), p.getFacilityCode()))
      .toList();
  }

  public Map<String, Object> bank() {
    if (!simulationEnabled) return Map.of("gateway", "VNPAY", "simulationEnabled", false);
    return Map.of(
      "simulationEnabled",
      true,
      "bankName",
      "Chuyển khoản QR mô phỏng",
      "accountName",
      "STORAGE DEMO",
      "gateway",
      "MOCK_ONLY"
    );
  }
}
