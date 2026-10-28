package com.swp391.selfstorage.modules.workforce.repository;

import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DailyTaskRepository extends JpaRepository<DailyTask, String> {
  List<DailyTask> findByStaffId(String id);
  List<DailyTask> findByFacilityCode(String code);
  Optional<DailyTask> findByContractIdAndTaskType(String contractId, String taskType);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from DailyTask t where t.id = :id")
  Optional<DailyTask> lockById(@Param("id") String id);
  Optional<DailyTask> findByReservationIdAndTaskType(String reservationId, String taskType);
}
