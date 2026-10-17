package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, String> {
    List<LoginHistory> findAllByOrderByCreatedAtDesc();
}
