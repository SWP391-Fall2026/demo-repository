package com.swp391.selfstorage.modules.billing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.application.workflow.PaidRentActivationService;
import com.swp391.selfstorage.application.workflow.PayInvoiceWorkflow;
import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.billing.service.DepositPaymentLockService;
import com.swp391.selfstorage.modules.billing.service.VnPayService;
import com.swp391.selfstorage.modules.facility.entity.Facility;
import com.swp391.selfstorage.modules.facility.repository.FacilityRepository;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.rental.service.RenewalService;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class DepositPaymentConcurrencyTest {
  private static final Instant START = Instant.parse("2026-11-02T00:00:00Z");
  private static final String SECRET = "test-vnpay-secret";
  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final PaymentRepository payments = mock(PaymentRepository.class);
  private final FacilityRepository facilities = mock(FacilityRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final MutableClock clock = new MutableClock(START.plusSeconds(299));
  private final DepositPaymentLockService locks = new DepositPaymentLockService(
    invoices, facilities, reservations, new ReservationHoldPolicy(5));
  private final PaidRentActivationService rentActivation = mock(PaidRentActivationService.class);
  private final RenewalService renewals = mock(RenewalService.class);

  @ParameterizedTest
  @ValueSource(strings = {"MOCK_CARD", "BANK_TRANSFER_QR"})
  void customerCannotRecordSimulatedPaymentWhenSimulationDisabled(String method) {
    Invoice invoice = setupDeposit();
    User customer = user();
    when(actor.require("CUSTOMER", "STAFF")).thenReturn(customer);
    when(actor.role(customer)).thenReturn("CUSTOMER");

    ResponseStatusException error = assertThrows(ResponseStatusException.class,
      () -> workflow().execute(Map.of("invoiceId", invoice.getId(), "paymentMethod", method), null));

    assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    assertEquals("PENDING", invoice.getStatus());
    verify(payments, never()).save(any());
    verify(invoices, never()).save(any());
    verify(reservations, never()).save(any());
  }

  @Test void cashDepositExpiresWhileWaitingForFacilityLock() {
    Invoice invoice = setupDeposit();
    User staff = user();
    when(actor.require("CUSTOMER", "STAFF")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");
    when(facilities.lockByCode("HN-CG")).thenAnswer(call -> {
      clock.now = START.plusSeconds(300);
      return Optional.of(new Facility());
    });

    ResponseStatusException error = assertThrows(ResponseStatusException.class,
      () -> workflow().execute(Map.of("invoiceId", invoice.getId(), "paymentMethod", "CASH_AT_COUNTER"), null));

    assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    assertEquals("PENDING", invoice.getStatus());
    verify(payments, never()).save(any());
    var order = inOrder(facilities, reservations, invoices);
    order.verify(facilities).lockByCode("HN-CG");
    order.verify(reservations).lockById("R-1");
    order.verify(invoices).lockById("I-1");
  }

  @Test void cashDepositCommitsReservedOnlyWhileLockedHoldIsCurrent() {
    Invoice invoice = setupDeposit();
    User staff = user();
    when(actor.require("CUSTOMER", "STAFF")).thenReturn(staff);
    when(actor.role(staff)).thenReturn("STAFF");

    Payment result = workflow().execute(Map.of("invoiceId", invoice.getId(), "paymentMethod", "CASH_AT_COUNTER"), null);

    assertEquals("PAID", result.getStatus());
    assertEquals("PAID", invoice.getStatus());
    Reservation saved = reservations.lockById("R-1").orElseThrow();
    assertEquals("RESERVED", saved.getStatus());
    verify(reservations).save(saved);
  }

  @Test void gatewayCreationRejectsHoldThatExpiresWhileWaitingForReservation() {
    Invoice invoice = setupDeposit();
    when(actor.require("CUSTOMER")).thenReturn(user());
    Reservation locked = reservations.lockById("R-1").orElseThrow();
    when(reservations.lockById("R-1")).thenAnswer(call -> {
      clock.now = START.plusSeconds(300);
      return Optional.of(locked);
    });

    ResponseStatusException error = assertThrows(ResponseStatusException.class,
      () -> gateway().createPaymentUrl(invoice.getId(), "127.0.0.1"));

    assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    verify(payments, never()).saveAndFlush(any());
  }

  @Test void ipnDoesNotResurrectHoldThatExpiresBeforeLocksComplete() throws Exception {
    Invoice invoice = setupDeposit();
    Payment payment = pendingGatewayPayment();
    when(payments.lockByTransactionCode("TX-1")).thenReturn(Optional.of(payment));
    when(facilities.lockByCode("HN-CG")).thenAnswer(call -> {
      clock.now = START.plusSeconds(300);
      return Optional.of(new Facility());
    });

    Map<String, String> response = gateway().processIpn(signedIpn());

    assertEquals("04", response.get("RspCode"));
    assertEquals("PENDING", payment.getStatus());
    assertEquals("PENDING", invoice.getStatus());
    verify(payments, never()).save(any());
    var order = inOrder(facilities, reservations, payments, invoices);
    order.verify(facilities).lockByCode("HN-CG");
    order.verify(reservations).lockById("R-1");
    order.verify(payments).lockByTransactionCode("TX-1");
    order.verify(invoices).lockById("I-1");
  }

  @Test void ipnSettlesCurrentDepositUnderSameCapacityLock() throws Exception {
    setupDeposit();
    Payment payment = pendingGatewayPayment();
    when(payments.lockByTransactionCode("TX-1")).thenReturn(Optional.of(payment));

    assertEquals("00", gateway().processIpn(signedIpn()).get("RspCode"));
    assertEquals("PAID", payment.getStatus());
    verify(reservations).save(argThat(r -> "RESERVED".equals(r.getStatus())));
  }

  @Test void ipnDoesNotReapplyPendingPaymentWhenInvoiceAlreadyPaid() throws Exception {
    Invoice invoice = setupDeposit();
    invoice.setInvoiceType("RENEW");
    invoice.setContractId("C-1");
    invoice.setStatus("PAID");
    when(invoices.findDepositScopeByTransactionCode("TX-1")).thenReturn(Optional.empty());
    Payment payment = pendingGatewayPayment();
    when(payments.lockByTransactionCode("TX-1")).thenReturn(Optional.of(payment));

    Map<String, String> response = gateway().processIpn(signedIpn());

    assertEquals("02", response.get("RspCode"));
    assertEquals("PENDING", payment.getStatus());
    verify(reservations, never()).save(any());
    verify(rentActivation, never()).activate(any(), any());
    verify(renewals, never()).activatePaidRenewal(any(), any());
    verify(contracts, never()).lockById(any());
    verify(payments, never()).save(any());
  }

  private Invoice setupDeposit() {
    Invoice invoice = new Invoice(); invoice.setId("I-1"); invoice.setReservationId("R-1");
    invoice.setUserId("C-1"); invoice.setFacilityCode("HN-CG"); invoice.setInvoiceType("DEPOSIT");
    invoice.setStatus("PENDING"); invoice.setAmount(new BigDecimal("900000"));
    Reservation reservation = new Reservation(); reservation.setId("R-1"); reservation.setUserId("C-1");
    reservation.setFacilityCode("HN-CG"); reservation.setStatus("PENDING_PAYMENT");
    reservation.setCreatedAt(LocalDateTime.ofInstant(START, ZoneOffset.UTC));
    InvoiceRepository.DepositScope scope = new InvoiceRepository.DepositScope() {
      public String getFacilityCode() { return "HN-CG"; }
      public String getReservationId() { return "R-1"; }
    };
    when(invoices.findDepositScopeById("I-1")).thenReturn(Optional.of(scope));
    when(invoices.findDepositScopeByTransactionCode("TX-1")).thenReturn(Optional.of(scope));
    when(facilities.lockByCode("HN-CG")).thenReturn(Optional.of(new Facility()));
    when(reservations.lockById("R-1")).thenReturn(Optional.of(reservation));
    when(invoices.lockById("I-1")).thenReturn(Optional.of(invoice));
    when(actor.visible(any(), eq("C-1"), eq("HN-CG"))).thenReturn(true);
    return invoice;
  }

  private Payment pendingGatewayPayment() {
    Payment payment = new Payment(); payment.setId("P-1"); payment.setInvoiceId("I-1");
    payment.setTransactionCode("TX-1"); payment.setPaymentMethod("VNPAY"); payment.setStatus("PENDING");
    return payment;
  }

  private User user() { User user = new User(); user.setId("C-1"); user.setName("Customer"); return user; }
  private PayInvoiceWorkflow workflow() {
    return new PayInvoiceWorkflow(invoices, payments, reservations, contracts, actor, audit, clock,
      rentActivation, renewals, locks, false);
  }
  private VnPayService gateway() {
    return new VnPayService(invoices, payments, reservations, contracts, actor, audit, clock,
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "TEST", SECRET,
      "http://localhost:8080/api/payments/vnpay/return", "http://localhost:5173", rentActivation, renewals, locks);
  }
  private Map<String, String> signedIpn() throws Exception {
    Map<String, String> params = new TreeMap<>(Map.of("vnp_TmnCode", "TEST", "vnp_TxnRef", "TX-1",
      "vnp_Amount", "90000000", "vnp_ResponseCode", "00", "vnp_TransactionStatus", "00"));
    String query = params.entrySet().stream().map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8)
      + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8)).reduce((a, b) -> a + "&" + b).orElse("");
    Mac mac = Mac.getInstance("HmacSHA512"); mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
    params.put("vnp_SecureHash", HexFormat.of().formatHex(mac.doFinal(query.getBytes(StandardCharsets.UTF_8))));
    return params;
  }

  private static class MutableClock extends Clock {
    Instant now;
    MutableClock(Instant now) { this.now = now; }
    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return now; }
  }
}
