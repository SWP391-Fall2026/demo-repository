package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.service.AccessCodeService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AccessCodeServiceTest {
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final AccessCodeService service = new AccessCodeService(contracts, units, actor, mock(AuditLogService.class), clock);
  private final Contract contract = new Contract();
  private final Unit unit = new Unit();
  private final User customer = new User();

  @BeforeEach void prepare() {
    customer.setId("CUS-1");
    contract.setUserId("CUS-1"); contract.setFacilityCode("HN-CG"); contract.setUnitCode("U-1");
    contract.setStatus("ACTIVE"); contract.setStartAt(LocalDateTime.now(clock).minusDays(1));
    contract.setEndAt(LocalDateTime.now(clock).plusDays(1)); contract.setPinCode("123456");
    unit.setCode("U-1"); unit.setFacilityCode("HN-CG"); unit.setStatus("occupied");
    unit.setTemporaryPin("654321"); unit.setTemporaryPinExpiresAt(LocalDateTime.now(clock).plusHours(8));
    when(actor.require("CUSTOMER", "STAFF", "FMANAGER")).thenReturn(customer);
    when(actor.visible(customer, "CUS-1", "HN-CG")).thenReturn(true);
    when(contracts.findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection())).thenReturn(Optional.of(contract));
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection())).thenReturn(Optional.of(contract));
    when(units.findById("U-1")).thenReturn(Optional.of(unit));
  }

  @Test void temporaryPinWorksOnlyBeforeItsExpiry() {
    assertEquals(true, service.verify(Map.of("unitCode", "U-1", "pin", "654321")).get("authorized"));
    unit.setTemporaryPinExpiresAt(LocalDateTime.now(clock));
    assertEquals(false, service.verify(Map.of("unitCode", "U-1", "pin", "654321")).get("authorized"));
    assertEquals(true, service.verify(Map.of("unitCode", "U-1", "pin", "123456")).get("authorized"));
  }

  @Test void temporaryPinCannotBypassOwnershipOrContractEnd() {
    when(actor.visible(customer, "CUS-1", "HN-CG")).thenReturn(false);
    assertEquals(false, service.verify(Map.of("unitCode", "U-1", "pin", "654321")).get("authorized"));
    when(actor.visible(customer, "CUS-1", "HN-CG")).thenReturn(true);
    contract.setEndAt(LocalDateTime.now(clock));
    assertEquals(false, service.verify(Map.of("unitCode", "U-1", "pin", "654321")).get("authorized"));
  }

  @Test void changingPermanentPinRevokesTemporaryCredential() {
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    service.update("U-1", Map.of("newPin", "112233"));
    assertEquals("112233", contract.getPinCode()); assertEquals("112233", unit.getPinCode());
    assertNull(unit.getTemporaryPin()); assertNull(unit.getTemporaryPinExpiresAt());
    var order = inOrder(contracts, units);
    order.verify(contracts).findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc("U-1", List.of("ACTIVE", "EXPIRING_SOON"));
    order.verify(units).lockByCode("U-1");
  }

  @Test void changingPinRejectsAnotherCustomerWithoutMutatingCredentials() {
    when(actor.require("CUSTOMER")).thenReturn(customer);
    contract.setUserId("OTHER-CUSTOMER");
    var failure = assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    assertEquals(HttpStatus.NOT_FOUND, failure.getStatusCode());
    assertEquals("123456", contract.getPinCode());
    verify(contracts, never()).save(any()); verify(units, never()).save(any());
  }

  @Test void changingPinRequiresContractInsideCurrentRentalDates() {
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    contract.setEndAt(LocalDateTime.now(clock));
    var expired = assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    assertEquals(HttpStatus.CONFLICT, expired.getStatusCode());
    contract.setEndAt(LocalDateTime.now(clock).plusDays(1));
    contract.setStartAt(LocalDateTime.now(clock).plusHours(1));
    assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    verify(contracts, never()).save(any()); verify(units, never()).save(any());
  }

  @Test void terminatedRentalCannotChangePin() {
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(contracts.findFirstForUpdateByUnitCodeAndStatusInOrderByCreatedAtDesc(eq("U-1"), anyCollection())).thenReturn(Optional.empty());
    assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    verify(units, never()).lockByCode(any());
    verify(contracts, never()).save(any()); verify(units, never()).save(any());
  }

  @Test void changingPinRejectsUnitNoLongerOccupiedAtSameFacility() {
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
    unit.setStatus("cleaning");
    assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    unit.setStatus("occupied"); unit.setFacilityCode("OTHER");
    assertThrows(ResponseStatusException.class, () -> service.update("U-1", Map.of("newPin", "112233")));
    verify(contracts, never()).save(any()); verify(units, never()).save(any());
  }
}
