package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Map<String, String> getBankInfo() {
        Map<String, String> bank = new LinkedHashMap<>();
        bank.put("bankName", "Ngân hàng TMCP Quân Đội (MBBank)");
        bank.put("accountNo", "0988 7766 5522");
        bank.put("accountName", "CONG TY CP SELF STORAGE VIET NAM");
        bank.put("gateway", "VietQR / Napas247");
        return bank;
    }

    public List<Payment> getTransactions() {
        return paymentRepository.findAll();
    }

    public Payment simulatePayment(Map<String, Object> data) {
        Payment txn = new Payment();
        txn.setId("TXN-" + (900000 + (int)(Math.random() * 100000)));
        txn.setReservationId((String) data.getOrDefault("reservationId", "RSV-8821"));

        Object amt = data.get("amount");
        long amountVal = amt instanceof Number ? ((Number) amt).longValue() : 1450000L;
        txn.setAmount(BigDecimal.valueOf(amountVal));

        txn.setInvoiceType((String) data.getOrDefault("type", "DEPOSIT"));
        txn.setPaymentMethod("VietQR Napas247");
        txn.setTimeStr(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")));
        txn.setStatus("SUCCESS");
        txn.setCreatedAt(LocalDateTime.now());

        return paymentRepository.save(txn);
    }
}
