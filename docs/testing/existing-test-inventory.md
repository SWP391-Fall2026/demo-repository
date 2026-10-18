# Kiểm kê test hiện có — chỉ đọc, NOT-TESTED

[NOT-TESTED] Không chạy mvn test, Vitest, build, startup Spring Boot, script kiểm tra có side effect hoặc database. Assertion dưới đây là code của test, không phải kết quả PASS/FAIL. Không dùng kết quả H2 hoặc báo cáo lịch sử để chứng minh PostgreSQL/Supabase.

## 1. Phạm vi kiểm kê

[FACT-SOURCE] Trong backend/src/test/java hiện có 2 class, 8 @Test methods. Trong frontend/src có 2 file Vitest, 3 it() cases. Không tìm thấy repository @DataJpaTest riêng, PostgreSQL/Testcontainers test, migration/down-migration/restore test hoặc browser component/E2E runner test trong các thư mục source/test đã kiểm kê. Đây là kết quả tìm source, không chứng minh mọi test ngoài repository đều không tồn tại.

| Nhóm | File và method/source line | Assertions đã đọc | DB/profile / side effect | Thiếu cho task auth + Flow 1/2 |
|---|---|---|---|---|
| Pure business unit | backend/src/test/java/com/swp391/selfstorage/BusinessRulesTest.java:16 — cancellationUsesRentalStartAndIncludesExactly24Hours | [FACT-SOURCE] Đúng 24h và 25h đủ điều kiện; 24h trừ epsilon không đủ | Không Spring context/DB trong class; calculator với datetime cố định; NOT-TESTED | API hủy, SQL timestamp, clock/timezone, persisted cancellation |
| Pure business unit | BusinessRulesTest.java:27 — overdueRoundsEveryStarted24HoursAndUsesCurrentPriceCap | [FACT-SOURCE] 0/epsilon/24h/24h+epsilon và cap bằng current rate được truyền vào | Không DB; không tự chứng minh lookup giá hiện hành tại PostgreSQL | Không phải test Flow 1/2 end-to-end; không mở rộng scope sang Flow 3 |
| Pure business unit | BusinessRulesTest.java:48 — arrivalAndIncidentBlockNoShowEvenAtDeadline | [FACT-SOURCE] Trước/đúng 30m; arrived_at và incident chặn eligible | Model Reservation in-memory; NOT-TESTED | Endpoint arrived, transaction/locks, job alert và race với handover |
| Pure business unit | BusinessRulesTest.java:63 — extensionIsAddedToBaseAndHoldDoesNotChangeRefundDeadline | [FACT-SOURCE] Extension cộng vào mốc cơ bản; hold không tự đổi deadline hoàn; approved appointment đổi deadline | Pure NoShowRules, không HTTP/DB | Không chứng minh Manager approval API hoặc scheduler chạy đúng |
| Pure business unit | BusinessRulesTest.java:77 — pendingQuotaAndCompletedRefundsCannotExceedOriginalPayment | [FACT-SOURCE] available amount và reject vượt/0 | Pure RefundLimitCalculator | Coverage ngoài Flow 1/2; chỉ ghi inventory, không tự tạo task refund mới |
| H2 MockMvc integration/concurrency | backend/src/test/java/com/swp391/selfstorage/RentalLifecycleTest.java:37 — concurrentRefundRequestsReserveOriginalPaymentQuota | [FACT-SOURCE] Tạo reservation/cọc/hủy; 2 requests đồng thời; sorted statuses mong đợi 200 và 400 | @SpringBootTest + @AutoConfigureMockMvc + @ActiveProfiles(test), H2; seed và DB writes; NOT-TESTED | Không chứng minh PostgreSQL locks; refund ngoài scope mới chỉ là coverage sẵn có |
| H2 API/auth test | RentalLifecycleTest.java:174 — rejectsAnonymousInvalidInputAndWrongRole | [FACT-SOURCE] GET contracts anonymous 401; create reservation thiếu fields 400; Staff create facility 403; login hợp lệ 200 và $.token không rỗng | Context H2; login ghi history; các request business dùng with(user(...)) | Không test registration/OTP/logout; không gửi bearer token trả về vào protected API; không kiểm expiry/signature/revocation |
| H2 lifecycle integration | RentalLifecycleTest.java:189 — fullRentalAndManualRefundEnforceBranchQuotaAndSeparation | [FACT-SOURCE] Create Reservation; Customer khác GET 404; deposit attempt FAILED rồi PAID; lần trả tiếp 409; Manager khác cơ sở assign 403, đúng 200; RENT 200; handover 200; PIN length 6; return request giữ PIN, inspection xóa PIN, Unit cleaning; readiness và manual refund quyền/quota/proof | H2 writes nhiều module, file evidence qua MockMultipartFile; class không có @Transactional test rollback hay @AfterEach cleanup | Không chứng minh Java/PG constraint/transaction thực, JWT chain, register/login/logout UI, audit metadata chi tiết, HandOverRecord cardinality hoặc race handover/assignment |

[FACT-SOURCE] Các helper postAs/getAs dùng MockMvc user postprocessor. Role của business actor được đọc lại từ User seed, nhưng JWT extraction/signature validation không được kiểm qua các call đó. Không gọi endpoint qua mạng; đây không phải browser-to-PG test.

[FACT-SOURCE] Lifecycle method có assert vào repository Contract.pinCode và Unit.status cùng response status. Các bảng Reservation/Invoice/Payment/Handover/Audit được code workflow đụng tới, nhưng method không có assertions đầy đủ cho mọi field, aggregate, FK hoặc audit actor/entity/facility. Không suy ra coverage chỉ vì endpoint được gọi.

## 2. Frontend tests

