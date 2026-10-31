package com.swp391.selfstorage;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.swp391.selfstorage.config.LocalDataInitializer;
import com.swp391.selfstorage.modules.facility.repository.*;
import com.swp391.selfstorage.modules.identity.repository.UserRepository;
import com.swp391.selfstorage.modules.rental.repository.ContractRepository;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.TestExecutionListeners(
  listeners = {
    org.springframework.test.context.support.DependencyInjectionTestExecutionListener.class,
    org.springframework.test.context.web.ServletTestExecutionListener.class,
  }
)
class RentalLifecycleTest {

  @Test
  void concurrentRefundRequestsReserveOriginalPaymentQuota() throws Exception {
    var start = LocalDateTime.now().plusDays(3).withNano(0);
    var reservation = postAs(
      "customer",
      "/reservations",
      Map.of(
        "facilityCode",
        "HCM-Q7",
        "unitType",
        "M",
        "startDate",
        start.toLocalDate().toString(),
        "rentalStartAt",
        start.toString(),
        "appointmentAt",
        start.toString(),
        "durationMonths",
        1
      ),
      200
    );
    String rid = reservation.path("id").asText(),
      invoiceId = "";
    for (var invoice : getAs("customer", "/invoices")) {
      if (
        rid.equals(invoice.path("reservationId").asText()) &&
        "DEPOSIT".equals(invoice.path("invoiceType").asText())
      ) invoiceId = invoice.path("id").asText();
    }
    var payment = postAs(
      "customer",
      "/payments/simulate",
      mockCard(invoiceId),
      200
    );
    postAs(
      "customer",
      "/reservations/" + rid + "/cancel",
      Map.of("reason", "Hủy trước 24 giờ"),
      200
    );
    String body = json.writeValueAsString(
      Map.of(
        "paymentId",
        payment.path("id").asText(),
        "amount",
        1000000,
        "reason",
        "Kiểm tra giữ hạn mức đồng thời"
      )
    );
    var gate = new java.util.concurrent.CountDownLatch(1);
    try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
      java.util.concurrent.Callable<Integer> call = () -> {
        gate.await();
        return mvc
          .perform(
            post("/api/refunds")
              .with(user("customer"))
              .contentType(MediaType.APPLICATION_JSON)
              .content(body)
          )
          .andReturn()
          .getResponse()
          .getStatus();
      };
      var first = pool.submit(call);
      var second = pool.submit(call);
      gate.countDown();
      assertEquals(
        List.of(200, 400),
        java.util.stream.Stream.of(
          first.get(15, java.util.concurrent.TimeUnit.SECONDS),
          second.get(15, java.util.concurrent.TimeUnit.SECONDS)
        )
          .sorted()
          .toList()
      );
    }
  }

  @Autowired
  MockMvc mvc;

  @Autowired
  ObjectMapper json;

  @Autowired
  FacilityRepository facilities;

  @Autowired
  UnitRepository units;

  @Autowired
  UserRepository users;

  @Autowired
  ContractRepository contracts;

  @Autowired
  PasswordEncoder passwords;

  @BeforeEach
  void seed() {
    new LocalDataInitializer(facilities, units, users, passwords).run();
  }

  static Map<String, Object> mockCard(String invoiceId) {
    return mockCard(invoiceId, false);
  }

  static Map<String, Object> mockCard(String invoiceId, boolean simulateFailure) {
    var body = new LinkedHashMap<String, Object>();
    body.put("invoiceId", invoiceId);
    body.put("paymentMethod", "MOCK_CARD");
    body.put("bankCode", "NCB");
    body.put("cardNumber", "9704198526191432198");
    body.put("cardHolder", "NGUYEN VAN A");
    body.put("issueDate", "07/15");
    body.put("otp", "123456");
    body.put("confirmedAmount", true);
    if (simulateFailure) body.put("simulateFailure", true);
    return body;
  }

  JsonNode postAs(String who, String path, Object body, int expected)
    throws Exception {
    var result = mvc
      .perform(
        post("/api" + path)
          .with(user(who))
          .contentType(MediaType.APPLICATION_JSON)
          .content(json.writeValueAsString(body))
      )
      .andExpect(status().is(expected))
      .andReturn();
    return json
      .readTree(result.getResponse().getContentAsString())
      .path("data");
  }

  JsonNode getAs(String who, String path) throws Exception {
    return json
      .readTree(
        mvc
          .perform(get("/api" + path).with(user(who)))
          .andExpect(status().isOk())
          .andReturn()
          .getResponse()
          .getContentAsString()
      )
      .path("data");
  }

  @Test
  void rejectsAnonymousInvalidInputAndWrongRole() throws Exception {
    mvc.perform(get("/api/contracts")).andExpect(status().isUnauthorized());
    postAs("customer", "/reservations", Map.of(), 400);
    postAs("staff", "/facilities", Map.of("code", "DENIED"), 403);
    mvc
      .perform(
        post("/api/auth/login")
          .contentType(MediaType.APPLICATION_JSON)
          .content("{\"username\":\"customer\",\"password\":\"Demo123!\"}")
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.token").isNotEmpty());
  }

  @Test
  void fullRentalAndManualRefundEnforceBranchQuotaAndSeparation()
    throws Exception {
    var start = LocalDateTime.now().plusDays(2).withNano(0);
    var r = postAs(
      "customer",
      "/reservations",
      Map.of(
        "facilityCode",
        "HN-CG",
        "unitType",
        "S",
        "startDate",
        start.toLocalDate().toString(),
        "rentalStartAt",
        start.toString(),
        "appointmentAt",
        start.toString(),
        "durationMonths",
        1
      ),
      200
    );
    var rid = r.path("id").asText();
    assertFalse(rid.isBlank());
    mvc
      .perform(get("/api/reservations/" + rid).with(user("customer2")))
      .andExpect(status().isNotFound());
    JsonNode deposit = null;
    for (var i : getAs("customer", "/invoices"))
      if (rid.equals(i.path("reservationId").asText())) {
        if ("DEPOSIT".equals(i.path("invoiceType").asText())) deposit = i;
      }
    assertNotNull(deposit);
    assertTrue(getAs("customer", "/invoices").findValues("invoiceType").stream()
      .noneMatch(type -> "RENT".equals(type.asText())));
    String depositId = deposit.path("id").asText();
    postAs(
      "customer",
      "/payments/simulate",
      mockCard(depositId, true),
      200
    );
    var paid = postAs(
      "customer",
      "/payments/simulate",
      mockCard(depositId),
      200
    );
    postAs(
      "customer",
      "/payments/simulate",
      mockCard(depositId),
      409
    );
    postAs("customer", "/reservations/" + rid + "/checkin-request", Map.of(), 200);
    var currentReservation = getAs("customer", "/reservations/" + rid);
    String unitCode = currentReservation.path("unitCode").asText();
    assertFalse(unitCode.isBlank());
    var dashboard = getAs("manager", "/tasks/manager-dashboard");
    String dashboardTaskId = "";
    for (var task : dashboard.path("tasks"))
      if (rid.equals(task.path("reservationId").asText())) dashboardTaskId = task.path("id").asText();
    String taskId = dashboardTaskId;
    assertFalse(taskId.isBlank());
    String staffId = getAs("manager", "/tasks/staff-options").get(0).path("id").asText();
    mvc.perform(patch("/api/tasks/" + taskId + "/assign")
        .with(user("manager"))
        .contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(Map.of("staffId", staffId))))
      .andExpect(status().isOk());
    getAs("staff", "/tasks/" + taskId + "/checkin/credentials");
    postAs("staff", "/tasks/" + taskId + "/checkin/verify", Map.of(
      "appointmentCardCode", rid,
      "identityDocumentsConfirmed", true,
      "appointmentCardConfirmed", true), 200);
    var offer = getAs("customer", "/reservations/" + rid + "/contract-offer");
    postAs("customer", "/reservations/" + rid + "/contract-terms/accept", Map.of(
      "accepted", true, "termsVersion", offer.path("termsVersion").asText()), 200);
    JsonNode rent = null;
    for (var invoice : getAs("customer", "/invoices"))
      if (rid.equals(invoice.path("reservationId").asText())
          && "RENT".equals(invoice.path("invoiceType").asText())) rent = invoice;
    assertNotNull(rent);
    var paidRent = postAs("customer", "/payments/simulate", mockCard(rent.path("id").asText()), 200);
    JsonNode contractRow = null;
    for (var candidate : getAs("customer", "/contracts"))
      if (rid.equals(candidate.path("reservationId").asText())) contractRow = candidate;
    assertNotNull(contractRow);
    String cid = contractRow.path("id").asText();
    assertEquals("PAID", paidRent.path("status").asText());
    assertEquals("PENDING_HANDOVER", contractRow.path("status").asText());
    String pin = contracts.findById(cid).orElseThrow().getPinCode();
    assertEquals(6, pin.length());
    postAs("staff", "/contracts/handover", Map.of(
      "reservationId", rid, "handoverEligibleConfirmed", true,
      "unitCode", unitCode, "conditionStatus", "CLEAN",
      "unitConditionNotes", "Kho nguyên vẹn"), 200);
    postAs("customer", "/contracts/" + cid + "/handover/confirm", Map.of(
      "customerInspectionConfirmed", true, "handoverRecordConfirmed", true,
      "receivedUnitConfirmed", true, "confirmationVersion", "HANDOVER-2026-10"), 200);
    assertEquals("ACTIVE", contracts.findById(cid).orElseThrow().getStatus());
    assertEquals("occupied", units.findById(unitCode).orElseThrow().getStatus());
    postAs(
      "customer",
      "/contracts/checkout-request",
      Map.of("contractId", cid, "requestedDate", LocalDate.now().toString(), "reason", "Kết thúc thuê"),
      200
    );
    assertEquals(pin, contracts.findById(cid).orElseThrow().getPinCode());
    postAs(
      "staff",
      "/contracts/return-inspection",
      Map.of(
        "unitCode",
        unitCode,
        "cleanlinessStatus",
        "CLEAN",
        "damageNotes",
        "Không hư hỏng"
      ),
      409
    );
    var returnDashboard = getAs("manager", "/tasks/manager-dashboard");
    String returnTaskId = "";
    for (var task : returnDashboard.path("tasks"))
      if (
        cid.equals(task.path("contractId").asText()) &&
        "RETURN".equals(task.path("taskType").asText())
      ) returnTaskId = task.path("id").asText();
    assertFalse(returnTaskId.isBlank());
    mvc
      .perform(
        patch("/api/tasks/" + returnTaskId + "/assign")
          .with(user("manager"))
          .contentType(MediaType.APPLICATION_JSON)
          .content(json.writeValueAsString(Map.of("staffId", staffId)))
      )
      .andExpect(status().isOk());
    byte[] png = java.util.Base64.getDecoder().decode(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pU8AAAAASUVORK5CYII=");
    mvc.perform(multipart("/api/contracts/return-inspection")
        .param("unitCode", unitCode)
        .param("goodsCleared", "true")
        .param("cleanlinessStatus", "NEEDS_CLEANING")
        .param("repairFee", "0")
        .param("damageNotes", "Cần vệ sinh")
        .with(user("staff")))
      .andExpect(status().isBadRequest());
    mvc.perform(multipart("/api/contracts/return-inspection")
        .file(new MockMultipartFile("evidence", "staff.png", "image/png", png))
        .param("unitCode", unitCode)
        .param("goodsCleared", "true")
        .param("cleanlinessStatus", "NEEDS_CLEANING")
        .param("repairFee", "0")
        .param("damageNotes", "Cần vệ sinh")
        .with(user("staff")))
      .andExpect(status().isOk());
    assertEquals(pin, contracts.findById(cid).orElseThrow().getPinCode());
    assertEquals(
      "CHECKOUT_REQUESTED",
      contracts.findById(cid).orElseThrow().getStatus()
    );
    assertEquals("occupied", units.findById(unitCode).orElseThrow().getStatus());
    mvc.perform(multipart("/api/contracts/return-inspection/respond")
        .param("contractId", cid)
        .param("action", "DISPUTE")
        .param("reason", "Thiếu ảnh")
        .with(user("customer")))
      .andExpect(status().isBadRequest());
    mvc.perform(multipart("/api/contracts/return-inspection/respond")
        .file(new MockMultipartFile("evidence", "customer.png", "image/png", png))
        .param("contractId", cid)
        .param("action", "DISPUTE")
        .param("reason", "Tôi không đồng ý với hiện trạng")
        .with(user("customer")))
      .andExpect(status().isOk());
    JsonNode firstDispute = getAs("manager", "/return-inspection-reviews").get(0);
    String firstDisputeId = firstDispute.path("id").asText();
    postAs("manager", "/return-inspection-reviews/" + firstDisputeId + "/decision",
      Map.of("proposedDeduction", 100000000000L, "managerNote", "Đề xuất vượt mức"), 400);
    postAs("manager", "/return-inspection-reviews/" + firstDisputeId + "/decision",
      Map.of("proposedDeduction", 0, "managerNote", "Đã kiểm tra ảnh, miễn khấu trừ"), 200);
    mvc.perform(multipart("/api/contracts/return-inspection/respond")
        .file(new MockMultipartFile("evidence", "customer.png", "image/png", png))
        .param("contractId", cid)
        .param("action", "DISPUTE")
        .param("reason", "Tôi vẫn chưa đồng ý, đề nghị xem xét lại")
        .with(user("customer")))
      .andExpect(status().isOk());
    JsonNode secondDispute = getAs("manager", "/return-inspection-reviews").get(0);
    String secondDisputeId = secondDispute.path("id").asText();
    postAs("manager", "/return-inspection-reviews/" + secondDisputeId + "/decision",
      Map.of("proposedDeduction", 0, "managerNote", "Xác nhận miễn khấu trừ"), 200);
    mvc.perform(multipart("/api/contracts/return-inspection/respond")
        .param("contractId", cid)
        .param("action", "ACCEPT")
        .with(user("customer")))
      .andExpect(status().isOk());
    assertEquals(pin, contracts.findById(cid).orElseThrow().getPinCode());
    assertEquals("CHECKOUT_REQUESTED", contracts.findById(cid).orElseThrow().getStatus());
    assertEquals("occupied", units.findById(unitCode).orElseThrow().getStatus());
    assertEquals("CUSTOMER_ACCEPTED", getAs("customer", "/contracts/" + cid)
      .path("contract").path("inspectionStatus").asText());
    assertTrue(getAs("customer", "/refunds").findValuesAsText("contractId").stream()
      .noneMatch(cid::equals));
    postAs("staff", "/contracts/return-inspection/complete", Map.of("contractId", cid), 200);
    assertNull(contracts.findById(cid).orElseThrow().getPinCode());
    assertEquals(
      "TERMINATED",
      contracts.findById(cid).orElseThrow().getStatus()
    );
    assertEquals(
      "available",
      units.findById(unitCode).orElseThrow().getStatus()
    );
    assertNull(units.findById(unitCode).orElseThrow().getTenantName());
    assertNull(units.findById(unitCode).orElseThrow().getPinCode());
    postAs(
      "manager",
      "/facilities/units/" + unitCode + "/ready/approve",
      Map.of(),
      409
    );
    postAs(
      "staff",
      "/facilities/units/" + unitCode + "/ready",
      Map.of("notes", "Đã vệ sinh"),
      409
    );
    String paymentId = paid.path("id").asText();
    JsonNode autoRefund = null;
    for (var refund : getAs("customer", "/refunds"))
      if (
        cid.equals(refund.path("contractId").asText()) &&
        "PENDING".equals(refund.path("status").asText())
      ) autoRefund = refund;
    assertNotNull(autoRefund);
    String ref = autoRefund.path("id").asText();
    var refundAmount = autoRefund.path("requestedAmount").decimalValue();
    postAs(
      "customer",
      "/refunds",
      Map.of(
        "paymentId",
        paymentId,
        "amount",
        400000,
        "reason",
        "Vượt hạn mức chờ duyệt"
      ),
      400
    );
    postAs(
      "staff",
      "/refunds/" + ref + "/decision",
      Map.of(
        "decision",
        "APPROVE",
        "approvedAmount",
        refundAmount,
        "reason",
        "Đủ điều kiện"
      ),
      403
    );
    postAs(
      "manager_q7",
      "/refunds/" + ref + "/decision",
      Map.of(
        "decision",
        "APPROVE",
        "approvedAmount",
        refundAmount,
        "reason",
        "Sai chi nhánh"
      ),
      403
    );
    postAs(
      "manager",
      "/refunds/" + ref + "/decision",
      Map.of(
        "decision",
        "APPROVE",
        "approvedAmount",
        refundAmount,
        "reason",
        "Đủ điều kiện"
      ),
      200
    );
    postAs("customer", "/refunds/" + ref + "/cancel", Map.of(), 409);
    var proof = new MockMultipartFile(
      "file",
      "proof.pdf",
      "application/pdf",
      "%PDF-1.4\nmanual transfer proof".getBytes()
    );
    mvc
      .perform(
        multipart("/api/refunds/" + ref + "/evidence")
          .file(proof)
          .param("reference", "TEST-TRANSFER-001")
          .with(user("staff"))
      )
      .andExpect(status().isOk());
    postAs(
      "staff",
      "/refunds/" + ref + "/confirm",
      Map.of("reason", "Staff không được xác nhận"),
      403
    );
    postAs(
      "manager",
      "/refunds/" + ref + "/confirm",
      Map.of("reason", "Đối chiếu bằng chứng thành công"),
      200
    );
    postAs(
      "manager",
      "/refunds/" + ref + "/confirm",
      Map.of("reason", "Lặp thao tác"),
      409
    );
    postAs(
      "customer",
      "/refunds",
      Map.of(
        "paymentId",
        paymentId,
        "amount",
        1,
        "reason",
        "Không còn hạn mức"
      ),
      400
    );
    mvc
      .perform(get("/api/refunds/" + ref + "/evidence").with(user("customer2")))
      .andExpect(status().isNotFound());
  }
}
