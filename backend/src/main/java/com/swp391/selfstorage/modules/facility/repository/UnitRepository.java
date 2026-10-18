package com.swp391.selfstorage.modules.facility.repository;

import com.swp391.selfstorage.modules.facility.entity.Unit;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UnitRepository extends JpaRepository<Unit, String> {
  List<Unit> findByFacilityCode(String code);
  List<Unit> findByStatus(String status);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select u from Unit u where u.code=:code")
  Optional<Unit> lockByCode(@Param("code") String code);
}
