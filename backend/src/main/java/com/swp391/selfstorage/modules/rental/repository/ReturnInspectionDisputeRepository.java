package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.ReturnInspectionDispute;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnInspectionDisputeRepository extends JpaRepository<ReturnInspectionDispute, String> {
  List<ReturnInspectionDispute> findByCustomerIdOrderByCreatedAtDesc(String customerId);
  List<ReturnInspectionDispute> findByFacilityCodeOrderByCreatedAtDesc(String facilityCode);
  Optional<ReturnInspectionDispute> findFirstByInspectionIdOrderByCreatedAtDescIdDesc(String inspectionId);
}
