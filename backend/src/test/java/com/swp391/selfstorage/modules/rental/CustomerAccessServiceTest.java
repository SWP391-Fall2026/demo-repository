package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.entity.CustomerAccessLog;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.CustomerAccessLogRepository;
import com.swp391.selfstorage.modules.rental.service.CustomerAccessService;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class CustomerAccessServiceTest {
  private final CustomerAccessLogRepository accessLogs = mock(CustomerAccessLogRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final Clock clock = Clock.fixed(Instant.parse("2026-11-10T10:00:00Z"), ZoneOffset.UTC);

  private final CustomerAccessService service = new CustomerAccessService(
    accessLogs, contracts, units, actor, audit, clock
  );

  @Test void approveRequestSyncsIssuedPinToContractAndUnit() {
    User manager = new User();
    manager.setId("USR-MGR"); manager.setUsername("manager"); manager.setRole("FMANAGER"); manager.setFacilityCode("HN-CG");
    when(actor.require("STAFF", "FMANAGER", "OPS_MGR", "ADMIN")).thenReturn(manager);

    CustomerAccessLog req = new CustomerAccessLog();
    req.setId("REQ-1"); req.setFacilityCode("HN-CG"); req.setContractId("CTR-1"); req.setUnitCode("HN-CG-001");
    req.setStatus("PENDING_APPROVAL"); req.setNotes("Khách yêu cầu vào kho");
    when(accessLogs.findById("REQ-1")).thenReturn(Optional.of(req));

    Contract contract = new Contract();
    contract.setId("CTR-1"); contract.setUnitCode("HN-CG-001"); contract.setPinCode("771239");
    when(contracts.findById("CTR-1")).thenReturn(Optional.of(contract));

    Unit unit = new Unit();
    unit.setCode("HN-CG-001"); unit.setPinCode("771239");
    when(units.findById("HN-CG-001")).thenReturn(Optional.of(unit));

    CustomerAccessLog approved = service.approveRequest("HN-CG", "REQ-1", Map.of("pin", "621692"));

    assertEquals("PIN_ISSUED", approved.getStatus());
    assertEquals("621692", approved.getAccessPin());
    assertEquals("621692", contract.getPinCode());
    assertEquals("621692", unit.getPinCode());
    verify(contracts).save(contract);
    verify(units).save(unit);
  }

  @Test void checkinRequiresMatchingIssuedPinWhenPinIssuedExists() {
    User customer = new User();
    customer.setId("USR-CUS"); customer.setRole("CUSTOMER");
    when(actor.require("CUSTOMER", "STAFF", "FMANAGER")).thenReturn(customer);

    Contract contract = new Contract();
    contract.setId("CTR-1"); contract.setUserId("USR-CUS"); contract.setFacilityCode("HN-CG");
    contract.setUnitCode("HN-CG-001"); contract.setStatus("ACTIVE"); contract.setPinCode("621692");
    when(contracts.findById("CTR-1")).thenReturn(Optional.of(contract));
    when(actor.visible(customer, "USR-CUS", "HN-CG")).thenReturn(true);

    CustomerAccessLog issued = new CustomerAccessLog();
    issued.setId("REQ-1"); issued.setContractId("CTR-1"); issued.setStatus("PIN_ISSUED"); issued.setAccessPin("621692");
    when(accessLogs.findFirstByContractIdAndStatusInOrderByCreatedAtDesc(
      "CTR-1", List.of("PIN_ISSUED", "PENDING_APPROVAL")
    )).thenReturn(Optional.of(issued));
    when(accessLogs.findFirstByContractIdAndCheckinAtIsNotNullAndCheckoutAtIsNullOrderByCheckinAtDesc("CTR-1"))
      .thenReturn(Optional.empty());
    when(accessLogs.save(any(CustomerAccessLog.class))).thenAnswer(inv -> inv.getArgument(0));

    assertThrows(ResponseStatusException.class, () -> service.checkin("CTR-1", Map.of("pin", "771239")));
    assertThrows(ResponseStatusException.class, () -> service.checkin("CTR-1", Map.of()));

    CustomerAccessLog granted = service.checkin("CTR-1", Map.of("pin", "621692"));
    assertEquals("GRANTED", granted.getStatus());
    assertNotNull(granted.getCheckinAt());
  }
}

