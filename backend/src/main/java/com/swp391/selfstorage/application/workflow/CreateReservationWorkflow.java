package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationService;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateReservationWorkflow {

  private final ReservationRepository reservations;
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final ReservationService service;
  private final InvoiceService invoices;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final ReservationHoldPolicy holdPolicy;

  public CreateReservationWorkflow(
    ReservationRepository r,
    FacilityRepository f,
    UnitRepository u,
    ReservationService s,
    InvoiceService i,
    ActorContext a,
    AuditLogService au,
    Clock c,
    ReservationHoldPolicy holdPolicy
  ) {
    reservations = r;
    facilities = f;
    units = u;
    service = s;
    invoices = i;
    actor = a;
    audit = au;
    clock = c;
    this.holdPolicy = holdPolicy;
  }

  @Transactional
  public Reservation execute(CreateReservationRequest d) {
    var customer = actor.require("CUSTOMER");
    var now = LocalDateTime.now(clock);
    if (d.rentalStartAt().isBefore(d.appointmentAt())) {
      throw Inputs.bad("Ngày bắt đầu thuê không được trước ngày check-in");
    }
    if (
      d.rentalStartAt().isBefore(now) ||
      !d.startDate().equals(d.rentalStartAt().toLocalDate()) ||
      d.startDate().isBefore(now.toLocalDate()) ||
      d.appointmentAt().isBefore(now)
    ) throw Inputs.bad("Ngày thuê và lịch hẹn không được trong quá khứ");
    facilities.lockByCode(d.facilityCode()).orElseThrow(Inputs::missing);
    long available = units
      .findByFacilityCode(d.facilityCode())
      .stream()
      .filter(
        u ->
          "available".equals(u.getStatus()) && d.unitType().equals(u.getType())
      )
      .count();
    long held = reservations
      .countUnassignedHolds(d.facilityCode(), now.minus(holdPolicy.pendingPaymentHold()))
      .stream()
      .filter(hold -> d.unitType().equals(hold.getUnitType()))
      .mapToLong(ReservationRepository.HoldCount::getQuantity)
      .sum();
    if (available <= held) throw Inputs.conflict("Loại kho đã hết chỗ");
    var quote = service.quote(
      Map.of(
        "facilityCode",
        d.facilityCode(),
        "unitType",
        d.unitType(),
        "durationMonths",
        d.durationMonths()
      )
    );
    Reservation r = new Reservation();
    r.setId("RSV-" + UUID.randomUUID());
    r.setUserId(customer.getId());
    r.setCustomerName(customer.getName());
    r.setCustomerPhone(customer.getPhone());
    r.setFacilityCode(d.facilityCode());
    r.setUnitType(d.unitType());
    r.setDurationMonths(d.durationMonths());
    r.setStartDate(d.startDate());
    r.setRentalStartAt(d.rentalStartAt());
    r.setAppointmentAt(d.appointmentAt());
    r.setAppointment(d.appointmentAt().toString());
    r.setDepositAmount((BigDecimal) quote.get("depositAmount"));
    r.setMonthlyPriceSnapshot((BigDecimal) quote.get("monthlyRate"));
    r.setReservationHoldDaysSnapshot((Integer) quote.get("reservationHoldDays"));
    r.setRefundCancelHoursSnapshot((Integer) quote.get("refundCancelHours"));
    r.setStatus("PENDING_PAYMENT");
    r.setCreatedAt(now);
    r.setExtensionMinutes(0);
    r.setExtensionUsed(false);
    r.setIncidentOpen(false);
    reservations.save(r);
    invoices.issue(
      r.getId(),
      null,
      r.getUserId(),
      r.getFacilityCode(),
      "DEPOSIT",
      r.getDepositAmount(),
      now.plus(holdPolicy.pendingPaymentHold()),
      quote.toString()
    );
    audit.record(
      "CREATE_RESERVATION",
      r.getId(),
      "Giữ giá " + holdPolicy.pendingPaymentHold().toMinutes() + " phút và giữ số lượng theo loại kho"
    );
    return r;
  }
}
