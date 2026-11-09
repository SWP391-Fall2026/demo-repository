package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.CustomerAccessLog;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerAccessLogRepository extends JpaRepository<CustomerAccessLog, String> {

  List<CustomerAccessLog> findByContractIdOrderByCreatedAtDesc(String contractId);

  List<CustomerAccessLog> findByFacilityCodeOrderByCreatedAtDesc(String facilityCode);

  List<CustomerAccessLog> findByFacilityCodeAndStatusOrderByCreatedAtDesc(String facilityCode, String status);

  List<CustomerAccessLog> findByUserIdOrderByCreatedAtDesc(String userId);

  Optional<CustomerAccessLog> findFirstByContractIdAndCheckoutAtIsNullOrderByCheckinAtDesc(String contractId);

  Optional<CustomerAccessLog> findFirstByContractIdAndCheckinAtIsNotNullAndCheckoutAtIsNullOrderByCheckinAtDesc(String contractId);

  Optional<CustomerAccessLog> findFirstByContractIdAndStatusInOrderByCreatedAtDesc(String contractId, List<String> statuses);
}

