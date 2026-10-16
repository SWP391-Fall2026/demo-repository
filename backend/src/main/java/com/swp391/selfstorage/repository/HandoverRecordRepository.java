package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, String> {
}