package com.swp391.selfstorage.modules.billing.repository;

import com.swp391.selfstorage.modules.billing.entity.Invoice;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
  List<Invoice> findByContractIdAndInvoiceTypeAndStatus(
    String id,
    String type,
    String status
  );
  List<Invoice> findByUserId(String id);
  List<Invoice> findByReservationId(String id);
  Optional<Invoice> findByReservationIdAndInvoiceType(String id, String type);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select i from Invoice i where i.id=:id")
  Optional<Invoice> lockById(@Param("id") String id);
}
