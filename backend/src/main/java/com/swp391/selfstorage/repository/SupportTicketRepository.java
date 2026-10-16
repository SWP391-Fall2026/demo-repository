package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByUnitCode(String unitCode);
    List<SupportTicket> findByStatus(String status);
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SupportTicket> findByFacilityCodeOrderByCreatedAtDesc(String facilityCode);
    List<SupportTicket> findByStatusAndResolvedAtBefore(String status, LocalDateTime cutoff);
}
