package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HandoverWorkflow {

  private final ReservationRepository reservations;
  private final UnitRepository units;
  private final ContractRepository contracts;
  private final HandoverRecordRepository records;
  private final InvoiceService invoices;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final java.security.SecureRandom random =
    new java.security.SecureRandom();

  public HandoverWorkflow(
    ReservationRepository r,
    UnitRepository u,
    ContractRepository c,
    HandoverRecordRepository h,
    InvoiceService i,
    ActorContext a,
    AuditLogService au,
    Clock cl
  ) {
    reservations = r;
    units = u;
    contracts = c;
    records = h;
    invoices = i;
    actor = a;
    audit = au;
    clock = cl;
  }

  @Transactional
  public Contract execute(Map<String, Object> d) {
    var staff = actor.require("STAFF");
    String id = Inputs.text(d, "reservationId");
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(staff, r.getFacilityCode());
    if (
      !"RESERVED".equals(r.getStatus()) || r.getUnitCode() == null
    ) throw Inputs.conflict("Đơn phải được đặt cọc và gán phòng");
    if (
      !Boolean.TRUE.equals(d.get("customerSignatureConfirmed"))
    ) throw Inputs.bad("Cần khách xác nhận biên bản");
    invoices.requirePaid(id, "DEPOSIT");
    invoices.requirePaid(id, "RENT");
    if (contracts.findByReservationId(id).isPresent()) throw Inputs.conflict(
      "Đơn đã có hợp đồng"
    );
    var unit = units.lockByCode(r.getUnitCode()).orElseThrow(Inputs::missing);
    if (
      !"reserved".equals(unit.getStatus()) ||
      !id.equals(unit.getHeldByReservationId())
    ) throw Inputs.conflict("Kho không còn được giữ cho đơn này");
    var now = LocalDateTime.now(clock);
    Contract c = new Contract();
    c.setId("CTR-" + UUID.randomUUID());
    c.setReservationId(id);
    c.setUserId(r.getUserId());
    c.setFacilityCode(r.getFacilityCode());
    c.setUnitCode(unit.getCode());
    c.setCustomerName(r.getCustomerName());
    c.setCustomerPhone(r.getCustomerPhone());
    c.setStartAt(now);
    c.setEndAt(now.plusMonths(r.getDurationMonths()));
    c.setStartDate(now.toLocalDate());
    c.setEndDate(c.getEndAt().toLocalDate());
    c.setDurationMonths(r.getDurationMonths());
    c.setMonthlyFee(r.getMonthlyPriceSnapshot());
    c.setDepositFee(r.getDepositAmount());
    c.setPinCode(String.format("%06d", random.nextInt(1000000)));
    c.setStatus("ACTIVE");
    c.setCreatedAt(now);
    contracts.save(c);
    HandoverRecord h = new HandoverRecord();
    h.setId("HND-" + UUID.randomUUID());
    h.setContractId(c.getId());
    h.setReservationId(id);
    h.setStaffId(staff.getId());
    h.setHandoverDate(now);
    h.setCustomerSignatureConfirmed(true);
    h.setUnitConditionNotes(Inputs.text(d, "unitConditionNotes"));
    records.save(h);
    unit.setStatus("occupied");
    unit.setPinCode(c.getPinCode());
    units.save(unit);
    r.setStatus("CHECKED_IN");
    r.setArrivedAt(now);
    reservations.save(r);
    audit.record(
      "COMPLETE_HANDOVER",
      c.getId(),
      "Bàn giao kho " + unit.getCode()
    );
    return c;
  }
}
