package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.RefundRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, String> {
    List<RefundRequest> findByFacilityCodeAndStatusOrderByCreatedAtAsc(String facilityCode, String status);
    Optional<RefundRequest> findByContractIdAndStatus(String contractId, String status);
    Optional<RefundRequest> findByReservationIdAndStatus(String reservationId, String status);
}
