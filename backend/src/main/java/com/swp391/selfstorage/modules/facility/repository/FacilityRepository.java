package com.swp391.selfstorage.modules.facility.repository;

import com.swp391.selfstorage.modules.facility.entity.Facility;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface FacilityRepository extends JpaRepository<Facility, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select f from Facility f where f.code=:code")
  Optional<Facility> lockByCode(@Param("code") String code);
}
