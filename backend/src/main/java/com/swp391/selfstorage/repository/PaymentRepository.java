package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByReservationId(String reservationId);
    List<Payment> findByContractId(String contractId);
    List<Payment> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<Payment> findByInvoiceTypeAndStatus(String invoiceType, String status);
    java.util.Optional<Payment> findByReservationIdAndInvoiceTypeAndStatus(
            String reservationId, String invoiceType, String status);
    List<Payment> findByReservationIdAndStatus(String reservationId, String status);
    java.util.Optional<Payment> findByContractIdAndInvoiceTypeAndStatus(
            String contractId, String invoiceType, String status);
}
