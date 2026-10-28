package com.swp391.selfstorage.modules.support.repository;

import com.swp391.selfstorage.modules.support.entity.SupportTicket;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface SupportTicketRepository
  extends JpaRepository<SupportTicket, String>
{
  List<SupportTicket> findByUserId(String id);
  List<SupportTicket> findByFacilityCode(String code);
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from SupportTicket t where t.id = :id")
  Optional<SupportTicket> lockById(@Param("id") String id);
  List<SupportTicket> findByAttachmentUrl(String attachmentUrl);
}
