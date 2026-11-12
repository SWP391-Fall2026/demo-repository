package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.service.AccessCodeService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class AccessCodeServiceTest {

  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final Instant fixedInstant = Instant.parse("2026-11-11T00:00:00Z");
  private final Clock clock = Clock.fixed(fixedInstant, ZoneOffset.UTC);
  private final AccessCodeService service = new AccessCodeService(contracts, units, actor, audit, clock);

  private User customer() {
    User u = new User();
    u.setId("USR-01");
    u.setRole("CUSTOMER");
    return u;
  }

  private Contract contract(String status, LocalDateTime endAt) {
    Contract c = new Contract();
    c.setId("CTR-1");
    c.setUserId("USR-01");
    c.setFacilityCode("HN-CG");
    c.setUnitCode("HN-CG-001");
    c.setStatus(status);
    c.setPinCode("654321");
    c.setEndAt(endAt);
    return c;
  }

  @Test
  void expiringSoonAllowsPinAtExactEndAtAndRejectsOneSecondAfter() {
    User customer = customer();
    when(actor.require("CUSTOMER", "STAFF", "FMANAGER")).thenReturn(customer);
    when(actor.visible(customer, "USR-01", "HN-CG")).thenReturn(true);
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc("HN-CG-001", List.of("OVERDUE")))
        .thenReturn(Optional.empty());

    LocalDateTime now = LocalDateTime.now(clock);
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        "HN-CG-001", List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")))
        .thenReturn(Optional.of(contract("EXPIRING_SOON", now)));

    var atBoundary = service.verify(Map.of("unitCode", "HN-CG-001", "pin", "654321"));
    assertEquals(true, atBoundary.get("authorized"));
    assertEquals("OK", atBoundary.get("reason"));

    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        "HN-CG-001", List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")))
        .thenReturn(Optional.of(contract("EXPIRING_SOON", now.minusSeconds(1))));

    var expired = service.verify(Map.of("unitCode", "HN-CG-001", "pin", "654321"));
    assertEquals(false, expired.get("authorized"));
    assertEquals("CONTRACT_EXPIRED", expired.get("reason"));
  }

  @Test
  void overdueContractIsRejectedEvenWithCorrectPin() {
    User customer = customer();
    when(actor.require("CUSTOMER", "STAFF", "FMANAGER")).thenReturn(customer);
    when(actor.visible(customer, "USR-01", "HN-CG")).thenReturn(true);
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        "HN-CG-001", List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")))
        .thenReturn(Optional.empty());
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc("HN-CG-001", List.of("OVERDUE")))
        .thenReturn(Optional.of(contract("OVERDUE", LocalDateTime.now(clock).plusDays(1))));

    var overdue = service.verify(Map.of("unitCode", "HN-CG-001", "pin", "654321"));
    assertEquals(false, overdue.get("authorized"));
    assertEquals("OVERDUE_LOCKED", overdue.get("reason"));
  }

  @Test
  void wrongPinAndMissingContractAreDeniedWithClearReason() {
    User customer = customer();
    when(actor.require("CUSTOMER", "STAFF", "FMANAGER")).thenReturn(customer);
    when(actor.visible(customer, "USR-01", "HN-CG")).thenReturn(true);
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc("HN-CG-001", List.of("OVERDUE")))
        .thenReturn(Optional.empty());
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        "HN-CG-001", List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")))
        .thenReturn(Optional.of(contract("ACTIVE", LocalDateTime.now(clock).plusDays(5))));

    var wrongPin = service.verify(Map.of("unitCode", "HN-CG-001", "pin", "000000"));
    assertEquals(false, wrongPin.get("authorized"));
    assertEquals("WRONG_PIN", wrongPin.get("reason"));

    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
        "HN-CG-001", List.of("ACTIVE", "EXPIRING_SOON", "CHECKOUT_REQUESTED")))
        .thenReturn(Optional.empty());
    var missing = service.verify(Map.of("unitCode", "HN-CG-001", "pin", "654321"));
    assertEquals(false, missing.get("authorized"));
    assertEquals("NO_ACTIVE_CONTRACT", missing.get("reason"));
  }
}

