package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.CustomerAccessLog;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerAccessLogRepository extends JpaRepository<CustomerAccessLog, String> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select l from CustomerAccessLog l where l.id=:id")
  Optional<CustomerAccessLog> findWithLockById(@Param("id") String id);

  List<CustomerAccessLog> findByContractIdOrderByCreatedAtDesc(String contractId);

  List<CustomerAccessLog> findByFacilityCodeOrderByCreatedAtDesc(String facilityCode);

  List<CustomerAccessLog> findByFacilityCodeAndStatusOrderByCreatedAtDesc(String facilityCode, String status);

  List<CustomerAccessLog> findByUserIdOrderByCreatedAtDesc(String userId);

  Optional<CustomerAccessLog> findFirstByContractIdAndCheckoutAtIsNullOrderByCheckinAtDesc(String contractId);

  Optional<CustomerAccessLog> findFirstByContractIdAndCheckinAtIsNotNullAndCheckoutAtIsNullOrderByCheckinAtDesc(String contractId);

  Optional<CustomerAccessLog> findFirstByContractIdAndStatusInOrderByCreatedAtDesc(String contractId, List<String> statuses);
}

