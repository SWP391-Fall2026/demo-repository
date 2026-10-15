package com.swp391.selfstorage.repository;

import com.swp391.selfstorage.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, String> {
    Optional<Contract> findByUnitCode(String unitCode);
    List<Contract> findByUserId(String userId);
    List<Contract> findByFacilityCode(String facilityCode);
}
