package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.InspectionRecord;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InspectionRecordRepository
  extends JpaRepository<InspectionRecord, String> {
  Optional<InspectionRecord> findFirstByContractIdOrderByInspectionDateDesc(String contractId);
  List<InspectionRecord> findByContractId(String contractId);

  @Query("""
      select i from InspectionRecord i, Contract c
      where i.contractId = c.id
        and (:facilityCode is null or c.facilityCode = :facilityCode)
      """)
  List<InspectionRecord> findByContractFacilityCode(@Param("facilityCode") String facilityCode);
}
