package com.swp391.selfstorage.modules.rental.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.*;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.repository.HandoverRecordRepository;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
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

  public ContractService(ContractRepository c, ActorContext a, HandoverRecordRepository handovers,
      InvoiceRepository invoices, FacilityRepository facilities, UnitRepository units, PolicyService policies,
      ReservationRepository reservations, UserRepository users) {
    contracts = c;
    actor = a;
    this.handovers = handovers;
    this.invoices = invoices;
    this.facilities = facilities;
    this.units = units;
    this.policies = policies;
    this.reservations = reservations;
    this.users = users;
  }

  public List<Contract> list() {
    var u = actor.require("CUSTOMER", "STAFF", "FMANAGER");
    return contracts
      .findAll()
      .stream()
      .filter(c -> actor.visible(u, c.getUserId(), c.getFacilityCode()))
      .peek(c -> {
        handovers.findFirstByContractIdOrderByHandoverDateDesc(c.getId()).ifPresent(h -> {
          c.setHandoverStatus(h.getStatus());
          c.setHandoverConditionNotes(h.getUnitConditionNotes());
          c.setHandoverStaffNotes(h.getStaffNotes());
          c.setHandoverConditionStatus(h.getConditionStatus());
          c.setHandoverDate(Objects.toString(h.getHandoverDate(), ""));
          c.setHandoverStaffId(h.getStaffId());
          c.setHandoverEvidenceAvailable(h.getEvidencePath() != null && !h.getEvidencePath().isBlank());
        });
        if ("CUSTOMER".equals(actor.role(u))) {
          if (!Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(c.getStatus())) {
            c.setPinCode(null);
          } else {
            facilities.findById(c.getFacilityCode()).ifPresent(f -> c.setFacilityPin(f.getCheckinPin()));
          }
        }
      })
      .toList();
  }

  public Map<String, Object> detail(String id) {
    var customer = actor.require("CUSTOMER");
    Contract contract = contracts.findById(id).orElseThrow(Inputs::missing);
    if (!actor.visible(customer, contract.getUserId(), contract.getFacilityCode())) throw Inputs.missing();
    boolean accessGranted = Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus());
    if (!accessGranted) contract.setPinCode(null);
    var facility = facilities.findById(contract.getFacilityCode()).orElse(null);
    var unit = units.findById(contract.getUnitCode()).orElse(null);
    var invoiceRows = invoices.findAll().stream()
      .filter(i -> id.equals(i.getContractId()) || Objects.equals(contract.getReservationId(), i.getReservationId()))
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
    return response;
  }
}