| File / case | Chứng minh từ test source | Không chứng minh |
|---|---|---|
| frontend/src/shared/lib/format.test.ts:4 — formats VND without fractional amounts | [FACT-SOURCE] money(1450000) có định dạng 1.450.000 | Không kiểm giá/rental quote, tiền cọc, invoice amount, DB numeric precision |
| format.test.ts:7 — distinguishes failed/refunded workflow states | [FACT-SOURCE] Chỉ assert FAILED → danger và COMPLETED → success | Tên case nhắc refunded nhưng không có assertion REFUNDED; không coi là coverage refund đầy đủ |
| frontend/src/shared/api/idempotent-request.test.ts:5 — reuses a payment key after a lost response, then starts a fresh submission | [FACT-SOURCE] fetch bị mock: lỗi mạng lần đầu, response giả lập sau; key lần 1=2, key lần 3 khác | Không có real API/network/DB; chưa test server 5xx, 4xx, reload, payload mismatch, concurrent submissions hoặc global unique |

[NOT-TESTED] Không chạy các case frontend kể cả khi source cho thấy fetch đã mock. Task chỉ cho phép đọc và kế hoạch.

## 3. Profile và side effect theo source

| Cấu hình | FACT-SOURCE | UNKNOWN / điều kiện trước khi chạy sau này |
|---|---|---|
| backend/src/main/resources/application.properties:6 | ddl-auto=validate; datasource từ biến cấu hình; JDBC time_zone=UTC tại L8 | Không đọc credential/DSN. Effective environment/system properties có thể override; chưa kết nối |
| backend/src/main/resources/application-local.properties:1–5 | URL không là H2 cố định, tham chiếu biến mang tên credential; driver H2, ddl-auto=create-drop | Cấu hình không nhất quán; KHÔNG dùng local để test hoặc né validate. Không sửa file này |
| backend/src/test/resources/application-test.properties:1–6 | URL literal in-memory H2 theo profile test, driver H2, ddl-auto=create-drop; app.upload-dir target/test-evidence | H2 thay schema; environment/JVM override và upload path hiệu lực chưa được kiểm. Không coi mvn test mặc định an toàn |
| RentalLifecycleTest.java:139–141 | @BeforeEach gọi LocalDataInitializer.run() trực tiếp | Seed giả lập ghi DB; Profile annotation của initializer không chặn một lời gọi new/manual trong test. Không đưa credential seed vào tài liệu |
| RentalLifecycleTest class annotations | Test listeners được khai báo; không có @Transactional bao ngoài từng test | Không tự giả định mỗi method rollback/DB sạch. Tái sử dụng context có thể giữ state/memory OTP |
| SelfStorageApplication.java:7 | @EnableScheduling hiện có; jobs có @Scheduled và có thể ghi dữ liệu | Chưa có test-only cách vô hiệu job được chứng minh; không chỉ đặt một property bất kỳ rồi coi đã tắt scheduler |
| Evidence upload path | Lifecycle test gọi upload PDF giả và các endpoint manual refund | Có file write ngoài DB, không có cleanup tổng thể được khai báo trong test class; chưa kiểm app.upload-dir hiệu lực |
| backend/pom.xml | Spring Boot 3.3.4, Java 21, H2 runtime, PostgreSQL runtime, starter-test/security-test; không thấy Testcontainers/Flyway/Liquibase/Failsafe-specific suite | Không có rehearsal PostgreSQL hoặc migration test tự động được chứng minh |
| root/frontend package scripts | Có build, Vitest, Maven test/start scripts và check-contract | Các lệnh có thể compile/write/download/start. Không thực thi trong Phase A/B |

## 4. Coverage theo từng flow

| Flow | Có source test gì | Thiếu / BLOCKED |
|---|---|---|
| Đăng ký | Không thấy test registration/OTP flow riêng | Validation matrix, send/verify/resend/expiry/replay/race uniqueness, atomicity User/history, restart volatile state, UI navigation |
| Đăng nhập | Một happy login API assertion token nonempty; protected anonymous 401 riêng | Wrong login, LOCKED/DISABLED, email/case, alias, real JWT bearer, expired/disabled/deleted principal, history error behavior |
| Đăng xuất | Không có test logout được tìm thấy | Client storage/guard và server revoke. User giữ SRS; server gap không được hạ thành pass client-only |
| Flow 1 | H2 lifecycle có create, owner 404, FAILED/PAID deposit, paid duplicate 409; pure cancellation rule | Quote/catalog/filter, 24h exact boundary, price snapshot, overbooking/race/transaction rollback, schema/type/constraints PG, browser JWT |
| Flow 2 | H2 lifecycle có wrong branch assign, assign/rent/handover happy, PIN length | Arrival endpoint, unpaid/wrong hold/type/signature/notes negatives, duplicate/racing handover, all persisted records/audit, daily date/task completion, real customer consent semantics |

## 5. Chính sách kết quả và bước tiếp theo

[NOT-TESTED] Mọi test hiện có được ghi **chưa thực thi trong task này**. Báo cáo test/ảnh/smoke cũ trong artifacts hoặc docs không được chuyển thành PASS hiện tại, FACT-LIVE hay bằng chứng G0.

[FACT-DOC] PostgreSQL suite mới chỉ là ma trận ở g0-g4-integrated-test-plan.md. Không tạo test code, fixture thật, SQL mới, database hoặc cleanup script. Chỉ sau khi G3 được review và có phê duyệt rõ cho phase sau mới cân nhắc chạy harness đã cô lập, không dùng cấu hình mơ hồ.

[UNKNOWN] G0 metadata, dữ liệu thực, trigger/RLS/privilege, PostgreSQL behavior và artifact rollback vẫn chưa có bằng chứng chấp nhận.

