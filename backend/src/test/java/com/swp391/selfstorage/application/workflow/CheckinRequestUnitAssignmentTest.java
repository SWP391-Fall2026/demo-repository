package com.swp391.selfstorage.application.workflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;

class CheckinRequestUnitAssignmentTest {
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final DailyTaskRepository tasks = mock(DailyTaskRepository.class);
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final UserRepository users = mock(UserRepository.class);
  private final InvoiceService invoices = mock(InvoiceService.class);
  private final InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
  private final PolicyService policies = mock(PolicyService.class);
  private final TaskService taskService = mock(TaskService.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final CheckinWorkflow workflow = new CheckinWorkflow(
      reservations, tasks, facilities, units, users, invoices, invoiceRepository,
      policies, new ObjectMapper(), taskService, actor, java.time.Clock.systemUTC(),
      contracts, mock(ApplicationEventPublisher.class));

  @Test
  void customerRequestAssignsMatchingUnitAndCreatesTaskOnce() {
    User customer = new User();
    customer.setId("USR-CUSTOMER");
    Reservation reservation = new Reservation();
    reservation.setId("RSV-1");
    reservation.setUserId(customer.getId());
    reservation.setFacilityCode("HN-CG");
    reservation.setUnitType("S");
    reservation.setCustomerName("Test Customer");
    reservation.setStatus("RESERVED");
    Unit unit = new Unit();
    unit.setCode("HN-CG-S-01");
    unit.setFacilityCode("HN-CG");
    unit.setType("S");
    unit.setStatus("available");
    DailyTask task = new DailyTask();
    task.setId("TSK-1");
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(actor.visible(customer, customer.getId(), "HN-CG")).thenReturn(true);
    when(reservations.lockById("RSV-1")).thenReturn(Optional.of(reservation));
    when(units.lockAvailableByFacilityAndType("HN-CG", "S", PageRequest.of(0, 1)))
        .thenReturn(List.of(unit));
    when(reservations.save(any(Reservation.class))).thenAnswer(call -> call.getArgument(0));
    when(tasks.findByReservationIdAndTaskType("RSV-1", "CHECKIN"))
        .thenReturn(Optional.empty());
    when(taskService.requestCheckin(reservation)).thenReturn(task);

    assertEquals(task, workflow.request("RSV-1"));
    assertEquals("HN-CG-S-01", reservation.getUnitCode());
    assertEquals("RSV-1", unit.getHeldByReservationId());
    assertEquals("reserved", unit.getStatus());
    verify(invoices).requirePaid("RSV-1", "DEPOSIT");
    verify(taskService).requestCheckin(reservation);
    verify(units).lockAvailableByFacilityAndType("HN-CG", "S", PageRequest.of(0, 1));
  }

  @Test
  void retryReusesExistingUnitAndTask() {
    User customer = new User();
    customer.setId("USR-CUSTOMER");
    Reservation reservation = new Reservation();
    reservation.setId("RSV-1");
    reservation.setUserId(customer.getId());
    reservation.setFacilityCode("HN-CG");
    reservation.setUnitType("S");
    reservation.setUnitCode("HN-CG-S-01");
    reservation.setStatus("RESERVED");
    Unit unit = new Unit();
    unit.setCode("HN-CG-S-01");
    unit.setFacilityCode("HN-CG");
    unit.setType("S");
    unit.setHeldByReservationId("RSV-1");
    unit.setStatus("reserved");
    DailyTask task = new DailyTask();
    when(actor.require("CUSTOMER")).thenReturn(customer);
    when(actor.visible(customer, customer.getId(), "HN-CG")).thenReturn(true);
    when(reservations.lockById("RSV-1")).thenReturn(Optional.of(reservation));
    when(units.lockByCode("HN-CG-S-01")).thenReturn(Optional.of(unit));
    when(tasks.findByReservationIdAndTaskType("RSV-1", "CHECKIN"))
        .thenReturn(Optional.of(task));

    assertEquals(task, workflow.request("RSV-1"));
    verify(units, never()).lockAvailableByFacilityAndType(any(), any(), any());
    verify(taskService, never()).requestCheckin(any());
  }
}
