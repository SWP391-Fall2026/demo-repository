package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.billing.service.InvoiceService;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignUnitWorkflow {

  private final ReservationRepository reservations;
  private final com.swp391.selfstorage.modules.facility.repository.FacilityRepository facilities;
  private final ActorContext actor;
  private final InvoiceService invoices;

  public AssignUnitWorkflow(
    ReservationRepository r,
    com.swp391.selfstorage.modules.facility.repository.FacilityRepository facilities,
    ActorContext a,
    InvoiceService i
  ) {
    reservations = r;
    this.facilities = facilities;
    actor = a;
    invoices = i;
  }

  @Transactional
  public Reservation execute(String id, Map<String, Object> d) {
    var m = actor.require("FMANAGER");
    facilities.lockByCode(m.getFacilityCode()).orElseThrow(Inputs::missing);
    var r = reservations.lockById(id).orElseThrow(Inputs::missing);
    actor.facility(m, r.getFacilityCode());
    if (!"RESERVED".equals(r.getStatus())) throw Inputs.conflict("Đơn chưa đặt cọc thành công");
    invoices.requirePaid(id, "DEPOSIT");
    throw Inputs.conflict("Unit được tự động gán khi khách gửi yêu cầu check-in từ thẻ hẹn");
  }
}
