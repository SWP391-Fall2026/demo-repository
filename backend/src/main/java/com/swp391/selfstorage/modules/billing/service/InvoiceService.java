package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

  public boolean hasPendingRenewal(String id) {
    return !repo
      .findByContractIdAndInvoiceTypeAndStatus(id, "RENEW", "PENDING")
      .isEmpty();
  }

  public java.util.Optional<Invoice> findPendingRenewal(String id) {
    return repo.findByContractIdAndInvoiceTypeAndStatus(id, "RENEW", "PENDING").stream().findFirst();
  }

  public java.util.List<Invoice> lockPendingRenewals(String id) {
    return repo.lockPendingRenewals(id);
  }

  public Optional<String> renewalContractId(String invoiceId) { return repo.findRenewalContractId(invoiceId); }
  public Optional<String> renewalContractIdByTransaction(String code) { return repo.findRenewalContractIdByTransaction(code); }

  public void expire(Invoice invoice) { invoice.setStatus("EXPIRED"); repo.save(invoice); }

  private final InvoiceRepository repo;
  private final ActorContext actor;
  private final ContractRepository contracts;

  public InvoiceService(InvoiceRepository r, ActorContext a, ContractRepository c) {
    repo = r;
    actor = a;
    contracts = c;
  }

  public List<Invoice> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return repo
      .findAll()
      .stream()
      .filter(i -> actor.visible(u, i.getUserId(), i.getFacilityCode()))
      .toList();
  }

  public Invoice issue(
    String reservation,
    String contract,
    String user,
    String facility,
    String type,
    BigDecimal amount,
    LocalDateTime due,
    String snapshot
  ) {
    Invoice i = new Invoice();
    i.setId("INV-" + UUID.randomUUID());
    i.setReservationId(reservation);
    i.setContractId(contract);
    i.setUserId(user);
    i.setFacilityCode(facility);
    i.setInvoiceType(type);
    i.setAmount(amount);
    i.setStatus("PENDING");
    i.setIssuedAt(LocalDateTime.now());
    i.setDueAt(due);
    i.setDescription(type);
    i.setPriceSnapshot(snapshot);
    return repo.save(i);
  }

  /**
   * Issue a standalone EXTRA invoice for a contract (damage, lost key, or
   * another charge). Only staff or the facility manager for the contract's
   * facility may create it; customer payment still goes through the normal
   * invoice payment workflow.
   */
  @Transactional
  public Invoice issueExtra(Map<String, Object> d) {
    var staff = actor.require("STAFF", "FMANAGER");
    String contractId = Inputs.text(d, "contractId");
    Contract contract = contracts.lockById(contractId).orElseThrow(Inputs::missing);
    if (!actor.visible(staff, contract.getUserId(), contract.getFacilityCode())) {
      throw Inputs.missing();
    }
    if ("TERMINATED".equals(contract.getStatus())) {
      throw Inputs.conflict("Hợp đồng đã kết thúc, không thể phát hành phụ phí");
    }
    BigDecimal amount = Inputs.money(d.get("amount"));
    if (amount.signum() <= 0 || amount.scale() > 2) {
      throw Inputs.bad("Phụ phí phải là số tiền dương, tối đa 2 chữ số thập phân");
    }
    String category = Inputs.text(d, "category").toUpperCase(Locale.ROOT);
    if (!Set.of("LOST_KEY", "DAMAGE", "OVERDUE", "OTHER").contains(category)) {
      throw Inputs.bad("Loại phụ phí không hợp lệ");
    }
    String description = Inputs.text(d, "description");
    if (description.length() > 255) throw Inputs.bad("Mô tả phụ phí quá dài");
    LocalDateTime dueAt = LocalDateTime.now().plusDays(3);
    String due = Inputs.optional(d, "dueAt");
    if (!due.isBlank()) {
      try { dueAt = LocalDateTime.parse(due); }
      catch (Exception e) { throw Inputs.bad("dueAt phải là ISO date-time"); }
    }
    String snapshot = "{\"category\":\"" + category + "\",\"source\":\"INCIDENT\"}";
    Invoice invoice = issue(null, contract.getId(), contract.getUserId(), contract.getFacilityCode(),
        "EXTRA", amount, dueAt, snapshotWithDescription(snapshot, description));
    invoice.setDescription(description);
    // `issue` already persists invoice. Entity remains managed inside this
    // transaction, so description update flushes with single INSERT/UPDATE.
    return invoice;
  }

  private String snapshotWithDescription(String snapshot, String description) {
    return snapshot.substring(0, snapshot.length() - 1) + ",\"description\":\""
        + description.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
  }

  public void requirePaid(String reservation, String type) {
    var i = repo
      .findByReservationIdAndInvoiceType(reservation, type)
      .orElseThrow(() -> Inputs.conflict("Chưa có hóa đơn " + type));
    if (!"PAID".equals(i.getStatus())) throw Inputs.conflict(
      "Chưa thanh toán đủ " + type
    );
  }

  @Transactional
  public void linkRentInvoiceToContract(String reservation, String contract) {
    repo.findByReservationIdAndInvoiceType(reservation, "RENT").ifPresent(invoice -> {
      invoice.setContractId(contract);
      repo.save(invoice);
    });
  }
}
