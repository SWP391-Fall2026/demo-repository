package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;

import com.swp391.selfstorage.modules.billing.service.RefundLimitCalculator;
import com.swp391.selfstorage.modules.rental.service.OverdueFeeCalculator;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.service.NoShowRules;
import com.swp391.selfstorage.modules.policy.service.PolicyService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class BusinessRulesTest {

  @Test
  void cancellationUsesRentalStartAndIncludesExactly24Hours() {
    var policies = mock(PolicyService.class);
    when(policies.value("refundCancelHours", BigDecimal.valueOf(24)))
      .thenReturn(BigDecimal.valueOf(24));
    var policy = new com.swp391.selfstorage.modules.reservation.service.CancellationPolicy(policies);
    assertTrue(policy.fullDepositRefund(at, at.minusHours(24)));
    assertTrue(policy.fullDepositRefund(at, at.minusHours(25)));
    assertFalse(policy.fullDepositRefund(at, at.minusHours(24).plusNanos(1)));
  }

  @Test
  void cancellationUsesTheReservationPolicySnapshot() {
    var policies = mock(PolicyService.class);
    var policy = new com.swp391.selfstorage.modules.reservation.service.CancellationPolicy(policies);

    assertTrue(policy.fullDepositRefund(at, at.minusHours(48), 48));
    assertFalse(policy.fullDepositRefund(at, at.minusHours(47), 48));
    verifyNoInteractions(policies);
  }

  final LocalDateTime at = LocalDateTime.of(2026, 10, 18, 14, 0);

  @Test
  void overdueRoundsEveryStarted24HoursAndUsesCurrentPriceCap() {
    var f = new OverdueFeeCalculator();
    assertEquals(0, f.days(at, at));
    assertEquals(1, f.days(at, at.plusNanos(1)));
    assertEquals(1, f.days(at, at.plusHours(24)));
    assertEquals(2, f.days(at, at.plusHours(24).plusNanos(1)));
    assertEquals(
      0,
      new BigDecimal("1200000").compareTo(
        f.calculate(
          at,
          at.plusDays(40),
          new BigDecimal("50000"),
          new BigDecimal("2400000"),
          new BigDecimal("50")
        )
      )
    );
  }

  @Test
  void arrivalAndIncidentBlockNoShowEvenAtDeadline() {
    var n = new NoShowRules();
    var r = new Reservation();
    r.setStatus("RESERVED");
    r.setAppointmentAt(at);
    assertFalse(n.eligible(r, at.plusMinutes(29)));
    assertTrue(n.eligible(r, at.plusMinutes(30)));
    r.setArrivedAt(at.plusMinutes(28));
    assertFalse(n.eligible(r, at.plusHours(2)));
    r.setArrivedAt(null);
    r.setIncidentOpen(true);
    assertFalse(n.eligible(r, at.plusHours(2)));
  }

  @Test
  void extensionIsAddedToBaseAndHoldDoesNotChangeRefundDeadline() {
    var n = new NoShowRules();
    var r = new Reservation();
    r.setStatus("RESERVED");
    r.setAppointmentAt(at);
    r.setExtensionMinutes(30);
    assertEquals(at.plusHours(1), n.deadline(r));
    r.setHoldUntil(at.plusHours(5));
    assertEquals(at.plusHours(24), n.refundDeadline(r));
    r.setApprovedAppointmentAt(at.plusDays(2));
    assertEquals(at.plusDays(3), n.refundDeadline(r));
  }

  @Test
  void pendingQuotaAndCompletedRefundsCannotExceedOriginalPayment() {
    var l = new RefundLimitCalculator();
    assertEquals(
      new BigDecimal("20"),
      l.available(
        new BigDecimal("100"),
        new BigDecimal("30"),
        new BigDecimal("50")
      )
    );
    assertThrows(IllegalArgumentException.class, () ->
      l.require(new BigDecimal("21"), new BigDecimal("20"))
    );
    assertThrows(IllegalArgumentException.class, () ->
      l.require(BigDecimal.ZERO, new BigDecimal("20"))
    );
  }
}
