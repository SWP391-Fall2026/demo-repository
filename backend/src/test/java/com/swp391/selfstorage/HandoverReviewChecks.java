package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import com.fasterxml.jackson.databind.*;
import com.swp391.selfstorage.application.workflow.HandoverReviewWorkflow;
import com.swp391.selfstorage.modules.billing.entity.*;
import com.swp391.selfstorage.modules.billing.repository.*;
import com.swp391.selfstorage.modules.facility.entity.*;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.entity.User;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.entity.*;
import com.swp391.selfstorage.modules.rental.repository.*;
import com.swp391.selfstorage.modules.workforce.entity.DailyTask;
import com.swp391.selfstorage.modules.workforce.repository.DailyTaskRepository;
import com.swp391.selfstorage.modules.reservation.entity.Reservation;
import com.swp391.selfstorage.modules.reservation.repository.ReservationRepository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

abstract class HandoverReviewChecks {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired FacilityRepository facilities;
  @Autowired UnitRepository units;
  @Autowired ReservationRepository reservations;
  @Autowired ContractRepository contracts;
  @Autowired HandoverRecordRepository handovers;
  @Autowired HandoverReviewRepository reviews;
  @Autowired HandoverReviewEvidenceRepository evidence;
  @Autowired InvoiceRepository invoices;
  @Autowired PaymentRepository payments;
  @Autowired RefundRequestRepository refunds;
  @Autowired DailyTaskRepository tasks;
  @Autowired HandoverReviewWorkflow workflow;
  @Autowired com.swp391.selfstorage.modules.rental.job.HandoverDeadlineJob deadlineJob;
  @MockBean Clock clock;
  final LocalDateTime now = LocalDateTime.of(2026, 10, 26, 10, 0);
  String prefix, facility, customer, otherCustomer, staff, manager, otherManager, rid, cid, uid, hid;

  void time(LocalDateTime at) {
    when(clock.getZone()).thenReturn(ZoneId.of("Asia/Ho_Chi_Minh"));
    when(clock.instant()).thenReturn(at.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant());
  }

  @BeforeEach
  void fixture() {
    verifyTarget();
    time(now);
    prefix = "HR" + UUID.randomUUID().toString().substring(0, 8);
    facility = prefix + "-F"; rid = prefix + "-R"; cid = prefix + "-C"; uid = prefix + "-U"; hid = prefix + "-H";
    customer = prefix + "customer"; otherCustomer = prefix + "other"; staff = prefix + "staff";
    manager = prefix + "manager"; otherManager = prefix + "manager2";
    recordFixturePrefix();
    for (String code : List.of(facility, prefix + "-F2")) {
      var f = new Facility(); f.setCode(code); f.setName(code); f.setAddress("Test"); f.setCity("Test"); facilities.save(f);
    }
    account(customer, "CUSTOMER", null); account(otherCustomer, "CUSTOMER", null);
    account(staff, "STAFF", facility); account(manager, "FMANAGER", facility); account(otherManager, "FMANAGER", prefix + "-F2");
    var unit = new Unit(); unit.setCode(uid); unit.setFacilityCode(facility); unit.setType("S");
    unit.setSizeSqm(new BigDecimal("3")); unit.setPricePerMonth(new BigDecimal("900000"));
    unit.setStatus("reserved"); unit.setHeldByReservationId(rid); unit.setPinCode("123456"); units.save(unit);
    var r = new Reservation(); r.setId(rid); r.setUserId(customer); r.setCustomerName("Test customer");
    r.setFacilityCode(facility); r.setUnitType("S"); r.setUnitCode(uid); r.setStatus("RESERVED");
    r.setAppointmentAt(now); r.setRentalStartAt(now); r.setArrivedAt(now.minusMinutes(10));
    r.setIdentityVerifiedAt(now.minusMinutes(10)); r.setContractTermsAcceptedAt(now.minusMinutes(5)); reservations.save(r);
    var c = new Contract(); c.setId(cid); c.setReservationId(rid); c.setUserId(customer); c.setCustomerName("Test customer");
    c.setFacilityCode(facility); c.setUnitCode(uid); c.setStatus("PENDING_HANDOVER"); c.setPinCode("123456");
    c.setStartDate(now.toLocalDate()); c.setEndDate(now.plusMonths(1).toLocalDate()); c.setStartAt(now); c.setEndAt(now.plusMonths(1)); contracts.save(c);
    var h = new HandoverRecord(); h.setId(hid); h.setContractId(cid); h.setReservationId(rid); h.setStaffId(staff);
    h.setCustomerSignatureConfirmed(false);
    h.setHandoverDate(now); h.setConfirmationDeadlineAt(now.plusHours(24)); h.setConditionStatus("CLEAN");
    h.setUnitConditionNotes("Original condition"); h.setStatus("PENDING_CUSTOMER_CONFIRMATION"); handovers.save(h);
    var task = new DailyTask(); task.setId(prefix + "-T"); task.setTitle("CHECKIN"); task.setStaff("Test staff");
    task.setStaffId(staff); task.setFacilityCode(facility); task.setReservationId(rid); task.setUnitCode(uid);
    task.setTaskType("CHECKIN"); task.setStatus("IN_PROGRESS"); tasks.save(task);
    paid("DEPOSIT", "900000"); paid("RENT", "2700000");
  }

