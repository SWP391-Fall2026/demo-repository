package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.entity.HandoverRecord;
import com.swp391.selfstorage.modules.rental.entity.InspectionRecord;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.HandoverRecordRepository;
import com.swp391.selfstorage.modules.rental.repository.InspectionRecordRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContractService {

  private final ContractRepository contracts;
  private final ActorContext actor;
  private final HandoverRecordRepository handovers;
  private final InvoiceRepository invoices;
  private final FacilityRepository facilities;
  private final UnitRepository units;
  private final PolicyService policies;
  private final ReservationRepository reservations;
  private final UserRepository users;
  private final InspectionRecordRepository inspections;

  public ContractService(ContractRepository c, ActorContext a, HandoverRecordRepository handovers,
      InvoiceRepository invoices, FacilityRepository facilities, UnitRepository units, PolicyService policies,
      ReservationRepository reservations, UserRepository users, InspectionRecordRepository inspections) {
    contracts = c;
    actor = a;
    this.handovers = handovers;
    this.invoices = invoices;
    this.facilities = facilities;
    this.units = units;
    this.policies = policies;
    this.reservations = reservations;
    this.users = users;
    this.inspections = inspections;
  }

  private static final Set<String> ACCESSIBLE_STATUSES = Set.of(
    "ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"
  );

  @Transactional(readOnly = true)
  public List<Contract> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    String role = actor.role(u);
    List<Contract> rows = "CUSTOMER".equals(role)
      ? contracts.findByUserId(u.getId())
      : contracts.findByFacilityCode(u.getFacilityCode());
    if (rows.isEmpty()) return List.of();

    List<String> contractIds = rows.stream().map(Contract::getId).toList();
    Map<String, HandoverRecord> handoverMap = new HashMap<>();
    for (HandoverRecord h : handovers.findByContractIdInOrderByHandoverDateDesc(contractIds)) {
      handoverMap.putIfAbsent(h.getContractId(), h);
    }
    Map<String, InspectionRecord> inspectionMap = new HashMap<>();
    for (InspectionRecord ins : inspections.findByContractIdInOrderByInspectionDateDesc(contractIds)) {
      inspectionMap.putIfAbsent(ins.getContractId(), ins);
    }
    Map<String, Facility> facilityMap = Map.of();
    if ("CUSTOMER".equals(role)) {
      Set<String> activeFacilityCodes = new HashSet<>();
      for (Contract c : rows) {
        if (ACCESSIBLE_STATUSES.contains(c.getStatus()) && c.getFacilityCode() != null) {
          activeFacilityCodes.add(c.getFacilityCode());
        }
      }
      if (!activeFacilityCodes.isEmpty()) {
        facilityMap = new HashMap<>();
        for (Facility f : facilities.findAllById(activeFacilityCodes)) {
          facilityMap.put(f.getCode(), f);
        }
      }
    }

    for (Contract c : rows) {
      applyHandover(c, handoverMap.get(c.getId()));
      applyInspection(c, inspectionMap.get(c.getId()));
      if ("CUSTOMER".equals(role)) {
        if (!ACCESSIBLE_STATUSES.contains(c.getStatus())) {
          c.setPinCode(null);
        } else {
          Facility f = facilityMap.get(c.getFacilityCode());
          if (f != null) c.setFacilityPin(f.getCheckinPin());
        }
      }
    }
    return rows.stream().sorted(Comparator.comparing(Contract::getCreatedAt,
      Comparator.nullsFirst(Comparator.naturalOrder())).reversed()).toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> detail(String id) {
    var customer = actor.require("CUSTOMER");
    Contract contract = contracts.findById(id).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, contract.getUserId(), contract.getFacilityCode())) throw Inputs.missing();
    boolean accessGranted = ACCESSIBLE_STATUSES.contains(contract.getStatus());
    if (!accessGranted) contract.setPinCode(null);
    var facility = facilities.findById(contract.getFacilityCode()).orElse(null);
    var unit = units.findById(contract.getUnitCode()).orElse(null);
    var invoiceRows = invoices.findByContractOrReservation(id, contract.getReservationId()).stream()
      .map(i -> Map.<String, Object>ofEntries(
        Map.entry("id", Objects.toString(i.getId(), "")),
        Map.entry("invoiceType", Objects.toString(i.getInvoiceType(), "")),
        Map.entry("amount", Objects.toString(i.getAmount(), "0")),
        Map.entry("status", Objects.toString(i.getStatus(), "")),
        Map.entry("issuedAt", Objects.toString(i.getIssuedAt(), "")),
        Map.entry("dueAt", Objects.toString(i.getDueAt(), ""))
      )).toList();
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("contract", contract);
    var reservation = contract.getReservationId() == null ? null : reservations.findById(contract.getReservationId()).orElse(null);
    response.put("acceptedTermsVersion", reservation == null ? null : reservation.getContractTermsVersion());
    response.put("acceptedTermsSnapshot", reservation == null ? null : reservation.getContractTermsSnapshot());
    response.put("termsAcceptedAt", reservation == null ? null : reservation.getContractTermsAcceptedAt());
    response.put("customer", Map.of(
      "name", Objects.toString(contract.getCustomerName(), ""),
      "phone", Objects.toString(contract.getCustomerPhone(), ""),
      "email", Objects.toString(customer.getEmail(), "")
    ));
    response.put("facility", facility == null ? Map.of("code", contract.getFacilityCode()) : Map.of(
      "code", facility.getCode(), "name", facility.getName(), "address", facility.getAddress(),
      "city", facility.getCity(), "hotline", Objects.toString(facility.getHotline(), ""),
      "pinCode", accessGranted ? Objects.toString(facility.getCheckinPin(), "") : ""
    ));
    response.put("unit", unit == null ? Map.of("code", contract.getUnitCode()) : Map.ofEntries(
      Map.entry("code", unit.getCode()), Map.entry("type", unit.getType()),
      Map.entry("sizeSqm", Objects.toString(unit.getSizeSqm(), "")), Map.entry("sizeDesc", Objects.toString(unit.getSizeDesc(), "")),
      Map.entry("floor", Objects.toString(unit.getFloor(), "")), Map.entry("imageUrl", Objects.toString(unit.getImageUrl(), "")),
      Map.entry("imageAltText", Objects.toString(unit.getImageAltText(), ""))
    ));
    var handover = handovers.findFirstByContractIdOrderByHandoverDateDesc(id).orElse(null);
    var handoverStaff = handover == null || handover.getStaffId() == null ? null : users.findById(handover.getStaffId()).orElse(null);
    response.put("handover", handover == null ? null : Map.ofEntries(
      Map.entry("id", Objects.toString(handover.getId(), "")),
      Map.entry("contractId", Objects.toString(handover.getContractId(), "")),
      Map.entry("reservationId", Objects.toString(handover.getReservationId(), "")),
      Map.entry("staffId", Objects.toString(handover.getStaffId(), "")),
      Map.entry("handoverDate", Objects.toString(handover.getHandoverDate(), "")),
      Map.entry("confirmationDeadlineAt", Objects.toString(handover.getConfirmationDeadlineAt(), "")),
      Map.entry("conditionStatus", Objects.toString(handover.getConditionStatus(), "")),
      Map.entry("unitConditionNotes", Objects.toString(handover.getUnitConditionNotes(), "")),
      Map.entry("staffNotes", Objects.toString(handover.getStaffNotes(), "")),
      Map.entry("customerIssueNotes", Objects.toString(handover.getCustomerIssueNotes(), "")),
      Map.entry("customerIssueReportedAt", Objects.toString(handover.getCustomerIssueReportedAt(), "")),
      Map.entry("staffName", handoverStaff == null ? "" : Objects.toString(handoverStaff.getName(), "")),
      Map.entry("staffPhone", handoverStaff == null ? "" : Objects.toString(handoverStaff.getPhone(), "")),
      Map.entry("status", Objects.toString(handover.getStatus(), "")),
      Map.entry("evidenceAvailable", handover.getEvidencePath() != null && !handover.getEvidencePath().isBlank()),
      Map.entry("customerConfirmedAt", Objects.toString(handover.getCustomerConfirmedAt(), ""))
    ));
    response.put("invoices", invoiceRows);
    response.put("policies", policies.get());
    var inspectionOpt = inspections.findFirstByContractIdOrderByInspectionDateDesc(id);
    applyInspection(contract, inspectionOpt.orElse(null));
    inspectionOpt.ifPresent(inspection -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", inspection.getId());
      row.put("status", inspection.getStatus());
      row.put("penaltyFee", inspection.getPenaltyFee());
      row.put("repairFee", inspection.getRepairFee());
      row.put("depositRefundAmount", inspection.getDepositRefundAmount());
      row.put("damageNotes", inspection.getDamageNotes());
      row.put("cleanlinessStatus", inspection.getCleanlinessStatus());
      row.put("goodsCleared", inspection.getGoodsCleared());
      row.put("inspectionDate", Objects.toString(inspection.getInspectionDate(), ""));
      row.put("customerConfirmedAt", Objects.toString(inspection.getCustomerConfirmedAt(), ""));
      row.put("evidenceAvailable", inspection.getEvidencePath() != null && !inspection.getEvidencePath().isBlank());
      response.put("inspection", row);
    });
    return response;
  }

  private void applyHandover(Contract c, HandoverRecord h) {
    if (h == null) return;
    c.setHandoverStatus(h.getStatus());
    c.setHandoverConditionNotes(h.getUnitConditionNotes());
    c.setHandoverStaffNotes(h.getStaffNotes());
    c.setHandoverConditionStatus(h.getConditionStatus());
    c.setHandoverDate(Objects.toString(h.getHandoverDate(), ""));
    c.setHandoverStaffId(h.getStaffId());
    c.setHandoverEvidenceAvailable(h.getEvidencePath() != null && !h.getEvidencePath().isBlank());
  }

  private void applyInspection(Contract c, InspectionRecord inspection) {
    if (inspection == null) return;
    c.setInspectionId(inspection.getId());
    c.setInspectionStatus(inspection.getStatus());
    c.setInspectionPenaltyFee(inspection.getPenaltyFee());
    c.setInspectionRefundAmount(inspection.getDepositRefundAmount());
    c.setInspectionDamageNotes(inspection.getDamageNotes());
    c.setInspectionCleanlinessStatus(inspection.getCleanlinessStatus());
    c.setInspectionRepairFee(inspection.getRepairFee());
    c.setInspectionEvidenceAvailable(inspection.getEvidencePath() != null && !inspection.getEvidencePath().isBlank());
  }
}
