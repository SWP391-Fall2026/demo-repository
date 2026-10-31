package com.swp391.selfstorage.modules.reservation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.facility.entity.Unit;
import com.swp391.selfstorage.modules.facility.repository.UnitRepository;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import com.swp391.selfstorage.modules.reservation.service.ReservationService;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ReservationServicePricingTest {

  private UnitRepository units;
  private PolicyService policies;
  private ReservationService reservations;

  @BeforeEach
  void setUp() {
    units = mock(UnitRepository.class);
    policies = mock(PolicyService.class);
    when(policies.value(anyString(), any())).thenAnswer(invocation -> invocation.getArgument(1));
    reservations = new ReservationService(
      mock(ReservationRepository.class),
      mock(ActorContext.class),
      policies,
      units
    );
  }

  @Test
  void facilityOverrideTakesPrecedenceOverUnitPricesForNewQuotes() {
    Unit available = new Unit();
    available.setType("S");
    available.setStatus("available");
    available.setPricePerMonth(new BigDecimal("800000"));
    when(units.findByFacilityCode("F-01")).thenReturn(List.of(available));
    when(policies.facilityMonthly("F-01", "S")).thenReturn(Optional.of(new BigDecimal("950000")));

    Map<String, Object> quote = reservations.quote(Map.of(
      "facilityCode", "F-01",
      "unitType", "S",
      "durationMonths", 1
    ));

    assertEquals(new BigDecimal("950000"), quote.get("monthlyRate"));
    assertEquals(new BigDecimal("950000"), quote.get("depositAmount"));
  }

  @Test
  void facilityOverrideDoesNotMakeAnUnavailableUnitTypeBookable() {
    when(units.findByFacilityCode("F-01")).thenReturn(List.of());
    when(policies.facilityMonthly("F-01", "S")).thenReturn(Optional.of(new BigDecimal("950000")));

    assertThrows(ResponseStatusException.class, () -> reservations.quote(Map.of(
      "facilityCode", "F-01",
      "unitType", "S",
      "durationMonths", 1
    )));
  }
}
