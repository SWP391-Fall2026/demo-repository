package com.swp391.selfstorage.modules.billing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class InvoiceExtraServiceTest {
  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final InvoiceService service = new InvoiceService(invoices, actor, contracts);

  @Test void issuesExtraInvoiceForStaffContractFacility() {
    User staff = user("STAFF", "HN-CG");
    Contract contract = contract("C-1", "CUS-1", "HN-CG");
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(actor.visible(staff, "CUS-1", "HN-CG")).thenReturn(true);
    when(contracts.lockById("C-1")).thenReturn(Optional.of(contract));
    when(invoices.save(any(Invoice.class))).thenAnswer(call -> call.getArgument(0));

    var invoice = service.issueExtra(Map.of(
        "contractId", "C-1", "category", "LOST_KEY", "amount", "125000",
        "description", "Mất chìa khóa kho"));

    assertEquals("EXTRA", invoice.getInvoiceType());
    assertEquals(new BigDecimal("125000"), invoice.getAmount());
    assertEquals("CUS-1", invoice.getUserId());
    assertEquals("HN-CG", invoice.getFacilityCode());
    assertEquals("PENDING", invoice.getStatus());
    verify(invoices).save(any(Invoice.class));
  }

  @Test void rejectsExtraInvoiceOutsideStaffFacility() {
    User staff = user("STAFF", "HN-CG");
    when(actor.require("STAFF", "FMANAGER")).thenReturn(staff);
    when(contracts.lockById("C-1")).thenReturn(Optional.of(contract("C-1", "CUS-1", "HCM-Q7")));
    when(actor.visible(staff, "CUS-1", "HCM-Q7")).thenReturn(false);

    var error = assertThrows(ResponseStatusException.class, () -> service.issueExtra(Map.of(
        "contractId", "C-1", "category", "DAMAGE", "amount", "1000", "description", "Damage")));
    assertEquals(404, error.getStatusCode().value());
    verify(invoices, never()).save(any());
  }

  private static Contract contract(String id, String userId, String facility) {
    Contract c = new Contract(); c.setId(id); c.setUserId(userId); c.setFacilityCode(facility); c.setStatus("ACTIVE");
    return c;
  }

  private static User user(String role, String facility) {
    User u = new User(); u.setId("STAFF-1"); u.setRole(role); u.setFacilityCode(facility); u.setStatus("ACTIVE");
    return u;
  }
}
