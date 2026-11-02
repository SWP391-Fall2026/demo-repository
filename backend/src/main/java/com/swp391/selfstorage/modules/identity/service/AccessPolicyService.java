package com.swp391.selfstorage.modules.identity.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.policy.entity.BusinessPolicy;
import com.swp391.selfstorage.modules.policy.repository.BusinessPolicyRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Configurable restrictions; workflow role/owner/facility checks remain mandatory. */
@Service
public class AccessPolicyService {
  private static final Map<String, List<String>> MODULES = Map.of(
      "CUSTOMER", List.of("RESERVATION", "RENTAL", "BILLING", "SUPPORT"),
      "STAFF", List.of("FACILITY", "RESERVATION", "RENTAL", "BILLING", "WORKFORCE", "SUPPORT"),
      "FMANAGER", List.of("FACILITY", "RESERVATION", "RENTAL", "BILLING", "WORKFORCE", "SUPPORT", "POLICY", "REPORTING"),
      "OPS_MGR", List.of("FACILITY", "POLICY", "REPORTING"),
      "ADMIN", List.of("AUDIT"));
  private final BusinessPolicyRepository policies;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;

  public AccessPolicyService(BusinessPolicyRepository p, ActorContext a, AuditLogService au, Clock c) {
    policies = p; actor = a; audit = au; clock = c;
  }

  public Map<String, Object> matrix() {
    actor.require("ADMIN");
    Map<String, Object> result = new LinkedHashMap<>();
    Map<String, String> stored = new HashMap<>();
    policies.findAll().stream().filter(p -> p.getId().startsWith("rbac."))
        .forEach(p -> stored.put(p.getId(), p.getPolicyValue()));
    for (String role : List.of("CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN")) {
      List<Map<String, Object>> permissions = new ArrayList<>();
      for (String module : MODULES.get(role)) {
        for (String action : List.of("READ", "WRITE")) {
          if (Set.of("AUDIT", "REPORTING").contains(module) && "WRITE".equals(action)) continue;
          String permission = module + "." + action;
          permissions.add(Map.of("permission", permission,
              "enabled", !"false".equals(stored.get(key(role, permission)))));
        }
      }
      result.put(role, permissions);
    }
    return result;
  }

  @Transactional
  public Map<String, Object> update(Map<String, Object> input) {
    var admin = actor.require("ADMIN");
    String role = Inputs.text(input, "role");
    String permission = Inputs.text(input, "permission");
    if (!MODULES.containsKey(role) || !valid(role, permission))
      throw Inputs.bad("Quyền không thuộc vai trò này");
    if (!(input.get("enabled") instanceof Boolean)) throw Inputs.bad("enabled phải là boolean");
    BusinessPolicy policy = new BusinessPolicy();
    policy.setId(key(role, permission));
    policy.setPolicyValue(input.get("enabled").toString());
    policy.setUpdatedBy(admin.getId());
    policy.setUpdatedAt(LocalDateTime.now(clock));
    policies.save(policy);
    audit.record("UPDATE_ACCESS_POLICY", policy.getId(), "enabled=" + input.get("enabled"));
    return matrix();
  }

  public void check(String method, String path) {
    String permission = permission(method, path);
    if (permission == null) return;
    var user = actor.current();
    String role = actor.role(user);
    if (!valid(role, permission)) return; // Existing service checks decide unlisted operations.
    if (policies.findById(key(role, permission))
        .map(p -> "false".equals(p.getPolicyValue())).orElse(false))
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quyền này đã bị quản trị viên tắt");
  }

  static String permission(String method, String path) {
    String action = Set.of("GET", "HEAD").contains(method) ? "READ" : "WRITE";
    if ("OPTIONS".equals(method)) return null;
    if (path.matches("/api/payments/vnpay/(ipn|return)/?")) return null;
    if ("READ".equals(action) && (Set.of("/api/facilities", "/api/facilities/units",
        "/api/facilities/unit-types", "/api/services", "/api/policies", "/api/payments/bank-info").contains(path))) return null;
    String module;
    if (path.startsWith("/api/tasks/tickets") || path.startsWith("/api/tickets")) module = "SUPPORT";
    else if (path.startsWith("/api/facilities")) module = "FACILITY";
    else if (path.startsWith("/api/reservations")) module = "RESERVATION";
    else if (path.startsWith("/api/contracts") || path.startsWith("/api/handover-reviews")) module = "RENTAL";
    else if (path.startsWith("/api/invoices") || path.startsWith("/api/payments") || path.startsWith("/api/refunds")) module = "BILLING";
    else if (path.startsWith("/api/tasks")) module = "WORKFORCE";
    else if (path.startsWith("/api/reports") || path.equals("/api/policies/stats")) module = "REPORTING";
    else if (path.startsWith("/api/policies")) module = "POLICY";
    else if (path.startsWith("/api/audit-logs")) module = "AUDIT";
    else return null;
    return module + "." + action;
  }

  private static boolean valid(String role, String permission) {
    if (role == null || !MODULES.containsKey(role)) return false;
    String[] parts = permission.split("\\.");
    return parts.length == 2 && MODULES.get(role).contains(parts[0])
        && Set.of("READ", "WRITE").contains(parts[1])
        && !(Set.of("AUDIT", "REPORTING").contains(parts[0]) && "WRITE".equals(parts[1]));
  }
  private static String key(String role, String permission) { return "rbac." + role + "." + permission; }
}
