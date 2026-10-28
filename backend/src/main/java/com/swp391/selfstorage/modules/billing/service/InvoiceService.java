package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
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

  private final InvoiceRepository repo;
  private final ActorContext actor;

  public InvoiceService(InvoiceRepository r, ActorContext a) {
    repo = r;
    actor = a;
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

  public void requirePaid(String reservation, String type) {
    var i = repo
      .findByReservationIdAndInvoiceType(reservation, type)
      .orElseThrow(() -> Inputs.conflict("ChÆ°a cÃ³ hÃ³a Ä‘Æ¡n " + type));
    if (!"PAID".equals(i.getStatus())) throw Inputs.conflict(
      "ChÆ°a thanh toÃ¡n Ä‘á»§ " + type
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
