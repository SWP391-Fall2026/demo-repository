package com.swp391.selfstorage.modules.billing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.entity.Payment;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import com.swp391.selfstorage.modules.billing.service.VnPayService;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class VnPayServiceTest {
  private static final String SECRET = "TEST_HASH_SECRET";
  private static final String TMN = "TESTTMN1";
  private static final String ORIGINS = "http://localhost:5173,http://localhost:8000";

  private final InvoiceRepository invoices = mock(InvoiceRepository.class);
  private final PaymentRepository payments = mock(PaymentRepository.class);
  private final ReservationRepository reservations = mock(ReservationRepository.class);
  private final ContractRepository contracts = mock(ContractRepository.class);
  private final ActorContext actor = mock(ActorContext.class);
  private final AuditLogService audit = mock(AuditLogService.class);
  private final Clock clock = Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));

  private VnPayService service(String configuredReturnUrl) {
    return new VnPayService(invoices, payments, reservations, contracts, actor, audit, clock,
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", TMN, SECRET, configuredReturnUrl,
        "http://localhost:5173", ORIGINS, new ReservationHoldPolicy(5), null);
  }

  private void stubPendingDeposit() {
    User user = new User(); user.setName("Khach Hang");
    when(actor.require("CUSTOMER")).thenReturn(user);
    when(actor.visible(any(), any(), any())).thenReturn(true);
    Invoice invoice = new Invoice(); invoice.setId("INV-1"); invoice.setStatus("PENDING");
    invoice.setInvoiceType("DEPOSIT"); invoice.setReservationId("RSV-1");
    invoice.setAmount(new BigDecimal("500000"));
    when(invoices.lockById("INV-1")).thenReturn(Optional.of(invoice));
    Reservation reservation = new Reservation(); reservation.setId("RSV-1");
    reservation.setStatus("PENDING_PAYMENT"); reservation.setCreatedAt(LocalDateTime.now(clock));
    when(reservations.lockById("RSV-1")).thenReturn(Optional.of(reservation));
  }

  private static String returnUrlOf(String paymentUrl) {
    for (String pair : paymentUrl.substring(paymentUrl.indexOf('?') + 1).split("&")) {
      if (pair.startsWith("vnp_ReturnUrl=")) return URLDecoder.decode(pair.substring(14), StandardCharsets.UTF_8);
    }
    return null;
  }

  @Test void returnsThroughTheBrowserOriginWhenNoReturnUrlIsConfigured() {
    stubPendingDeposit();

    String url = service("").createPaymentUrl("INV-1", "127.0.0.1", "http://localhost:5173");

    assertEquals("http://localhost:5173/api/payments/vnpay/return", returnUrlOf(url));
  }

  @Test void rejectsUntrustedBrowserOrigin() {
    assertThrows(ResponseStatusException.class,
        () -> service("").createPaymentUrl("INV-1", "127.0.0.1", "https://evil.example"));
    verify(payments, never()).saveAndFlush(any());
  }

  @Test void explicitReturnUrlWinsOverBrowserOrigin() {
    stubPendingDeposit();
    String configured = "https://demo.ngrok.app/api/payments/vnpay/return";

    String url = service(configured).createPaymentUrl("INV-1", "127.0.0.1", "http://localhost:5173");

    assertEquals(configured, returnUrlOf(url));
  }

  @Test void signedSuccessfulReturnSettlesDepositAndRedirectsRelativeToBrowserOrigin() {
    Invoice invoice = new Invoice(); invoice.setId("INV-1"); invoice.setStatus("PENDING");
    invoice.setInvoiceType("DEPOSIT"); invoice.setReservationId("RSV-1");
    invoice.setAmount(new BigDecimal("500000"));
    Payment payment = new Payment(); payment.setId("PAY-1"); payment.setInvoiceId("INV-1");
    payment.setTransactionCode("PAY-1"); payment.setPaymentMethod("VNPAY"); payment.setStatus("PENDING");
    Reservation reservation = new Reservation(); reservation.setId("RSV-1");
    reservation.setStatus("PENDING_PAYMENT"); reservation.setCreatedAt(LocalDateTime.now(clock));
    when(payments.lockByTransactionCode("PAY-1")).thenReturn(Optional.of(payment));
    when(payments.findByTransactionCode("PAY-1")).thenReturn(Optional.of(payment));
    when(invoices.lockById("INV-1")).thenReturn(Optional.of(invoice));
    when(reservations.lockById("RSV-1")).thenReturn(Optional.of(reservation));

    String target = service("").returnTarget(signed(Map.of(
        "vnp_TmnCode", TMN, "vnp_TxnRef", "PAY-1", "vnp_Amount", "50000000",
        "vnp_OrderInfo", "Thanh toan hoa don INV-1",
        "vnp_ResponseCode", "00", "vnp_TransactionStatus", "00")));

    assertEquals("/payment/result?status=return&paymentRef=PAY-1", target);
    assertEquals("PAID", payment.getStatus());
    assertEquals("PAID", invoice.getStatus());
    assertEquals("RESERVED", reservation.getStatus());
  }

  @Test void tamperedReturnFailsAndUsesConfiguredFrontendWithExplicitReturnUrl() {
    Map<String, String> params = new HashMap<>(signed(Map.of(
        "vnp_TmnCode", TMN, "vnp_TxnRef", "PAY-1", "vnp_Amount", "50000000",
        "vnp_ResponseCode", "00", "vnp_TransactionStatus", "00")));
    params.put("vnp_Amount", "100");

    String target = service("https://demo.ngrok.app/api/payments/vnpay/return").returnTarget(params);

    assertEquals("http://localhost:5173/payment/result?status=failed&paymentRef=PAY-1", target);
    verify(payments, never()).save(any());
  }

  private static Map<String, String> signed(Map<String, String> values) {
    Map<String, String> sorted = new TreeMap<>(values);
    StringJoiner data = new StringJoiner("&");
    sorted.forEach((k, v) -> data.add(URLEncoder.encode(k, StandardCharsets.UTF_8) + "="
        + URLEncoder.encode(v, StandardCharsets.UTF_8)));
    try {
      Mac mac = Mac.getInstance("HmacSHA512");
      mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
      sorted.put("vnp_SecureHash", HexFormat.of().formatHex(mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8))));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
    return sorted;
  }
}

