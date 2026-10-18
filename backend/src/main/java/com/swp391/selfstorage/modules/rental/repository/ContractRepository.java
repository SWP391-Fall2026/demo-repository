package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.Contract;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<Contract, String> {
  List<Contract> findByUserId(String id);
  List<Contract> findByFacilityCode(String code);
  List<Contract> findByUnitCodeOrderByCreatedAtDesc(String unit);
  Optional<Contract> findFirstByUnitCodeAndStatusInOrderByCreatedAtDesc(
    String code,
    Collection<String> statuses
  );
  Optional<Contract> findByReservationId(String id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Contract c where c.id=:id")
  Optional<Contract> lockById(@Param("id") String id);
}
