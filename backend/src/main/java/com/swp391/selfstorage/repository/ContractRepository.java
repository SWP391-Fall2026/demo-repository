package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, String> {
    Optional<Contract> findByUnitCode(String unitCode);
    List<Contract> findByUserId(String userId);
    List<Contract> findByFacilityCode(String facilityCode);
    java.util.Optional<Contract> findByReservationId(String reservationId);
    List<Contract> findByStatusIn(List<String> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Contract c where c.unitCode = :unitCode")
    Optional<Contract> findByUnitCodeForUpdate(@Param("unitCode") String unitCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Contract c where c.id = :id")
    Optional<Contract> findByIdForUpdate(@Param("id") String id);
}
