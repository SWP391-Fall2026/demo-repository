package com.swp391.selfstorage.modules.billing.repository;

import com.swp391.selfstorage.modules.billing.entity.RefundTransaction;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RefundTransactionRepository
  extends JpaRepository<RefundTransaction, String>
{
  List<RefundTransaction> findByRefundRequestId(String id);
  Optional<RefundTransaction> findByReference(String reference);
}
