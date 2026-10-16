package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface UnitRepository extends JpaRepository<Unit, String> {
    List<Unit> findByFacilityCode(String facilityCode);
    List<Unit> findByStatus(String status);
    List<Unit> findByFacilityCodeAndStatus(String facilityCode, String status);
    long countByFacilityCode(String facilityCode);
    long countByFacilityCodeAndStatus(String facilityCode, String status);
    long countByStatus(String status);
    List<Unit> findByFacilityCodeAndStatusAndType(String facilityCode, String status, String type);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Unit u where u.code = :code")
    java.util.Optional<Unit> findByIdForUpdate(@Param("code") String code);
}
