package com.swp391.selfstorage.modules.rental;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.application.workflow.PaidRentActivationService;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PaidRentActivationServiceTest {
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final PaidRentActivationService service = new PaidRentActivationService(contracts, invoices, units);

  @Test void issuesPinOnlyAfterPaidRentForStaffCreatedContract() {
    Reservation reservation = new Reservation();
    reservation.setId("RSV-1"); reservation.setUserId("USR-1"); reservation.setUnitCode("HN-CG-001");
    Invoice invoice = new Invoice(); invoice.setInvoiceType("RENT"); invoice.setReservationId("RSV-1");
    invoice.setStatus("PAID");
    Contract contract = new Contract(); contract.setId("CTR-1"); contract.setReservationId("RSV-1");
    contract.setUserId("USR-1"); contract.setUnitCode("HN-CG-001"); contract.setStatus("PENDING_PAYMENT");
    when(contracts.findByReservationId("RSV-1")).thenReturn(Optional.of(contract));
    when(contracts.save(any(Contract.class))).thenAnswer(call -> call.getArgument(0));
    when(invoices.save(any(Invoice.class))).thenAnswer(call -> call.getArgument(0));
    Unit unit = new Unit(); unit.setCode("HN-CG-001");
    when(units.lockByCode("HN-CG-001")).thenReturn(Optional.of(unit));

    Contract activated = service.activate(invoice, reservation);

    assertEquals("PENDING_HANDOVER", activated.getStatus());
    assertNotNull(activated.getPinCode());
    assertEquals(6, activated.getPinCode().length());
    assertEquals("CTR-1", invoice.getContractId());
    assertEquals(activated.getPinCode(), unit.getPinCode());
  }

  @Test void refusesToReissuePinForAlreadyPaidContract() {
    Reservation reservation = new Reservation(); reservation.setId("RSV-1"); reservation.setUserId("USR-1"); reservation.setUnitCode("HN-CG-001");
    Invoice invoice = new Invoice(); invoice.setInvoiceType("RENT"); invoice.setReservationId("RSV-1");
    Contract contract = new Contract(); contract.setReservationId("RSV-1"); contract.setUserId("USR-1");
    contract.setUnitCode("HN-CG-001"); contract.setStatus("PENDING_HANDOVER"); contract.setPinCode("123456");
    when(contracts.findByReservationId("RSV-1")).thenReturn(Optional.of(contract));

    assertThrows(org.springframework.web.server.ResponseStatusException.class,
        () -> service.activate(invoice, reservation));
    verify(invoices, never()).save(any());
    verify(units, never()).lockByCode(any());
  }
}
