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
    String taskId = "";
    for (var task : dashboard.path("tasks"))
      if (rid.equals(task.path("reservationId").asText())) taskId = task.path("id").asText();
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
      Map.of("contractId", cid, "requestedDate", LocalDate.now().toString()),
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
      200
    );
    assertNull(contracts.findById(cid).orElseThrow().getPinCode());
    assertEquals(
      "cleaning",
      units.findById(unitCode).orElseThrow().getStatus()
    );
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
      200
    );
    postAs(
      "manager",
      "/facilities/units/" + unitCode + "/ready/approve",
      Map.of(),
      200
    );
    String paymentId = paid.path("id").asText();
    var req = postAs(
      "customer",
      "/refunds",
      Map.of(
        "paymentId",
        paymentId,
        "amount",
        500000,
        "reason",
        "Hoàn một phần tiền cọc"
      ),
      200
    );
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
      "customer",
      "/refunds/" + req.path("id").asText() + "/cancel",
      Map.of(),
      200
    );
    req = postAs(
      "customer",
      "/refunds",
      Map.of(
        "paymentId",
        paymentId,
        "amount",
        800000,
        "reason",
        "Hoàn tiền cọc sau nghiệm thu"
      ),
      200
    );
    String ref = req.path("id").asText();
    postAs(
      "staff",
      "/refunds/" + ref + "/decision",
      Map.of(
        "decision",
        "APPROVE",
        "approvedAmount",
        800000,
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
        800000,
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
        800000,
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
