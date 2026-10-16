package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;
import java.time.LocalDateTime;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByUserId(String userId);
    List<Reservation> findByFacilityCode(String facilityCode);
    List<Reservation> findByUnitCodeAndStatusIn(String unitCode, Collection<String> statuses);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r where r.id = :id")
    java.util.Optional<Reservation> findByIdForUpdate(@Param("id") String id);
    List<Reservation> findByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);
}
