package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByUnitCode(String unitCode);
    List<SupportTicket> findByStatus(String status);
}
