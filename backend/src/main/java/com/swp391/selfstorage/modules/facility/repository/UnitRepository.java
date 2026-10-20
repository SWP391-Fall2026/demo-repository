package com.swp391.selfstorage.modules.facility.repository;

import com.swp391.selfstorage.modules.facility.entity.Unit;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UnitRepository extends JpaRepository<Unit, String> {
  List<Unit> findByFacilityCode(String code);
  List<Unit> findByStatus(String status);

  @Query("""
      select u from Unit u
      join Facility f on f.code = u.facilityCode
      where lower(u.status) = 'available'
        and lower(f.status) = 'active'
        and (:facilityCode is null or u.facilityCode = :facilityCode)
        and (:minSize is null or u.sizeSqm >= :minSize)
        and (:maxSize is null or u.sizeSqm <= :maxSize)
        and (:minPrice is null or u.pricePerMonth >= :minPrice)
        and (:maxPrice is null or u.pricePerMonth <= :maxPrice)
      order by u.facilityCode, u.sizeSqm, u.pricePerMonth, u.code
      """)
  List<Unit> findAvailableForCatalog(
      @Param("facilityCode") String facilityCode,
      @Param("minSize") BigDecimal minSize,
      @Param("maxSize") BigDecimal maxSize,
      @Param("minPrice") BigDecimal minPrice,
      @Param("maxPrice") BigDecimal maxPrice);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select u from Unit u where u.code=:code")
  Optional<Unit> lockByCode(@Param("code") String code);
}
