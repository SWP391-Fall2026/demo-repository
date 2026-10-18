package com.swp391.selfstorage.modules.rental.repository;

import com.swp391.selfstorage.modules.rental.entity.InspectionRecord;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface InspectionRecordRepository
  extends JpaRepository<InspectionRecord, String> {}
