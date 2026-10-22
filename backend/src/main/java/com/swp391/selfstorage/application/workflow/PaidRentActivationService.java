package com.swp391.selfstorage.application.workflow;

import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.rental.entity.Contract;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaidRentActivationService {
  private final ContractRepository contracts;
  private final InvoiceRepository invoices;
  private final UnitRepository units;
  private final SecureRandom random = new SecureRandom();

  public PaidRentActivationService(ContractRepository contracts, InvoiceRepository invoices,
      UnitRepository units) {
    this.contracts = contracts;
    this.invoices = invoices;
    this.units = units;
  }

  @Transactional
  public Contract activate(Invoice invoice, Reservation reservation) {
    if (!"RENT".equals(invoice.getInvoiceType()) || !reservation.getId().equals(invoice.getReservationId()))
      throw Inputs.conflict("Hóa đơn thuê không khớp đơn đặt chỗ");
    if (!"PAID".equals(invoice.getStatus())) throw Inputs.conflict("Chỉ kích hoạt PIN sau khi hóa đơn thuê đã thanh toán");
    Contract contract = contracts.findByReservationId(reservation.getId()).orElseThrow(Inputs::missing);
    if (!reservation.getUnitCode().equals(contract.getUnitCode())
        || !reservation.getUserId().equals(contract.getUserId())
        || !"PENDING_PAYMENT".equals(contract.getStatus()) || contract.getPinCode() != null)
      throw Inputs.conflict("Hợp đồng đã được kích hoạt hoặc không khớp đơn");
    contract.setPinCode(String.format("%06d", random.nextInt(1_000_000)));
    contract.setStatus("PENDING_HANDOVER");
    contracts.save(contract);
    invoice.setContractId(contract.getId());
    invoices.save(invoice);
    var unit = units.lockByCode(reservation.getUnitCode()).orElseThrow(Inputs::missing);
    unit.setPinCode(contract.getPinCode());
    units.save(unit);
    return contract;
  }
}
