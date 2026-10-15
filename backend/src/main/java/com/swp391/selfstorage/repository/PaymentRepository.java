package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByReservationId(String reservationId);
    List<Payment> findByContractId(String contractId);
}
