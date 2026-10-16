package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Payment;
import com.swp391.selfstorage.entity.Reservation;
import com.swp391.selfstorage.repository.PaymentRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationExpiryService {
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;

    public ReservationExpiryService(ReservationRepository reservationRepository, PaymentRepository paymentRepository) {
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
    }

    @Scheduled(fixedDelayString = "${app.reservations.expiry-check-ms:600000}")
    @Transactional
    public void expireUnpaidReservations() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Reservation> expired = reservationRepository.findByStatusAndCreatedAtBefore("PENDING_PAYMENT", cutoff);
        for (Reservation reservation : expired) {
            reservation.setStatus("EXPIRED");
            reservationRepository.save(reservation);
            for (Payment payment : paymentRepository.findByReservationIdAndStatus(reservation.getId(), "PENDING")) {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);
            }
        }
    }
}