package com.swp391.selfstorage.modules.billing.repository;

import com.swp391.selfstorage.modules.billing.entity.RefundRequest;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RefundRequestRepository
  extends JpaRepository<RefundRequest, String>
{
  List<RefundRequest> findByPaymentId(String id);
  List<RefundRequest> findByUserId(String id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RefundRequest r where r.id=:id")
  Optional<RefundRequest> lockById(@Param("id") String id);

}
