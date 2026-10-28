package com.swp391.selfstorage.modules.rental.job;

import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RentalExpiryJob {

  private final ContractRepository contracts;
  private final UnitRepository units;
  private final Clock clock;
  private final PolicyService policy;
  private final InvoiceRepository invoices;

  public RentalExpiryJob(ContractRepository c, UnitRepository u, Clock cl, PolicyService p, InvoiceRepository i) {
    contracts = c; units = u; clock = cl; policy = p; invoices = i;
  }

  @Scheduled(fixedDelayString = "${app.rental-monitor-ms:60000}")
  @Transactional
  public void monitor() {
    var now = LocalDateTime.now(clock);
    for (var found : contracts.findAll()) {
      if (found.getEndAt() == null || !Set.of("ACTIVE", "EXPIRING_SOON").contains(found.getStatus())) continue;
      if ("ACTIVE".equals(found.getStatus()) && !now.isAfter(found.getEndAt())
          && !now.isBefore(found.getEndAt().minusDays(7))) {
        var expiring = contracts.lockById(found.getId()).orElseThrow();
        createRenewalInvoiceIfMissing(expiring, now);
        if ("ACTIVE".equals(expiring.getStatus())) {
          expiring.setStatus("EXPIRING_SOON");
          contracts.save(expiring);
        }
        continue;
      }
      long graceDays = policy.value("gracePeriodDays", BigDecimal.valueOf(3)).longValueExact();
      if (now.isAfter(found.getEndAt().plusDays(graceDays))) {
        var c = contracts.lockById(found.getId()).orElseThrow();
        if (
          !Set.of("ACTIVE", "EXPIRING_SOON").contains(c.getStatus()) ||
          !now.isAfter(c.getEndAt().plusDays(graceDays))
        ) continue;
        c.setStatus("OVERDUE");
        c.setPinCode(null);
        contracts.save(c);
        units.lockByCode(c.getUnitCode()).ifPresent(u -> {
          u.setPinCode(null);
          u.setTemporaryPin(null);
          u.setTemporaryPinExpiresAt(null);
          units.save(u);
        });
      }
    }
  }

  private void createRenewalInvoiceIfMissing(com.swp391.selfstorage.modules.rental.entity.Contract contract, LocalDateTime now) {
    if (!invoices.findByContractIdAndInvoiceTypeAndStatus(contract.getId(), "RENEW", "PENDING").isEmpty()) return;
    Invoice invoice = new Invoice();
    invoice.setId("INV-RENEW-" + UUID.randomUUID());
    invoice.setContractId(contract.getId());
    invoice.setUserId(contract.getUserId());
    invoice.setFacilityCode(contract.getFacilityCode());
    invoice.setInvoiceType("RENEW");
    invoice.setAmount(contract.getMonthlyFee());
    invoice.setStatus("PENDING");
    invoice.setIssuedAt(now);
    invoice.setDueAt(contract.getEndAt());
    invoice.setDescription("RENEW:1");
    invoice.setPriceSnapshot("monthly=" + contract.getMonthlyFee());
    invoices.save(invoice);
  }
}
