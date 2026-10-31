package com.swp391.selfstorage.modules.audit.repository;

import com.swp391.selfstorage.modules.audit.entity.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  List<AuditLog> findAllByOrderByIdDesc();
  List<AuditLog> findByActionOrderByIdDesc(String action);
}
