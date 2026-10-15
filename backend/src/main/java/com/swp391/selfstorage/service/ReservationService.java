package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.repository.ReservationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation getReservationById(String id) {
        return reservationRepository.findById(id).orElse(null);
    }

    public Map<String, Object> calculateCost(long monthlyRate, int durationMonths) {
        double discountRate = 0.0;
        if (durationMonths == 3) discountRate = 0.05;
        else if (durationMonths == 6) discountRate = 0.10;
        else if (durationMonths == 12) discountRate = 0.15;

        long discountAmount = Math.round(monthlyRate * durationMonths * discountRate);
        long totalRent = (monthlyRate * durationMonths) - discountAmount;
        long depositAmount = monthlyRate;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("monthlyRate", monthlyRate);
        res.put("durationMonths", durationMonths);
        res.put("discountRate", discountRate);
        res.put("discountAmount", discountAmount);
        res.put("totalRent", totalRent);
        res.put("depositAmount", depositAmount);
        res.put("payNowAmount", depositAmount);
        return res;
    }

    public Reservation createReservation(Map<String, Object> data) {
        Reservation rsv = new Reservation();
        rsv.setId("RSV-" + (8800 + (int)(Math.random() * 1000)));
        rsv.setCustomerName((String) data.getOrDefault("customer", "Trần Văn Bảo"));
        rsv.setCustomerPhone((String) data.getOrDefault("phone", "0987.654.321"));
        rsv.setFacilityCode((String) data.getOrDefault("facility", "Hà Nội - Cầu Giấy"));
        rsv.setUnitType((String) data.getOrDefault("unitType", "M"));
        rsv.setUnitCode((String) data.getOrDefault("unitAssigned", "A-102"));

        Object durationObj = data.get("durationMonths");
        int duration = durationObj instanceof Number ? ((Number) durationObj).intValue() : 3;
        rsv.setDurationMonths(duration);

        Object depositObj = data.get("deposit");
        long deposit = depositObj instanceof Number ? ((Number) depositObj).longValue() : 1450000L;
        rsv.setDepositAmount(BigDecimal.valueOf(deposit));

        rsv.setStatus("PENDING_PAYMENT");
        rsv.setAppointment((String) data.getOrDefault("appointment", "14:00 - 15:00 Hôm nay"));
        rsv.setStartDate(LocalDate.now());
        rsv.setCreatedAt(LocalDateTime.now());

        return reservationRepository.save(rsv);
    }

    public Reservation assignUnit(String rsvId, String unitCode) {
        Reservation rsv = reservationRepository.findById(rsvId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt chỗ"));
        rsv.setUnitCode(unitCode);
        rsv.setStatus("RESERVED");
        return reservationRepository.save(rsv);
    }
}
