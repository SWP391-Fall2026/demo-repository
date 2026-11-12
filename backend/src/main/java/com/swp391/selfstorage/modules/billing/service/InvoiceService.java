package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.util.ShortIds;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
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
      .isEmpty() ||
      !repo.findByContractIdAndInvoiceTypeAndStatus(id, "OVERDUE", "PENDING").isEmpty() ||
      !repo.findByContractIdAndInvoiceTypeAndStatus(id, "RENT", "PENDING").isEmpty();
  }

  private final InvoiceRepository repo;
  private final ActorContext actor;

  public InvoiceService(InvoiceRepository r, ActorContext a) {
    repo = r;
    actor = a;
  }

  @Transactional(readOnly = true)
  public List<Invoice> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    List<Invoice> rows = "CUSTOMER".equals(actor.role(u))
      ? repo.findByUserId(u.getId())
      : repo.findByFacilityCode(u.getFacilityCode());
    return rows.stream().sorted(Comparator.comparing(Invoice::getIssuedAt,
      Comparator.nullsFirst(Comparator.naturalOrder())).reversed()).toList();
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
    i.setId(ShortIds.next("INV"));
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
