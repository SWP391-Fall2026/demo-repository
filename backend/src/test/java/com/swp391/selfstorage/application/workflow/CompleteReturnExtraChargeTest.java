package com.swp391.selfstorage.application.workflow;

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
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.rental.service.OverdueFeeCalculator;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class CompleteReturnExtraChargeTest {
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final InspectionRecordRepository inspections = mock(InspectionRecordRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final PolicyService policy = mock(PolicyService.class);
  private final InvoiceService invoices = mock(InvoiceService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final CompleteReturnWorkflow workflow = new CompleteReturnWorkflow(contracts, inspections, units, actor, policy,
    new OverdueFeeCalculator(), mock(AuditLogService.class), clock, mock(TaskService.class), invoices);
  private final Contract contract = new Contract();

  @BeforeEach void prepare() {
    User staff = new User(); staff.setId("ST-1"); staff.setFacilityCode("HN-CG");
    contract.setId("C-1"); contract.setUserId("CUS-1"); contract.setFacilityCode("HN-CG"); contract.setUnitCode("U-1");
    contract.setStatus("ACTIVE"); contract.setCheckoutRequestedAt(LocalDateTime.now(clock));
    contract.setEndAt(LocalDateTime.now(clock).plusDays(1)); contract.setDepositFee(new BigDecimal("100000"));
    Unit unit = new Unit(); unit.setCode("U-1"); unit.setFacilityCode("HN-CG"); unit.setPricePerMonth(new BigDecimal("800000"));
    when(actor.require("STAFF")).thenReturn(staff);
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection())).thenReturn(Optional.of(contract));
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    when(policy.value(eq("gracePeriodDays"), any())).thenReturn(BigDecimal.valueOf(3));
    when(policy.cap("HN-CG")).thenReturn(BigDecimal.valueOf(50));
    when(policy.fee(anyString())).thenReturn(BigDecimal.ZERO);
    when(policy.feeAfterWaiver(eq("overdue"), any())).thenReturn(BigDecimal.ZERO);
    when(policy.feeAfterWaiver(eq("cleaning"), any())).thenReturn(new BigDecimal("200000"));
    when(policy.feeAfterWaiver(eq("lock"), any())).thenReturn(new BigDecimal("150000"));
    when(invoices.issue(isNull(), eq("C-1"), eq("CUS-1"), eq("HN-CG"), eq("EXTRA"), any(), any(), anyString()))
      .thenAnswer(call -> { Invoice i = new Invoice(); i.setId("I-EXTRA"); i.setAmount(call.getArgument(5)); return i; });
  }

  @Test void issuesOnlyFeesAboveDepositAndCannotIssueTwiceAfterTermination() {
    var request = Map.<String, Object>of("unitCode", "U-1", "cleanlinessStatus", "DIRTY", "damageNotes", "Mất khóa", "lockDamaged", true);
    var result = workflow.execute(request);
    assertEquals(new BigDecimal("250000"), result.get("extraCharge"));
    assertEquals("I-EXTRA", result.get("extraInvoiceId"));
    assertEquals(BigDecimal.ZERO, result.get("refundableDeposit"));
    assertEquals("TERMINATED", contract.getStatus());
    assertThrows(ResponseStatusException.class, () -> workflow.execute(request));
    verify(invoices, times(1)).issue(isNull(), eq("C-1"), eq("CUS-1"), eq("HN-CG"), eq("EXTRA"),
      eq(new BigDecimal("250000")), any(), contains("RETURN_INSPECTION"));
  }

  @Test void doesNotIssueExtraInvoiceWhenDepositCoversFees() {
    contract.setDepositFee(new BigDecimal("500000"));
    var result = workflow.execute(Map.of("unitCode", "U-1", "cleanlinessStatus", "DIRTY", "damageNotes", "Vệ sinh"));
    assertEquals(BigDecimal.ZERO, result.get("extraCharge"));
    assertEquals(new BigDecimal("300000"), result.get("refundableDeposit"));
    verify(invoices, never()).issue(any(), any(), any(), any(), any(), any(), any(), any());
  }

  @Test void terminatedContractIsExcludedBeforeInspectionOrBilling() {
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection())).thenReturn(Optional.empty());
    assertThrows(ResponseStatusException.class,
      () -> workflow.execute(Map.of("unitCode", "U-1", "cleanlinessStatus", "CLEAN", "damageNotes", "Không")));
    verifyNoInteractions(inspections, invoices);
    verify(units, never()).lockByCode(any());
  }
}
