package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Keeps contract status and virtual lock state aligned with contract dates. */
@Service
public class ContractLifecycleService {
    private final ContractRepository contractRepository;
    private final UnitRepository unitRepository;
    private final PolicyAnalyticsService policyAnalyticsService;
    private final PaymentRepository paymentRepository;

    public ContractLifecycleService(ContractRepository contractRepository,
            UnitRepository unitRepository, PolicyAnalyticsService policyAnalyticsService,
            PaymentRepository paymentRepository) {
        this.contractRepository = contractRepository;
        this.unitRepository = unitRepository;
        this.policyAnalyticsService = policyAnalyticsService;
        this.paymentRepository = paymentRepository;
    }

    @Scheduled(fixedDelayString = "${app.contracts.lifecycle-check-ms:3600000}")
    @Transactional
    public void refreshContractStatuses() {
        LocalDate today = LocalDate.now();
        int graceDays = gracePeriodDays();
        List<Contract> contracts = contractRepository.findByStatusIn(
                List.of("ACTIVE", "EXPIRING_SOON", "OVERDUE"));
        for (Contract contract : contracts) {
            if (contract.getCheckoutRequestedAt() != null || contract.getEndDate() == null) continue;
            LocalDate endDate = contract.getEndDate();
            long daysUntilEnd = ChronoUnit.DAYS.between(today, endDate);
            if (daysUntilEnd >= 0 && daysUntilEnd <= 7) {
                if (!"EXPIRING_SOON".equals(contract.getStatus())) {
                    contract.setStatus("EXPIRING_SOON");
                    contractRepository.save(contract);
                }
                createRenewalInvoiceIfMissing(contract);
                continue;
            }
            if (daysUntilEnd < -graceDays) {
                contract.setStatus("OVERDUE");
                contract.setPinCode(null);
                contractRepository.save(contract);
                unitRepository.findById(contract.getUnitCode()).ifPresent(unit -> {
                    unit.setPinCode("000000");
                    unitRepository.save(unit);
                });
            }
        }
    }

    private void createRenewalInvoiceIfMissing(Contract contract) {
        if (paymentRepository.findByContractIdAndInvoiceTypeAndStatus(
                contract.getId(), "RENEW", "PENDING").isPresent()) return;
        Payment invoice = new Payment();
        invoice.setId("INV-RENEW-" + UUID.randomUUID());
        invoice.setContractId(contract.getId());
        invoice.setCustomerName(contract.getCustomerName());
        invoice.setInvoiceType("RENEW");
        invoice.setAmount(contract.getMonthlyFee() == null ? java.math.BigDecimal.ZERO : contract.getMonthlyFee());
        invoice.setPaymentMethod("VietQR Napas247");
        invoice.setStatus("PENDING");
        invoice.setCreatedAt(java.time.LocalDateTime.now());
        paymentRepository.save(invoice);
    }

    private int gracePeriodDays() {
        Object value = policyAnalyticsService.getPricingPolicies().get("gracePeriodDays");
        return value instanceof Number number ? Math.max(0, number.intValue()) : 3;
    }

}
