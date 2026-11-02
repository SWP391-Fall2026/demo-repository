package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.service.OverdueFeeCalculator;
import com.swp391.selfstorage.modules.rental.service.RenewalService;
import java.math.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;

class RenewalServiceOverdueTest {
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final InvoiceService invoices = mock(InvoiceService.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final PolicyService policy = mock(PolicyService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final RenewalService service = new RenewalService(contracts, units, invoices, actor, audit, policy, new OverdueFeeCalculator(), clock);
  private final User customer = new User();
  private final Contract contract = new Contract();
  private final Unit unit = new Unit();

  @BeforeEach void setUp() {
    customer.setId("CUS-1");
    contract.setId("CTR-1"); contract.setUserId("CUS-1"); contract.setFacilityCode("HN-CG");
    contract.setUnitCode("U-1"); contract.setStatus("OVERDUE");
    contract.setEndAt(LocalDateTime.of(2026, 10, 1, 0, 0)); contract.setEndDate(contract.getEndAt().toLocalDate());
    unit.setCode("U-1"); unit.setFacilityCode("HN-CG"); unit.setPricePerMonth(new BigDecimal("1000000"));
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(contracts.findById("CTR-1")).thenReturn(Optional.of(contract));
    when(contracts.lockById("CTR-1")).thenReturn(Optional.of(contract));
    when(units.findById("U-1")).thenReturn(Optional.of(unit));
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    when(policy.value(eq("gracePeriodDays"), any(BigDecimal.class))).thenReturn(BigDecimal.valueOf(3));
    when(policy.fee("overdueDailyFee")).thenReturn(new BigDecimal("50000"));
    when(policy.cap("HN-CG")).thenReturn(new BigDecimal("50"));
    when(policy.feeAfterWaiver(eq("overdue"), any(BigDecimal.class))).thenAnswer(invocation -> invocation.getArgument(1));
  }

  @Test void overdueQuoteIncludesCappedFee() {
    var q = service.quote("CTR-1", 1);
    assertEquals(new BigDecimal("500000"), q.get("overdueFee"));
    assertEquals(new BigDecimal("1500000"), q.get("totalAmount"));
  }

  @Test void paidOverdueRenewalRestoresActiveStateAndPins() {
    service.activatePaidRenewal(paidInvoice(), LocalDateTime.of(2026, 11, 2, 0, 0));
    assertEquals("ACTIVE", contract.getStatus());
    assertEquals("1000000", contract.getMonthlyFee().toPlainString());
    assertNotNull(contract.getPinCode()); assertEquals(6, contract.getPinCode().length());
    assertEquals(contract.getPinCode(), unit.getPinCode());
    verify(contracts).save(contract); verify(units).save(unit);
  }

  @Test void terminatedOrCheckoutRequestedCannotRenew() {
    contract.setStatus("TERMINATED");
    assertThrows(ResponseStatusException.class, () -> service.activatePaidRenewal(paidInvoice(), null));
    contract.setStatus("OVERDUE"); contract.setCheckoutRequestedAt(LocalDateTime.now(clock));
    assertThrows(ResponseStatusException.class, () -> service.activatePaidRenewal(paidInvoice(), null));
  }

  private Invoice paidInvoice() {
    Invoice invoice = new Invoice(); invoice.setInvoiceType("RENEW"); invoice.setStatus("PAID");
    invoice.setContractId("CTR-1"); invoice.setUserId("CUS-1"); invoice.setFacilityCode("HN-CG");
    invoice.setDescription("RENEW:1"); invoice.setPriceSnapshot("monthly=1000000"); return invoice;
  }
}
