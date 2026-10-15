package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitRepository extends JpaRepository<Unit, String> {
    List<Unit> findByFacilityCode(String facilityCode);
    List<Unit> findByStatus(String status);
}
