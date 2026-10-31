package com.swp391.selfstorage.modules.billing.service;

import com.swp391.selfstorage.common.security.ActorContext;
import com.swp391.selfstorage.common.web.Inputs;
import com.swp391.selfstorage.modules.audit.service.AuditLogService;
import com.swp391.selfstorage.modules.billing.entity.Invoice;
import com.swp391.selfstorage.modules.billing.entity.Payment;
import com.swp391.selfstorage.modules.billing.repository.InvoiceRepository;
import com.swp391.selfstorage.modules.billing.repository.PaymentRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.modules.reservation.service.ReservationHoldPolicy;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataAccessException;

@Service
public class VnPayService {
  private static final DateTimeFormatter VN_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
  private final InvoiceRepository invoices;
  private final PaymentRepository payments;
  private final ReservationRepository reservations;
  private final ContractRepository contracts;
  private final ActorContext actor;
  private final AuditLogService audit;
  private final Clock clock;
  private final ReservationHoldPolicy holdPolicy;
  private final com.swp391.selfstorage.application.workflow.PaidRentActivationService rentActivation;
  private final String url, tmnCode, hashSecret, returnUrl, frontendUrl;

  public VnPayService(InvoiceRepository invoices, PaymentRepository payments,
      ReservationRepository reservations, ContractRepository contracts, ActorContext actor, AuditLogService audit, Clock clock,
      @Value("${vnpay.url:}") String url, @Value("${vnpay.tmn-code:}") String tmnCode,
      @Value("${vnpay.hash-secret:}") String hashSecret,
      @Value("${vnpay.return-url:}") String returnUrl,
      @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
      ReservationHoldPolicy holdPolicy,
      com.swp391.selfstorage.application.workflow.PaidRentActivationService rentActivation) {
    this.invoices = invoices; this.payments = payments; this.reservations = reservations;
    this.contracts = contracts;
    this.actor = actor; this.audit = audit; this.clock = clock; this.url = url;
    this.tmnCode = tmnCode; this.hashSecret = hashSecret; this.returnUrl = returnUrl;
    this.frontendUrl = frontendUrl;
    this.holdPolicy = holdPolicy;
    this.rentActivation = rentActivation;
  }

