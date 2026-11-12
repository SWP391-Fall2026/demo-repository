package com.swp391.selfstorage.modules.facility;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.facility.service.FacilityService;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FacilityServiceCatalogBatchingTest {

  private static UnitRepository.AvailableCount count(String facilityCode, String type, long qty) {
    return new UnitRepository.AvailableCount() {
      @Override
      public String getFacilityCode() {
        return facilityCode;
      }

      @Override
      public String getUnitType() {
        return type;
      }

      @Override
      public long getQuantity() {
        return qty;
      }
    };
  }

  @Test
  void catalogLoadsFacilityPriceMapOnceInsteadOfPerUnitQueries() {
    FacilityRepository facilities = mock(FacilityRepository.class);
    UnitRepository units = mock(UnitRepository.class);
    ActorContext actor = mock(ActorContext.class);
    AuditLogService audit = mock(AuditLogService.class);
    PolicyService policy = mock(PolicyService.class);
    ReservationRepository reservations = mock(ReservationRepository.class);
    ReservationHoldPolicy holdPolicy = new ReservationHoldPolicy(30);
    Clock clock = Clock.fixed(Instant.parse("2026-11-12T03:00:00Z"), ZoneOffset.UTC);

    Unit s1 = new Unit("HN-CG-S01", "HN-CG", "S", "3 m2", new BigDecimal("3"), new BigDecimal("800000"), "available", null, null);
    Unit s2 = new Unit("HN-CG-S02", "HN-CG", "S", "3 m2", new BigDecimal("3"), new BigDecimal("800000"), "available", null, null);
    Unit m1 = new Unit("HCM-TB-M01", "HCM-TB", "M", "6 m2", new BigDecimal("6"), new BigDecimal("1450000"), "available", null, null);

    when(units.findAvailableForCatalog(null, null, null, null, null)).thenReturn(List.of(s1, s2, m1));
    when(units.countAvailableByType(null)).thenReturn(List.of(
        count("HN-CG", "S", 2L),
        count("HCM-TB", "M", 1L)
    ));
    when(reservations.countUnassignedHolds(any(), any())).thenReturn(List.of());
    when(policy.facilityPriceMap(null)).thenReturn(Map.of("HN-CG|S", new BigDecimal("920000")));

    FacilityService service = new FacilityService(
        facilities, units, actor, audit, policy, reservations, holdPolicy, clock
    );

    List<Map<String, Object>> result = service.catalog(null, null, null, new BigDecimal("900000"), null);

    assertEquals(3, result.size());
    assertEquals(new BigDecimal("920000"), result.get(0).get("pricePerMonth"));
    assertEquals(new BigDecimal("920000"), result.get(1).get("pricePerMonth"));
    assertEquals(new BigDecimal("1450000"), result.get(2).get("pricePerMonth"));
    verify(policy, times(1)).facilityPriceMap(null);
    verify(policy, never()).facilityMonthly(any(), any());
  }
}

