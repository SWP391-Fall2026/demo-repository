package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.HandoverRecord;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface HandoverRecordRepository
  extends JpaRepository<HandoverRecord, String> {
  Optional<HandoverRecord> findFirstByContractIdOrderByHandoverDateDesc(String contractId);
}
