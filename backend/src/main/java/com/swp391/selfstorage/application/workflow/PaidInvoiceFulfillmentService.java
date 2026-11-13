package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class PaidInvoiceFulfillmentService {
  private final InvoiceRepository invoices;
  private final ReservationRepository reservations;
  private final ContractRepository contracts;
  private final UnitRepository units;
  private final ReservationHoldPolicy holdPolicy;
  private final PaidRentActivationService rentActivation;

  public PaidInvoiceFulfillmentService(InvoiceRepository invoices, ReservationRepository reservations,
      ContractRepository contracts, UnitRepository units, ReservationHoldPolicy holdPolicy,
      PaidRentActivationService rentActivation) {
    this.invoices = invoices;
    this.reservations = reservations;
    this.contracts = contracts;
    this.units = units;
    this.holdPolicy = holdPolicy;
    this.rentActivation = rentActivation;
  }

  public void complete(Invoice invoice, LocalDateTime now) {
    if ("DEPOSIT".equals(invoice.getInvoiceType())) {
      var reservation = reservations.lockById(invoice.getReservationId()).orElseThrow(Inputs::missing);
      reservation.setStatus("RESERVED");
      reservation.setReservationExpiresAt(holdPolicy.reservationExpiry(now,
          reservation.getReservationHoldDaysSnapshot()));
      reservations.save(reservation);
    } else if ("RENT".equals(invoice.getInvoiceType())) {
      rentActivation.activate(invoice,
          reservations.lockById(invoice.getReservationId()).orElseThrow(Inputs::missing));
    } else if ("RENEW".equals(invoice.getInvoiceType())) {
      boolean overduePending = invoices.findByContractIdAndInvoiceTypeAndStatus(
          invoice.getContractId(), "OVERDUE", "PENDING").stream()
          .anyMatch(late -> ("overdue-for-renewal:" + invoice.getId()).equals(late.getPriceSnapshot()));
      if (!overduePending) activateRenewal(invoice, now);
    } else if ("OVERDUE".equals(invoice.getInvoiceType())) {
      String snapshot = invoice.getPriceSnapshot();
      if (snapshot != null && snapshot.startsWith("overdue-for-renewal:INV")) {
        String renewalId = snapshot.substring("overdue-for-renewal:".length());
        var renewal = invoices.lockById(renewalId).orElseThrow(Inputs::missing);
        if (!invoice.getContractId().equals(renewal.getContractId()))
          throw Inputs.conflict("Hóa đơn quá hạn không thuộc lần gia hạn này");
        if ("PAID".equals(renewal.getStatus())) activateRenewal(renewal, now);
      }
    }
  }

  private void activateRenewal(Invoice renewal, LocalDateTime now) {
    var contract = contracts.lockById(renewal.getContractId()).orElseThrow(Inputs::missing);
    if (contract.getLastRenewalAt() != null && renewal.getIssuedAt() != null
        && !contract.getLastRenewalAt().isBefore(renewal.getIssuedAt())) return;
    if (!java.util.Set.of("ACTIVE", "EXPIRING_SOON", "OVERDUE").contains(contract.getStatus())
        || contract.getCheckoutRequestedAt() != null)
      throw Inputs.conflict("Hợp đồng không thể gia hạn");
    String[] parts = (renewal.getDescription() == null ? "" : renewal.getDescription()).split(":");
    if (parts.length != 2 || !"RENEW".equals(parts[0])) throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    int months;
    try { months = Integer.parseInt(parts[1]); }
    catch (NumberFormatException ex) { throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ"); }
    if (months < 1) throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    String snapshot = renewal.getPriceSnapshot();
    if (snapshot == null || !snapshot.startsWith("monthly="))
      throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ");
    BigDecimal rate;
    try { rate = new BigDecimal(snapshot.substring("monthly=".length())); }
    catch (NumberFormatException ex) { throw Inputs.conflict("Hóa đơn gia hạn không hợp lệ"); }
    LocalDateTime deadline = contract.getEndAt() != null ? contract.getEndAt()
        : contract.getEndDate() != null ? contract.getEndDate().atTime(23, 59, 59) : null;
    if (deadline == null) throw Inputs.conflict("Hợp đồng chưa có ngày kết thúc hợp lệ");
    var start = deadline.isAfter(now) ? deadline : now;
    contract.setEndAt(start.plusMonths(months));
    contract.setEndDate(contract.getEndAt().toLocalDate());
    contract.setMonthlyFee(rate);
    contract.setStatus("ACTIVE");
    if (contract.getPinCode() == null) contract.setPinCode(
        String.format("%06d", new SecureRandom().nextInt(1000000)));
    var unit = units.lockByCode(contract.getUnitCode()).orElseThrow(Inputs::missing);
    unit.setPinCode(contract.getPinCode());
    units.save(unit);
    contract.setLastRenewalAt(now);
    contracts.save(contract);
  }
}
