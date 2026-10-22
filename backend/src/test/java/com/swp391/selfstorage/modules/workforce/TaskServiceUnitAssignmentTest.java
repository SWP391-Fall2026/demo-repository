package com.swp391.selfstorage.modules.workforce;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import com.swp391.selfstorage.modules.workforce.service.TaskService;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

class TaskServiceUnitAssignmentTest {
  private final DailyTaskRepository tasks = mock(DailyTaskRepository.class);
  private final UserRepository users = mock(UserRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private final UnitRepository units = mock(UnitRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final InvoiceService invoices = mock(InvoiceService.class);
  private final PasswordEncoder encoder = mock(PasswordEncoder.class);
  private final TaskService service = new TaskService(
      tasks, users, actor, mock(AuditLogService.class), facilities, units,
      reservations, invoices, Clock.systemUTC(), encoder);

  @Test
  void assigningLegacyCheckinTaskAutomaticallyBindsMatchingUnit() {
    User manager = new User();
    manager.setId("USR-MANAGER");
    manager.setFacilityCode("HN-CG");
    User staff = new User();
    staff.setId("USR-STAFF");
    staff.setName("Test Staff");
    staff.setFacilityCode("HN-CG");
    Reservation reservation = new Reservation();
    reservation.setId("RSV-LEGACY");
    reservation.setFacilityCode("HN-CG");
    reservation.setUnitType("S");
    reservation.setCustomerName("Test Customer");
    reservation.setStatus("RESERVED");
    DailyTask task = new DailyTask();
    task.setId("TSK-LEGACY");
    task.setTaskType("CHECKIN");
    task.setReservationId(reservation.getId());
    task.setFacilityCode("HN-CG");
    task.setStatus("PENDING");
    Unit unit = new Unit();
    unit.setCode("HN-CG-S-02");
    unit.setFacilityCode("HN-CG");
    unit.setType("S");
    unit.setStatus("available");
    when(actor.require("FMANAGER")).thenReturn(manager);
    when(actor.role(staff)).thenReturn("STAFF");
    when(tasks.findById(task.getId())).thenReturn(Optional.of(task));
    when(users.findById(staff.getId())).thenReturn(Optional.of(staff));
    when(reservations.lockById(reservation.getId())).thenReturn(Optional.of(reservation));
    when(reservations.findById(reservation.getId())).thenReturn(Optional.of(reservation));
    when(units.lockAvailableByFacilityAndType("HN-CG", "S", PageRequest.of(0, 1)))
        .thenReturn(List.of(unit));
    when(units.lockByCode(unit.getCode())).thenReturn(Optional.of(unit));
    when(encoder.encode(any())).thenReturn("encoded-pin");
    when(tasks.save(any(DailyTask.class))).thenAnswer(call -> call.getArgument(0));

    service.assignExisting(task.getId(), Map.of("staffId", staff.getId()));

    assertEquals(unit.getCode(), reservation.getUnitCode());
    assertEquals(unit.getCode(), task.getUnitCode());
    assertEquals("reserved", unit.getStatus());
    assertEquals(reservation.getId(), unit.getHeldByReservationId());
    assertEquals(staff.getId(), task.getStaffId());
    verify(invoices).requirePaid(reservation.getId(), "DEPOSIT");
    verify(units).lockAvailableByFacilityAndType("HN-CG", "S", PageRequest.of(0, 1));
  }
}
