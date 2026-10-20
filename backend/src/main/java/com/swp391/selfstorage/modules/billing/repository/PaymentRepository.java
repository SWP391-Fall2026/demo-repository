package com.swp391.selfstorage.modules.billing.repository;

import com.swp391.selfstorage.modules.billing.entity.Payment;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, String> {
  List<Payment> findByReservationId(String id);
  List<Payment> findByContractId(String id);
  Optional<Payment> findByIdempotencyKey(String key);
  Optional<Payment> findByTransactionCode(String code);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Payment p where p.transactionCode=:code")
  Optional<Payment> lockByTransactionCode(@Param("code") String code);
  List<Payment> findByInvoiceId(String id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Payment p where p.id=:id")
  Optional<Payment> lockById(@Param("id") String id);
}