  @Transactional
  public String createPaymentUrl(String invoiceId, String ipAddress) {
    if (url.isBlank() || tmnCode.isBlank() || hashSecret.isBlank() || returnUrl.isBlank())
      throw Inputs.conflict("VNPay chưa được cấu hình đầy đủ");
    var user = actor.require("CUSTOMER");
    Invoice invoice = invoices.lockById(invoiceId).orElseThrow(Inputs::missing);
    if (!actor.visible(user, invoice.getUserId(), invoice.getFacilityCode())) throw Inputs.missing();
    if (!"PENDING".equals(invoice.getStatus())) throw Inputs.conflict("Hóa đơn không còn chờ thanh toán");
    if (invoice.getAmount() == null || invoice.getAmount().signum() <= 0 ||
        invoice.getAmount().stripTrailingZeros().scale() > 0) {
      throw Inputs.bad("Số tiền hóa đơn phải là số VND nguyên dương");
    }
    if ("DEPOSIT".equals(invoice.getInvoiceType())) {
      var r = reservations.lockById(invoice.getReservationId()).orElseThrow(Inputs::missing);
      if (!"PENDING_PAYMENT".equals(r.getStatus()) || !r.getCreatedAt().plus(holdPolicy.pendingPaymentHold()).isAfter(LocalDateTime.now(clock)))
        throw Inputs.conflict("Đơn đặt cọc đã hết hạn");
    } else if ("RENT".equals(invoice.getInvoiceType())) {
      var r = reservations.lockById(invoice.getReservationId()).orElseThrow(Inputs::missing);
      if (!"RESERVED".equals(r.getStatus()) || r.getUnitCode() == null)
        throw Inputs.conflict("Chỉ thanh toán tiền thuê sau khi kho được gán");
      if (r.getIdentityVerifiedAt() == null || r.getContractTermsAcceptedAt() == null)
        throw Inputs.conflict("Khách cần được Staff xác minh tại quầy và xác nhận hợp đồng trước khi thanh toán thuê");
      if (!"PENDING_PAYMENT".equals(contracts.findByReservationId(r.getId()).map(c -> c.getStatus()).orElse("")))
        throw Inputs.conflict("Hợp đồng không còn ở trạng thái chờ thanh toán");
      if (rentActivation == null) throw Inputs.conflict("Không thể kích hoạt hợp đồng trước thanh toán");
    }
    String paymentId = "PAY-" + UUID.randomUUID();
    LocalDateTime now = LocalDateTime.now(clock);
    Payment p = new Payment(); p.setId(paymentId); p.setInvoiceId(invoice.getId());
    p.setReservationId(invoice.getReservationId()); p.setContractId(invoice.getContractId());
    p.setUserId(invoice.getUserId()); p.setFacilityCode(invoice.getFacilityCode());
    p.setCustomerName(user.getName()); p.setInvoiceType(invoice.getInvoiceType());
    p.setAmount(invoice.getAmount()); p.setPaymentMethod("VNPAY"); p.setTransactionCode(paymentId);
    p.setStatus("PENDING"); p.setCreatedAt(now); p.setTimeStr(now.toString());
    try {
      payments.saveAndFlush(p);
    } catch (DataAccessException e) {
      throw Inputs.conflict("Không tạo được giao dịch: schema bảng payments chưa đồng bộ. Chạy migration 002 trước khi thanh toán.");
    }

    Map<String, String> params = new TreeMap<>();
    params.put("vnp_Version", "2.1.0"); params.put("vnp_Command", "pay");
    params.put("vnp_TmnCode", tmnCode); params.put("vnp_Amount", invoice.getAmount().multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString());
    params.put("vnp_CurrCode", "VND"); params.put("vnp_TxnRef", paymentId);
    params.put("vnp_OrderInfo", "Thanh toan hoa don " + invoice.getId());
    params.put("vnp_OrderType", "other"); params.put("vnp_Locale", "vn");
    params.put("vnp_ReturnUrl", returnUrl); params.put("vnp_IpAddr", normalizeIp(ipAddress));
    params.put("vnp_CreateDate", now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(VN_TIME));
    LocalDateTime gatewayExpiry = now.plusMinutes(15);
    if (invoice.getDueAt() != null && invoice.getDueAt().isBefore(gatewayExpiry)) gatewayExpiry = invoice.getDueAt();
    params.put("vnp_ExpireDate", gatewayExpiry.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(VN_TIME));
    String query = query(params);
    return url + "?" + query + "&vnp_SecureHash=" + hmac(hashSecret, query);
  }

