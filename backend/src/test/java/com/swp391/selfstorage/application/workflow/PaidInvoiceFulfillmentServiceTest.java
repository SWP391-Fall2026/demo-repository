package com.swp391.selfstorage.application.workflow;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PaidInvoiceFulfillmentServiceTest {
  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final PaidInvoiceFulfillmentService service = new PaidInvoiceFulfillmentService(
      invoices, mock(ReservationRepository.class), contracts, units, new ReservationHoldPolicy(30),
      mock(PaidRentActivationService.class));

  @Test void renewalWaitsForItsOwnOverdueInvoiceAndActivatesOnce() {
    LocalDateTime now = LocalDateTime.of(2026, 11, 13, 10, 0);
    Invoice renewal = new Invoice();
    renewal.setId("INV-RENEW"); renewal.setContractId("CTR-1");
    renewal.setInvoiceType("RENEW"); renewal.setStatus("PAID");
    renewal.setDescription("RENEW:3"); renewal.setPriceSnapshot("monthly=900000");
    renewal.setIssuedAt(now.minusMinutes(1));
    Invoice overdue = new Invoice();
    overdue.setId("INV-LATE"); overdue.setContractId("CTR-1");
    overdue.setInvoiceType("OVERDUE"); overdue.setStatus("PENDING");
    overdue.setPriceSnapshot("overdue-for-renewal:INV-RENEW");
    when(invoices.findByContractIdAndInvoiceTypeAndStatus("CTR-1", "OVERDUE", "PENDING"))
        .thenReturn(List.of(overdue), List.of());
    when(invoices.lockById("INV-RENEW")).thenReturn(Optional.of(renewal));
    Contract contract = new Contract(); contract.setId("CTR-1"); contract.setUnitCode("UNIT-1");
    contract.setEndAt(now.minusDays(2)); contract.setStatus("OVERDUE");
    when(contracts.lockById("CTR-1")).thenReturn(Optional.of(contract));
    Unit unit = new Unit(); unit.setCode("UNIT-1");
    when(units.lockByCode("UNIT-1")).thenReturn(Optional.of(unit));

    service.complete(renewal, now);
    assertEquals("OVERDUE", contract.getStatus());
    overdue.setStatus("PAID");
    service.complete(overdue, now);
    assertEquals("ACTIVE", contract.getStatus());
    assertEquals(now.plusMonths(3), contract.getEndAt());
    assertEquals(new BigDecimal("900000"), contract.getMonthlyFee());
    service.complete(overdue, now.plusMinutes(1));
    assertEquals(now.plusMonths(3), contract.getEndAt());
  }
}
