package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, String> {
    List<Reservation> findByUserId(String userId);
    List<Reservation> findByFacilityCode(String facilityCode);
}