  @Transactional
  public Map<String, String> processIpn(Map<String, String> incoming) {
    if (!validSignature(incoming)) return response("97", "Invalid signature");
    if (!tmnCode.equals(incoming.get("vnp_TmnCode"))) return response("97", "Invalid terminal");
    String txnRef = incoming.get("vnp_TxnRef");
    Payment payment = payments.lockByTransactionCode(txnRef).orElse(null);
    if (payment == null) return response("01", "Order not found");
    Invoice invoice = invoices.lockById(payment.getInvoiceId()).orElse(null);
    if (invoice == null) return response("01", "Invoice not found");
    if (!"PENDING".equals(payment.getStatus()))
      return response("PAID".equals(payment.getStatus()) ? "00" : "02", "Order already processed");
    String amount = incoming.get("vnp_Amount");
    String expected = invoice.getAmount().multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString();
    if (!expected.equals(amount) || !txnRef.equals(payment.getTransactionCode()) ||
        !"VNPAY".equals(payment.getPaymentMethod())) return response("04", "Invalid amount or reference");
    com.swp391.selfstorage.modules.reservation.entity.Reservation depositReservation = null;
    com.swp391.selfstorage.modules.reservation.entity.Reservation rentReservation = null;
    if ("00".equals(incoming.get("vnp_ResponseCode")) && "00".equals(incoming.get("vnp_TransactionStatus"))) {
      if ("DEPOSIT".equals(invoice.getInvoiceType())) {
        depositReservation = reservations.lockById(invoice.getReservationId()).orElse(null);
        if (depositReservation == null || !"PENDING_PAYMENT".equals(depositReservation.getStatus())) return response("04", "Reservation state mismatch");
        if (!depositReservation.getCreatedAt().plus(holdPolicy.pendingPaymentHold()).isAfter(LocalDateTime.now(clock)))
          return response("04", "Reservation payment window expired");
      } else if ("RENT".equals(invoice.getInvoiceType())) {
        rentReservation = reservations.lockById(invoice.getReservationId()).orElse(null);
        if (rentReservation == null || !"RESERVED".equals(rentReservation.getStatus())
            || rentReservation.getIdentityVerifiedAt() == null || rentReservation.getContractTermsAcceptedAt() == null)
          return response("04", "Rent preconditions not met");
        if (!"PENDING_PAYMENT".equals(contracts.findByReservationId(rentReservation.getId()).map(c -> c.getStatus()).orElse("")))
          return response("04", "Contract payment preconditions not met");
      }
      payment.setStatus("PAID"); invoice.setStatus("PAID");
      if (depositReservation != null) {
        depositReservation.setStatus("RESERVED");
        depositReservation.setReservationExpiresAt(holdPolicy.reservationExpiry(
            LocalDateTime.now(clock), depositReservation.getReservationHoldDaysSnapshot()));
        reservations.save(depositReservation);
      }
      if (rentReservation != null) rentActivation.activate(invoice, rentReservation);
      audit.recordSystem("PAYMENT_PAID", payment.getId(), "VNPAY " + invoice.getInvoiceType() + " " + invoice.getAmount());
    } else payment.setStatus("FAILED");
    payments.save(payment); invoices.save(invoice);
    return response("00", "Confirm Success");
  }

  @Transactional
  public String returnTarget(Map<String, String> params) {
    String status = "failed";
    if (validSignature(params) && tmnCode.equals(params.get("vnp_TmnCode"))) {
      Map<String, String> result = processIpn(params);
      String transactionRef = params.get("vnp_TxnRef");
      if ("00".equals(result.get("RspCode")) && transactionRef != null) {
        Payment payment = payments.findByTransactionCode(transactionRef).orElse(null);
        if (payment != null && "PAID".equals(payment.getStatus())) status = "return";
      }
    }
    return frontendUrl.replaceAll("/$", "") + "/payment/result?status=" + status
      + "&paymentRef=" + encode(Objects.toString(params.get("vnp_TxnRef"), ""));
  }

  private boolean validSignature(Map<String, String> input) {
    String signature = input.get("vnp_SecureHash");
    if (signature == null || hashSecret.isBlank()) return false;
    Map<String, String> filtered = new TreeMap<>(input);
    filtered.remove("vnp_SecureHash"); filtered.remove("vnp_SecureHashType");
    return java.security.MessageDigest.isEqual(signature.getBytes(StandardCharsets.US_ASCII), hmac(hashSecret, query(filtered)).getBytes(StandardCharsets.US_ASCII));
  }
  private static String query(Map<String, String> values) {
    return values.entrySet().stream().filter(e -> e.getValue() != null && !e.getValue().isBlank())
      .map(e -> encode(e.getKey()) + "=" + encode(e.getValue())).reduce((a,b) -> a + "&" + b).orElse("");
  }
  private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
  private static String hmac(String secret, String data) {
    try { Mac mac = Mac.getInstance("HmacSHA512"); mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
      return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception e) { throw new IllegalStateException("Cannot sign VNPay request", e); }
  }
  private static String normalizeIp(String ip) { return ip == null || ip.isBlank() ? "127.0.0.1" : ip.replace("::1", "127.0.0.1"); }
  private static Map<String, String> response(String code, String message) { return Map.of("RspCode", code, "Message", message); }
}
