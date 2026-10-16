package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.InspectionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionRecordRepository extends JpaRepository<InspectionRecord, String> {
}