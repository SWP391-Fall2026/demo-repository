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
import com.swp391.selfstorage.modules.rental.service.OverdueManagementService;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;

class OverdueManagementServiceTest {
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final TaskService tasks = mock(TaskService.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-02T00:00:00Z"), ZoneOffset.UTC);
  private final OverdueManagementService service = new OverdueManagementService(contracts, units, actor, tasks, audit, clock);
  private final User manager = new User();
  private final Contract contract = new Contract();
  private final Unit unit = new Unit();

  @BeforeEach void setUp() {
    manager.setId("FM-1"); manager.setRole("FMANAGER"); manager.setFacilityCode("HN-CG");
    contract.setId("CTR-1"); contract.setFacilityCode("HN-CG"); contract.setUnitCode("U-1"); contract.setStatus("OVERDUE");
    contract.setPinCode("123456");
    unit.setCode("U-1"); unit.setFacilityCode("HN-CG"); unit.setPinCode("123456"); unit.setTemporaryPin("654321");
    unit.setTemporaryPinExpiresAt(LocalDateTime.now(clock).plusHours(1));
    when(actor.require("FMANAGER")).thenReturn(manager);
    when(contracts.lockById("CTR-1")).thenReturn(Optional.of(contract));
    when(units.lockByCode("U-1")).thenReturn(Optional.of(unit));
  }

  @Test void listFiltersOverdueWithinManagerFacility() {
    Contract other = new Contract(); other.setStatus("ACTIVE");
    when(contracts.findByFacilityCode("HN-CG")).thenReturn(List.of(contract, other));
    assertEquals(List.of(contract), service.list());
  }

  @Test void remindCreatesSupportTaskAndAudit() {
    service.action("CTR-1", Map.of("action", "REMIND"));
    verify(tasks).system(eq("HN-CG"), anyString(), eq("SUPPORT"), eq("U-1"), isNull(), eq("CTR-1"));
    verify(audit).record(eq("OVERDUE_REMINDER"), eq("CTR-1"), anyString());
  }

  @Test void requestReturnSetsTimestampAndReturnTask() {
    service.action("CTR-1", Map.of("action", "REQUEST_RETURN"));
    assertEquals(LocalDate.now(clock), contract.getCheckoutRequestedDate());
    assertNotNull(contract.getCheckoutRequestedAt());
    verify(tasks).system(eq("HN-CG"), anyString(), eq("RETURN"), eq("U-1"), isNull(), eq("CTR-1"));
    verify(contracts).save(contract);
  }

  @Test void lockClearsContractAndUnitCredentials() {
    service.action("CTR-1", Map.of("action", "LOCK"));
    assertNull(contract.getPinCode()); assertNull(unit.getPinCode());
    assertNull(unit.getTemporaryPin()); assertNull(unit.getTemporaryPinExpiresAt());
    verify(contracts).save(contract); verify(units).save(unit);
  }
}
