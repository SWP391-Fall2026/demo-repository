package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.HandoverReview;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HandoverReviewRepository extends JpaRepository<HandoverReview, String> {
  List<HandoverReview> findByContractIdOrderByCreatedAtDesc(String contractId);
  List<HandoverReview> findByFacilityCodeOrderByCreatedAtDesc(String facilityCode);
  List<HandoverReview> findByUserIdOrderByCreatedAtDesc(String userId);
  boolean existsByContractIdAndStatus(String contractId, String status);
  boolean existsByReservationIdAndStatus(String reservationId, String status);
}
