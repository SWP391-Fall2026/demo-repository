package com.swp391.selfstorage.modules.identity.repository;

import com.swp391.selfstorage.modules.identity.entity.LoginHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginHistoryRepository
  extends JpaRepository<LoginHistory, String>
{
  List<LoginHistory> findAllByOrderByIdDesc();
}
