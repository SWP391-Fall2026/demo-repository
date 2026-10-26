package com.swp391.selfstorage.modules.reservation.repository;

import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository
  extends JpaRepository<Reservation, String>
{
  List<Reservation> findByUserId(String id);
  List<Reservation> findByFacilityCode(String code);
  List<Reservation> findByStatus(String status);

  interface HoldCount {
    String getFacilityCode();
    String getUnitType();
    long getQuantity();
  }

  @Query("""
      select r.facilityCode as facilityCode, r.unitType as unitType, count(r) as quantity
      from Reservation r
      where (:facilityCode is null or r.facilityCode = :facilityCode)
        and r.unitCode is null
        and (r.status = 'RESERVED'
          or (r.status = 'PENDING_PAYMENT' and r.createdAt > :pendingCreatedAfter))
      group by r.facilityCode, r.unitType
      """)
  List<HoldCount> countUnassignedHolds(
      @Param("facilityCode") String facilityCode,
      @Param("pendingCreatedAfter") LocalDateTime pendingCreatedAfter);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from Reservation r where r.id=:id")
  Optional<Reservation> lockById(@Param("id") String id);
}
