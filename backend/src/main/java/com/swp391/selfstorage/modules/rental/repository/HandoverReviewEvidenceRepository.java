package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.HandoverReviewEvidence;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HandoverReviewEvidenceRepository extends JpaRepository<HandoverReviewEvidence, String> {
  List<HandoverReviewEvidence> findByReviewIdOrderByCreatedAtAsc(String reviewId);
}
