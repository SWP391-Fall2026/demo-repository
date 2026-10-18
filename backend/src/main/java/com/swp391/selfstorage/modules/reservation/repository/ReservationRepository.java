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

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from Reservation r where r.id=:id")
  Optional<Reservation> lockById(@Param("id") String id);
}
