package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, String> {
    List<DailyTask> findByStaff(String staff);
    List<DailyTask> findByStatus(String status);
    List<DailyTask> findByFacilityCodeAndDueDateOrderByDeadlineAsc(String facilityCode, LocalDate dueDate);
    List<DailyTask> findByFacilityCodeAndStaffIdAndDueDateOrderByDeadlineAsc(
            String facilityCode, String staffId, LocalDate dueDate);
    Optional<DailyTask> findByIdAndFacilityCode(String id, String facilityCode);
    Optional<DailyTask> findByIdAndFacilityCodeAndStaffId(String id, String facilityCode, String staffId);
    List<DailyTask> findByReservationIdAndStatus(String reservationId, String status);
    List<DailyTask> findByContractIdAndStatus(String contractId, String status);
}