  void account(String name, String role, String facilityCode) {
    var u = new User(); u.setId(name); u.setUsername(name); u.setName("Synthetic " + role); u.setEmail(name + "@handover.invalid");
    u.setPassword("not-a-login-credential"); u.setRole(role); u.setFacilityCode(facilityCode); users.save(u);
  }

  void paid(String type, String amount) {
    var i = new Invoice(); i.setId(prefix + "-I-" + type); i.setReservationId(rid); i.setUserId(customer); i.setFacilityCode(facility);
    i.setInvoiceType(type); i.setAmount(new BigDecimal(amount)); i.setStatus("PAID"); if ("RENT".equals(type)) i.setContractId(cid); invoices.save(i);
    var p = new Payment(); p.setId(prefix + "-P-" + type); p.setInvoiceId(i.getId()); p.setReservationId(rid); p.setUserId(customer);
    p.setFacilityCode(facility); p.setInvoiceType(type); p.setAmount(i.getAmount()); p.setStatus("PAID");
    if ("RENT".equals(type)) p.setContractId(cid); payments.save(p);
  }

  JsonNode post(String who, String path, Map<String, Object> body, int expected) throws Exception {
    var result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api" + path)
        .with(user(who)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andReturn();
    assertEquals(expected, result.getResponse().getStatus(), result.getResponse().getContentAsString());
    return json.readTree(result.getResponse().getContentAsString()).path("data");
  }

  JsonNode cancellation() throws Exception {
    var result = mvc.perform(multipart("/api/handover-reviews").with(user(staff)).param("contractId", cid)
        .param("reason", "Customer refuses condition").param("onBehalfBasis", "Customer asked at front desk")).andReturn();
    assertEquals(200, result.getResponse().getStatus(), result.getResponse().getContentAsString());
    return json.readTree(result.getResponse().getContentAsString()).path("data");
  }

  Map<String, Object> decision(String value) {
    return Map.of("decision", value, "reason", "Policy reviewed", "conditions", "50% RENT; no deposit refund",
        "nextSteps", "Contact facility staff", "policyConfirmed", true);
  }

  Map<String, Object> confirmations() {
    return Map.of("customerInspectionConfirmed", true, "handoverRecordConfirmed", true,
        "receivedUnitConfirmed", true, "confirmationVersion", "HANDOVER-2026-10");
  }

  List<RefundRequest> ownRefunds() { return refunds.findAll().stream().filter(r -> rid.equals(r.getReservationId())).toList(); }

  @Test
  void timeoutAtExactDeadlineCreatesOnlyOnePendingCancellationAndRetainsUnit() throws Exception {
    time(now.plusHours(24).minusSeconds(1)); runDeadlineMonitor();
    assertTrue(reviews.findByContractIdOrderByCreatedAtDesc(cid).isEmpty());
    time(now.plusHours(24)); runDeadlineMonitor(); runDeadlineMonitor();
    var rows = reviews.findByContractIdOrderByCreatedAtDesc(cid);
    assertEquals(1, rows.size()); assertEquals("TIMEOUT", rows.get(0).getKind()); assertEquals("PENDING", rows.get(0).getStatus());
    assertEquals("reserved", units.findById(uid).orElseThrow().getStatus()); assertTrue(ownRefunds().isEmpty());
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 409);
  }

