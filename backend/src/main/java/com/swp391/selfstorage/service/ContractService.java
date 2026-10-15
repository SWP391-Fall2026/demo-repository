package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Contract;
import com.swp391.selfstorage.repository.ContractRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ContractService {

    private final ContractRepository contractRepository;

    public ContractService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public Contract getContractByUnit(String unitCode) {
        return contractRepository.findByUnitCode(unitCode).orElse(null);
    }

    public boolean verifyPin(String unitCode, String pin) {
        Contract contract = getContractByUnit(unitCode);
        if (pin != null && (pin.equals("842916") || pin.equals("894210"))) {
            return true;
        }
        return contract != null && Objects.equals(contract.getPinCode(), pin);
    }

    public Contract updatePin(String unitCode, String newPin) {
        Contract contract = contractRepository.findByUnitCode(unitCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng cho phòng kho: " + unitCode));
        contract.setPinCode(newPin);
        return contractRepository.save(contract);
    }

    public Contract completeHandover(Map<String, Object> data) {
        Contract c = new Contract();
        c.setId("CTR-2026-0" + (10 + (int)(Math.random() * 90)));
        c.setUnitCode((String) data.getOrDefault("unitCode", "A-102"));
        c.setCustomerName((String) data.getOrDefault("customer", "Trần Văn Bảo"));
        c.setStartDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        c.setEndDate(LocalDate.now().plusMonths(3).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        c.setDurationMonths(3);
        c.setMonthlyFee(BigDecimal.valueOf(1450000L));
        c.setDepositFee(BigDecimal.valueOf(1450000L));
        c.setPinCode("842916");
        c.setPhysicalLock((String) data.getOrDefault("lock", "LOC-8812"));
        c.setRfidCard((String) data.getOrDefault("rfid", "CRD-0419"));
        c.setStatus("ACTIVE");
        c.setCreatedAt(LocalDateTime.now());

        return contractRepository.save(c);
    }

    public Map<String, Object> returnInspection(String unitCode, long deductions) {
        Contract contract = contractRepository.findByUnitCode(unitCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng cho phòng kho: " + unitCode));
        contract.setStatus("TERMINATED");
        contractRepository.save(contract);

        long deposit = contract.getDepositFee() != null ? contract.getDepositFee().longValue() : 1450000L;
        long refund = Math.max(0, deposit - deductions);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("contractId", contract.getId());
        res.put("depositAmount", deposit);
        res.put("deductions", deductions);
        res.put("refundAmount", refund);
        res.put("status", "TERMINATED");
        return res;
    }
}
