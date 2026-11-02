package com.swp391.selfstorage.modules.billing.repository;

import com.swp391.selfstorage.modules.billing.entity.Invoice;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
  interface DepositScope {
    String getFacilityCode();
    String getReservationId();
  }

  // Scalar routing fields avoid caching invoice/reservation state before locks.
  @Query("select i.facilityCode as facilityCode, i.reservationId as reservationId from Invoice i where i.id=:id and i.invoiceType='DEPOSIT'")
  Optional<DepositScope> findDepositScopeById(@Param("id") String id);

  @Query("select i.facilityCode as facilityCode, i.reservationId as reservationId from Invoice i, Payment p where p.invoiceId=i.id and p.transactionCode=:code and i.invoiceType='DEPOSIT'")
  Optional<DepositScope> findDepositScopeByTransactionCode(@Param("code") String code);

  List<Invoice> findByContractIdAndInvoiceTypeAndStatus(
    String id,
    String type,
    String status
  );
  List<Invoice> findByUserId(String id);
  List<Invoice> findByReservationId(String id);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select i from Invoice i where i.reservationId=:reservationId order by i.id")
  List<Invoice> lockByReservationId(@Param("reservationId") String reservationId);
  Optional<Invoice> findByReservationIdAndInvoiceType(String id, String type);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select i from Invoice i where i.id=:id")
  Optional<Invoice> lockById(@Param("id") String id);
}