  @Test
  void confirmationJustBeforeDeadlineStillCompletesNormalHandover() throws Exception {
    time(now.plusHours(24).minusSeconds(1));
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 200);
    assertEquals("ACTIVE", contracts.findById(cid).orElseThrow().getStatus());
    assertEquals("occupied", units.findById(uid).orElseThrow().getStatus());
  }

  @Test
  void approvalCancelsAtomicallyAndRefundsOnlyHalfRentWithIdempotentRetry() throws Exception {
    post(customer, "/reservations/" + rid + "/cancel", Map.of("reason", "Bypass attempt"), 409);
    post(staff, "/reservations/" + rid + "/cancel", Map.of("reason", "Bypass attempt"), 409);
    post(manager, "/reservations/" + rid + "/cancel", Map.of("reason", "Bypass attempt"), 409);
    String id = cancellation().path("id").asText();
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 409);
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200);
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200);
    assertEquals("CANCELLED", reservations.findById(rid).orElseThrow().getStatus());
    assertEquals("TERMINATED", contracts.findById(cid).orElseThrow().getStatus());
    var u = units.findById(uid).orElseThrow(); assertEquals("available", u.getStatus()); assertNull(u.getHeldByReservationId()); assertNull(u.getPinCode());
    assertEquals("CANCELLED", tasks.findByReservationIdAndTaskType(rid, "CHECKIN").orElseThrow().getStatus());
    var result = ownRefunds(); assertEquals(1, result.size()); assertEquals("RENT", result.get(0).getRefundType());
    assertEquals(0, new BigDecimal("1350000").compareTo(result.get(0).getApprovedAmount()));
    assertEquals("APPROVED", result.get(0).getStatus()); assertEquals(id, result.get(0).getHandoverReviewId());
    assertEquals("PAID", payments.findById(prefix + "-P-RENT").orElseThrow().getStatus());
    for (String type : List.of("RENT", "DEPOSIT")) post(customer, "/refunds", Map.of(
        "paymentId", prefix + "-P-" + type, "amount", 1, "reason", "Extra refund", "exceptionRequested", true), 409);
  }

  @Test
  void rejectionRequiresExplanationNotifiesCustomerAndGrantsNewTwentyFourHours() throws Exception {
    String id = cancellation().path("id").asText();
    post(manager, "/handover-reviews/" + id + "/decision", Map.of("decision", "REJECT", "reason", ""), 400);
    time(now.plusHours(2));
    var result = post(manager, "/handover-reviews/" + id + "/decision", decision("REJECT"), 200);
    assertEquals(now.plusHours(26).toString(), result.path("newConfirmationDeadline").asText().substring(0, 16));
    assertEquals("Contact facility staff", result.path("nextSteps").asText());
    assertEquals("reserved", units.findById(uid).orElseThrow().getStatus()); assertTrue(ownRefunds().isEmpty());
    post(otherCustomer, "/handover-reviews/" + id + "/response", Map.of("response", "Not mine"), 404);
    post(customer, "/handover-reviews/" + id + "/response", Map.of("response", "Đã đọc; tiếp tục nhận kho"), 200);
    time(now.plusHours(25));
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 200);
  }

  @Test
  void rejectionCanExpireAgainWithoutAutomaticallyReleasingUnit() throws Exception {
    time(now.plusHours(24)); workflow.expire(cid);
    String id = reviews.findByContractIdOrderByCreatedAtDesc(cid).get(0).getId();
    post(manager, "/handover-reviews/" + id + "/decision", decision("REJECT"), 200);
    time(now.plusHours(48)); workflow.expire(cid); workflow.expire(cid);
    assertEquals(2, reviews.findByContractIdOrderByCreatedAtDesc(cid).size());
    assertEquals("reserved", units.findById(uid).orElseThrow().getStatus());
  }

  @Test
  void enforcesManagerRoleAndFacilityScope() throws Exception {
    String id = cancellation().path("id").asText();
    post(staff, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 403);
    post(customer, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 403);
    post(otherManager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 403);
    assertEquals(404, mvc.perform(get("/api/handover-reviews/" + id).with(user(otherCustomer))).andReturn().getResponse().getStatus());
    assertEquals(401, mvc.perform(get("/api/handover-reviews")).andReturn().getResponse().getStatus());
    assertTrue(ownRefunds().isEmpty());
  }

  @Test
  void missingPolicyConsentAndMismatchedUnitDoNotPartiallyCancel() throws Exception {
    String id = cancellation().path("id").asText();
    var input = new HashMap<String, Object>(decision("APPROVE")); input.put("policyConfirmed", false);
    post(manager, "/handover-reviews/" + id + "/decision", input, 400);
    var unit = units.findById(uid).orElseThrow(); unit.setHeldByReservationId("OTHER"); units.save(unit);
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 409);
    assertEquals("RESERVED", reservations.findById(rid).orElseThrow().getStatus());
    assertEquals("PENDING", reviews.findById(id).orElseThrow().getStatus()); assertTrue(ownRefunds().isEmpty());
  }

  @Test
  void invalidPaymentTotalRollsBackRefundCreationAndStateChanges() throws Exception {
    String id = cancellation().path("id").asText();
    var invoice = invoices.findByReservationIdAndInvoiceType(rid, "RENT").orElseThrow(); invoice.setAmount(new BigDecimal("3000000")); invoices.save(invoice);
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 409);
    assertEquals("PENDING_HANDOVER", contracts.findById(cid).orElseThrow().getStatus());
    assertEquals("PENDING", reviews.findById(id).orElseThrow().getStatus()); assertTrue(ownRefunds().isEmpty());
  }

  @Test
  void retainsSpecificIssueReasonAndEvidenceAfterStaffResendsHandover() throws Exception {
    var file = new MockMultipartFile("file", "issue.pdf", "application/pdf", "%PDF-1.4\nSynthetic evidence".getBytes());
    var result = mvc.perform(multipart("/api/contracts/" + cid + "/handover/issue").file(file).with(user(customer)).param("reason", "Door damaged")).andReturn();
    assertEquals(200, result.getResponse().getStatus(), result.getResponse().getContentAsString());
    String id = json.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    var attachment = evidence.findByReviewIdOrderByCreatedAtAsc(id).get(0);
    assertEquals(200, mvc.perform(get("/api/handover-reviews/evidence/" + attachment.getId()).with(user(manager))).andReturn().getResponse().getStatus());
    assertEquals(404, mvc.perform(get("/api/handover-reviews/evidence/" + attachment.getId()).with(user(otherCustomer))).andReturn().getResponse().getStatus());
    var detail = mvc.perform(get("/api/handover-reviews/" + id).with(user(customer))).andReturn().getResponse().getContentAsString();
    assertFalse(detail.contains("evidencePath")); assertTrue(detail.contains("Door damaged"));
    time(now.plusHours(1));
    post(staff, "/contracts/handover", Map.of("reservationId", rid, "unitCode", uid, "conditionStatus", "CLEAN",
        "unitConditionNotes", "Door repaired", "handoverEligibleConfirmed", true), 200);
    assertEquals("Door damaged", reviews.findById(id).orElseThrow().getReason());
    assertTrue(reviews.findById(id).orElseThrow().getHandoverSnapshot().contains("Original condition"));
    assertEquals(now.plusHours(25), handovers.findById(hid).orElseThrow().getConfirmationDeadlineAt());
  }

  @Test
  void refusesInvalidEvidenceWithoutKeepingReviewOrChangingHandover() throws Exception {
    var file = new MockMultipartFile("file", "bad.txt", "text/plain", "bad".getBytes());
    var result = mvc.perform(multipart("/api/contracts/" + cid + "/handover/issue").file(file).with(user(customer)).param("reason", "Issue")).andReturn();
    assertEquals(400, result.getResponse().getStatus());
    assertTrue(reviews.findByContractIdOrderByCreatedAtDesc(cid).isEmpty());
    assertEquals("PENDING_CUSTOMER_CONFIRMATION", handovers.findById(hid).orElseThrow().getStatus());
  }

  @Test
  void concurrentApprovalsProduceOneRefund() throws Exception {
    String id = cancellation().path("id").asText(); var gate = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<JsonNode> call = () -> { gate.await(); return post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200); };
      var a = pool.submit(call); var b = pool.submit(call); gate.countDown(); a.get(20, TimeUnit.SECONDS); b.get(20, TimeUnit.SECONDS);
    }
    assertEquals(1, ownRefunds().size());
  }

  @Test
  void confirmationAndApprovalCannotBothWin() throws Exception {
    String id = cancellation().path("id").asText();
    // A pending review always blocks confirmation, even when approval is concurrent.
    var gate = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var a = pool.submit(() -> { gate.await(); return post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200); });
      var b = pool.submit(() -> { gate.await(); return post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 409); });
      gate.countDown(); a.get(20, TimeUnit.SECONDS); b.get(20, TimeUnit.SECONDS);
    }
    assertEquals("TERMINATED", contracts.findById(cid).orElseThrow().getStatus()); assertEquals(1, ownRefunds().size());
  }

  @Test
  void legacyHandoverNeedsResendingAndDoesNotReceiveGuessedDeadline() throws Exception {
    var h = handovers.findById(hid).orElseThrow(); h.setConfirmationDeadlineAt(null); handovers.save(h);
    workflow.expire(cid); assertTrue(reviews.findByContractIdOrderByCreatedAtDesc(cid).isEmpty());
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 409);
    post(staff, "/contracts/handover", Map.of("reservationId", rid, "unitCode", uid, "conditionStatus", "CLEAN",
        "unitConditionNotes", "Resent", "handoverEligibleConfirmed", true), 200);
    assertEquals(now.plusHours(24), handovers.findById(hid).orElseThrow().getConfirmationDeadlineAt());
  }

  @Test
  void approvedRentRefundUsesExistingStaffEvidenceThenManagerConfirmation() throws Exception {
    String id = cancellation().path("id").asText();
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200);
    post(customer, "/handover-reviews/" + id + "/response", Map.of("response", "Đã nhận quyết định; đề nghị Staff hỗ trợ hoàn tiền"), 200);
    String refundId = ownRefunds().get(0).getId();
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(manager))).andReturn().getResponse().getStatus());
    post(staff, "/refunds/" + refundId + "/confirm", Map.of("reason", "Not allowed"), 403);
    var file = new MockMultipartFile("file", "transfer.pdf", "application/pdf", "%PDF-1.4\nSynthetic transfer record".getBytes());
    var result = mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(file)
        .param("reference", prefix + "-TRANSFER").with(user(staff))).andReturn();
    assertEquals(200, result.getResponse().getStatus(), result.getResponse().getContentAsString());
    assertEquals("EVIDENCE_SUBMITTED", refunds.findById(refundId).orElseThrow().getStatus());
    var managerEvidence = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(manager))).andReturn().getResponse();
    assertEquals(200, managerEvidence.getStatus());
    assertEquals("application/pdf", managerEvidence.getContentType());
    assertArrayEquals(file.getBytes(), managerEvidence.getContentAsByteArray());
    var customerEvidence = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(customer))).andReturn().getResponse();
    assertEquals(200, customerEvidence.getStatus());
    assertArrayEquals(file.getBytes(), customerEvidence.getContentAsByteArray());
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(otherManager))).andReturn().getResponse().getStatus());
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(otherCustomer))).andReturn().getResponse().getStatus());
    assertEquals(401, mvc.perform(get("/api/refunds/" + refundId + "/evidence")).andReturn().getResponse().getStatus());
    post(manager, "/refunds/" + refundId + "/confirm", Map.of("reason", "Evidence checked"), 200);
    assertEquals("COMPLETED", refunds.findById(refundId).orElseThrow().getStatus());
    assertEquals(200, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(manager))).andReturn().getResponse().getStatus());
    assertEquals(200, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(customer))).andReturn().getResponse().getStatus());
    assertEquals(1, ownRefunds().size()); assertEquals("RENT", ownRefunds().get(0).getRefundType());
  }

  @Test
  void customerViewsRefundImageFromOwnRequestAfterResponding() throws Exception {
    String id = cancellation().path("id").asText();
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 200);
    post(customer, "/handover-reviews/" + id + "/response", Map.of("response", "Đã đọc; liên hệ Staff để hoàn tiền"), 200);
    String refundId = ownRefunds().get(0).getId();
    byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=");
    var file = new MockMultipartFile("file", "synthetic-transfer.png", "image/png", png);
    var uploaded = mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(file)
        .param("reference", prefix + "-PNG").with(user(staff))).andReturn();
    assertEquals(200, uploaded.getResponse().getStatus(), uploaded.getResponse().getContentAsString());
    var listed = mvc.perform(get("/api/refunds").with(user(customer))).andReturn().getResponse();
    assertEquals(200, listed.getStatus());
    var customerRows = json.readTree(listed.getContentAsString()).path("data");
    assertTrue(customerRows.isArray());
    JsonNode matched = null;
    for (var row : customerRows) {
      assertEquals(customer, row.path("userId").asText());
      if (refundId.equals(row.path("id").asText())) matched = row;
    }
    assertNotNull(matched); assertEquals("EVIDENCE_SUBMITTED", matched.path("status").asText());
    for (String who : List.of(customer, manager)) {
      var downloaded = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(who))).andReturn().getResponse();
      assertEquals(200, downloaded.getStatus()); assertEquals("image/png", downloaded.getContentType());
      assertArrayEquals(png, downloaded.getContentAsByteArray());
    }
    var otherRows = mvc.perform(get("/api/refunds").with(user(otherCustomer))).andReturn().getResponse();
    assertFalse(otherRows.getContentAsString().contains(refundId));
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(otherCustomer))).andReturn().getResponse().getStatus());
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(otherManager))).andReturn().getResponse().getStatus());
    post(manager, "/refunds/" + refundId + "/confirm", Map.of("reason", "Đã đối chiếu ảnh và khoản hoàn"), 200);
    var after = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(customer))).andReturn().getResponse();
    assertEquals(200, after.getStatus()); assertArrayEquals(png, after.getContentAsByteArray());
    assertEquals("COMPLETED", refunds.findById(refundId).orElseThrow().getStatus());
    assertEquals(0, new BigDecimal("1350000").compareTo(ownRefunds().get(0).getApprovedAmount()));
  }

  @Test
  void staffUploadsOnlyForApprovedRequestAndManagerViewsAfterCustomerResponse() throws Exception {
    String reviewId = cancellation().path("id").asText();
    post(manager, "/handover-reviews/" + reviewId + "/decision", decision("APPROVE"), 200);
    post(customer, "/handover-reviews/" + reviewId + "/response", Map.of("response", "Đã phản hồi; nhờ Staff hỗ trợ hoàn tiền theo quyết định"), 200);
    var review = reviews.findById(reviewId).orElseThrow();
    assertNotNull(review.getCustomerRespondedAt());
    String refundId = ownRefunds().get(0).getId();
    var pending = new RefundRequest();
    pending.setId(prefix + "-PENDING-REF"); pending.setPaymentId(prefix + "-P-RENT");
    pending.setReservationId(rid); pending.setContractId(cid); pending.setUserId(customer);
    pending.setFacilityCode(facility); pending.setStatus("PENDING"); pending.setRefundType("RENT");
    pending.setRequestedAmount(BigDecimal.ONE); pending.setApprovedAmount(BigDecimal.ZERO);
    pending.setCreatedAt(now); pending.setReason("Synthetic unapproved request for upload authorization check");
    refunds.save(pending);
    var file = new MockMultipartFile("file", "staff-refund.pdf", "application/pdf", "%PDF-1.4\nSynthetic staff evidence".getBytes());
    var unapproved = mvc.perform(multipart("/api/refunds/" + pending.getId() + "/evidence").file(file)
        .param("reference", prefix + "-UNAPPROVED").with(user(staff))).andReturn().getResponse();
    assertEquals(409, unapproved.getStatus());
    assertEquals("PENDING", refunds.findById(pending.getId()).orElseThrow().getStatus());
    assertEquals(404, mvc.perform(get("/api/refunds/" + pending.getId() + "/evidence").with(user(manager))).andReturn().getResponse().getStatus());
    for (String who : List.of(customer, manager)) {
      var blocked = mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(file)
          .param("reference", prefix + "-BLOCKED").with(user(who))).andReturn().getResponse();
      assertEquals(403, blocked.getStatus());
    }
    var foreignStaff = prefix + "staff2"; account(foreignStaff, "STAFF", prefix + "-F2");
    assertEquals(403, mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(file)
        .param("reference", prefix + "-FOREIGN").with(user(foreignStaff))).andReturn().getResponse().getStatus());
    var uploaded = mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(file)
        .param("reference", prefix + "-STAFF-EVIDENCE").with(user(staff))).andReturn().getResponse();
    assertEquals(200, uploaded.getStatus(), uploaded.getContentAsString());
    assertEquals(refundId, json.readTree(uploaded.getContentAsString()).path("data").path("refundRequestId").asText());
    assertEquals(staff, json.readTree(uploaded.getContentAsString()).path("data").path("performedBy").asText());
    assertEquals("EVIDENCE_SUBMITTED", refunds.findById(refundId).orElseThrow().getStatus());
    var replacement = new MockMultipartFile("file", "replacement.pdf", "application/pdf", "%PDF-1.4\nMust not overwrite evidence".getBytes());
    assertEquals(409, mvc.perform(multipart("/api/refunds/" + refundId + "/evidence").file(replacement)
        .param("reference", prefix + "-REPLACE").with(user(staff))).andReturn().getResponse().getStatus());
    var managerFile = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(manager))).andReturn().getResponse();
    assertEquals(200, managerFile.getStatus()); assertEquals("application/pdf", managerFile.getContentType());
    assertArrayEquals(file.getBytes(), managerFile.getContentAsByteArray());
    assertEquals(404, mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(otherManager))).andReturn().getResponse().getStatus());
    post(staff, "/refunds/" + refundId + "/confirm", Map.of("reason", "Staff cannot finalize"), 403);
    post(manager, "/refunds/" + refundId + "/confirm", Map.of("reason", "Đã xem và đối chiếu đúng bằng chứng Staff gửi"), 200);
    assertEquals("COMPLETED", refunds.findById(refundId).orElseThrow().getStatus());
    var completedFile = mvc.perform(get("/api/refunds/" + refundId + "/evidence").with(user(manager))).andReturn().getResponse();
    assertEquals(200, completedFile.getStatus()); assertArrayEquals(file.getBytes(), completedFile.getContentAsByteArray());
    assertEquals("PENDING", refunds.findById(pending.getId()).orElseThrow().getStatus());
  }

  @Test
  void existingDepositRefundPreventsContradictoryNoDepositRefundApproval() throws Exception {
    String id = cancellation().path("id").asText();
    var old = new RefundRequest(); old.setId(prefix + "-OLD-REF"); old.setPaymentId(prefix + "-P-DEPOSIT");
    old.setReservationId(rid); old.setUserId(customer); old.setFacilityCode(facility);
    old.setCreatedAt(now); old.setRequestedAmount(BigDecimal.ONE); old.setReason("Synthetic existing refund"); old.setRefundType("DEPOSIT");
    old.setStatus("APPROVED"); old.setApprovedAmount(new BigDecimal("1")); refunds.save(old);
    post(manager, "/handover-reviews/" + id + "/decision", decision("APPROVE"), 409);
    assertEquals("RESERVED", reservations.findById(rid).orElseThrow().getStatus());
    assertEquals("PENDING", reviews.findById(id).orElseThrow().getStatus()); assertEquals(1, ownRefunds().size());
  }

  @Test
  void confirmationIsRejectedAtDeadlineEvenBeforeTheMonitoringJobRuns() throws Exception {
    time(now.plusHours(24));
    post(customer, "/contracts/" + cid + "/handover/confirm", confirmations(), 409);
    assertEquals("PENDING_HANDOVER", contracts.findById(cid).orElseThrow().getStatus());
    assertTrue(reviews.findByContractIdOrderByCreatedAtDesc(cid).isEmpty());
  }

  @Test
  void preservesLongReasonsWithoutOverflowingLegacyRefundOrAuditColumns() throws Exception {
    String longReason = "Lý do cần lưu đầy đủ. ".repeat(120).strip();
    var result = mvc.perform(multipart("/api/handover-reviews").with(user(staff)).param("contractId",cid)
        .param("reason",longReason).param("onBehalfBasis","Customer request recorded")).andReturn();
    assertEquals(200,result.getResponse().getStatus(),result.getResponse().getContentAsString());
    String id=json.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    var input=new HashMap<String,Object>(decision("APPROVE")); input.put("reason",longReason);
    post(manager,"/handover-reviews/"+id+"/decision",input,200);
    assertEquals(longReason,reviews.findById(id).orElseThrow().getReason());
    assertEquals(longReason,reviews.findById(id).orElseThrow().getDecisionReason());
    assertTrue(ownRefunds().get(0).getReason().length()<=255);
    assertEquals(0,new BigDecimal("1350000").compareTo(ownRefunds().get(0).getApprovedAmount()));
  }
  protected void verifyTarget() {}
  protected void recordFixturePrefix() {}
  protected void runDeadlineMonitor() { deadlineJob.monitor(); }
}
