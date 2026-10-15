package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, String> {
    List<DailyTask> findByStaff(String staff);
    List<DailyTask> findByStatus(String status);
}
