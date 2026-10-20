# Kiểm kê test hiện có — chỉ đọc, NOT-TESTED

> **Checkpoint implementation 2026-10-19:** phần FACT-SOURCE của Phase A/B dưới đây ghi snapshot trước đợt sửa auth, không là bằng chứng source/runtime hiện tại. Xem [delta implementation](D:/SWP/storage-rental/docs/testing/auth-implementation-status.md) và contract mới. Người dùng đã chốt tối đa72 byte UTF-8, giữ nguyên whitespace. Checkpoint mới:23unit backend +7unit frontend và TypeScript check đã đạt LOCAL; chưa chạy ứng dụng/API/Supabase, G0–G4 chưa đạt. Xem auth-local-verification.md.

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
| H2 lifecycle integration | RentalLifecycleTest.java:189 — fullRentalAndManualRefundEnforceBranchQuotaAndSeparation | [FACT-SOURCE] Create Reservation; Customer khác GET 404; gửi attempt simulateFailure=true rồi attempt thường, cả hai assert HTTP 200; không assert Payment.status/Invoice.status/Reservation.status; lần trả tiếp assert 409; Manager khác cơ sở assign 403, đúng 200; RENT 200; handover 200; PIN length 6; return request giữ PIN, inspection xóa PIN, Unit cleaning; readiness và manual refund quyền/quota/proof | H2 writes nhiều module, file evidence qua MockMultipartFile; class không có @Transactional test rollback hay @AfterEach cleanup | Không chứng minh Java/PG constraint/transaction thực, JWT chain, register/login/logout UI, audit metadata chi tiết, HandOverRecord cardinality hoặc race handover/assignment |

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
| Flow 1 | H2 lifecycle gọi create, owner GET 404, hai deposit requests HTTP 200 và lần trả tiếp 409; chưa assert FAILED/PAID hay trạng thái Invoice/Reservation; pure cancellation rule | Quote/catalog/filter, 24h exact boundary, price snapshot, overbooking/race/transaction rollback, schema/type/constraints PG, browser JWT |
| Flow 2 | H2 lifecycle có wrong branch assign, assign/rent/handover happy, PIN length | Arrival endpoint, unpaid/wrong hold/type/signature/notes negatives, duplicate/racing handover, all persisted records/audit, daily date/task completion, real customer consent semantics |

## 5. Chính sách kết quả và bước tiếp theo

[NOT-TESTED] Mọi test hiện có được ghi **chưa thực thi trong task này**. Báo cáo test/ảnh/smoke cũ trong artifacts hoặc docs không được chuyển thành PASS hiện tại, FACT-LIVE hay bằng chứng G0.

[FACT-DOC] PostgreSQL suite mới chỉ là ma trận ở g0-g4-integrated-test-plan.md. Không tạo test code, fixture thật, SQL mới, database hoặc cleanup script. Chỉ sau khi G3 được review và có phê duyệt rõ cho phase sau mới cân nhắc chạy harness đã cô lập, không dùng cấu hình mơ hồ.

[UNKNOWN] G0 metadata, dữ liệu thực, trigger/RLS/privilege, PostgreSQL behavior và artifact rollback vẫn chưa có bằng chứng chấp nhận.


## 6. Phân biệt kiểm thử đang tồn tại và case mới đề xuất — cập nhật 2026-10-19

[FACT-SOURCE] Inventory source vẫn chỉ8 backend @Test và3 frontend it; không thêm test code. [FACT-DOC] Integrated plan có114 case tài liệu (63 baseline +51 bổ sung), KHÔNG phải114 test đã được triển khai hoặc thực thi.

| Nhóm case trong kế hoạch | Source test hiện có thực sự assert gì | Thiếu / trạng thái của đề xuất |
|---|---|---|
| AUTH-PWD-01…10 | Happy login hiện có chỉ HTTP200/token nonempty; không signup/OTP/raw-whitespace encode/login E2E | Tất cả NOT-TESTED;07 đã có policy72byte được chốt, execution vẫn NOT-TESTED. Không nói đã có E2E |
| SRS-REG-PHONE/NAV, LOGIN-NAV/ACTIVE, JWT-24H | Không test phone uniqueness/navigation/all roles/status ngoài ACTIVE/24h TTL; existing correct login không chứng minh chúng | Proposed acceptance theo FR-001/002/BR-001/AC-01; runtime/config/role landing cần harness |
| G4-AUTH-RACE + OTP-RACE-01 | Không có race tạo tài khoản/verify OTP test trong source | Account race dùng hai email/cùng username; OTP race dùng một pending; loser không mặc định409; NOT-TESTED/BLOCKED |
| BILL-TYPE-01/STATUS-01 | Chưa test semantic mapping SRS/source | BLOCKED mapping đề xuất; không đổi tên state hay dùng cùng oracle cho Invoice/Payment |
| BILL-ATTEMPT-01 | Existing lifecycle assert HTTP200 cho failed flag và attempt thường,409 lần tiếp; không trực tiếp assert Payment.status/Invoice.status/Reservation.status | Bổ sung count/link/amount/status riêng từng attempt và Invoice; NOT-TESTED; không nâng request coverage thành DB-state coverage |
| SRS-RES-OPS/ADMIN/ISOLATION | Owner GET khác trả404 và assign khác branch403 trong existing test; JWT chain chưa kiểm | Ops/Admin permission contract và branch isolation rộng hơn chưa có; Admin raw/aggregate BLOCKED |
| SRS-TASK-TODAY/ASSIGNEE | Không assertion today-only hoặc Manager chọn Staff/task linkage | Yêu cầu FR-013/AC-05 đã rõ; scheduler/timezone/reschedule/linkage chưa được chứng minh; NOT-TESTED |
| SRS-LOOKUP-ID/CCCD/PHONE; SRS-CATALOG-FILTERS | Không browser lookup ba khóa hoặc structured range/facility filtering | Proposed SRS acceptance; không coi generic substring search là coverage đầy đủ |
| PIN-OPEN-01…08; PIN-CHANGE-01…09; PIN-ATOMIC-01 | Existing lifecycle chỉ kiểm PIN6ký tự từ response, giữ/xóa PIN ở return; không mở/đổi theo status/endAt/biên/equality | NOT-TESTED; source update thiếu endAt guard; stale ACTIVE change còn TBD. EXPIRING_SOON policy đã chốt |
| SIG-01…04 | Handover gọi bằng Staff flagtrue và assert HTTP200/PINlength; không chứng minh evidence khách xác nhận | NOT-TESTED/BLOCKED thiết kế evidence, không đòi endpoint Customer riêng |
| SRS-LOGOUT-TARGET | Không logout/revocation test hiện có | NOT-TESTED/BLOCKED; FR-003 server revoke và redirect giữ nguyên |

[FACT-SOURCE] Không có kiểm thử chuyên biệt cho whitespace-only, confirm raw mismatch, API JSON raw fidelity, UTF-8 byte cap, đổi PIN quá endAt hoặc rollback Contract/Unit PIN được tìm thấy trong inventory. Assertions được đề xuất không phải “observed behavior”.

[FACT-DOC] P-PWD-20261018 đã chốt giữ raw password/confirm và không log credential; P-PIN-20261018 đã chốt EXPIRING_SOON còn hạn được mở/đổi và quá hạn bị từ chối. Các chính sách này không chứng minh source đã tuân thủ. Plain DTO/setter/transport đã kiểm tĩnh; runtime interceptors và effective BCrypt version/behavior vẫn UNKNOWN.

[NOT-TESTED] Chỉ sửa bốn tài liệu testing; không build/test/start app/API/SQL/DB, không chạy seed/dependency resolution. Không commit/push; không sửa SRS/source/config/schema.

[FACT-DOC] Bổ sung2026-10-19 không tạo test implementation mới. Minh họa whitespace dùng P0/Pedge thay dòng literal mơ hồ; optional UX/legacy fallback/72byte proposal không được ghi là coverage đã tồn tại hoặc PASS. Inventory source vẫn8 backend +3 frontend.

## 7. Inventory sau implementation auth — chỉ đếm source

[FACT-SOURCE] Hiện có 31 backend @Test trong 8 class source, 10 frontend it() trong 4 file. Đây là số khai báo source, không phải PASS. Mục1–6 mô tả snapshot trước auth change. Các test mới chỉ dùng fixture/mocks/crypto hoặc helper trong source; chưa thực thi, chưa có PostgreSQL integration test mới.

Auth: PasswordPolicyTest, AuthServiceTest, JwtLifetimeTest, RegistrationAccountServiceTest, OtpDeliveryServiceTest, RegistrationValidatorTest; frontend auth-validation.test.ts và session.test.ts. Kiểm raw/confirmation/72byte, state ACTIVE, OTP TTL/resend/atomic consume, DTO không serialize password, JWT24h, schema guard, mock delivery restriction, role landing/minimal session. Không suy từ các case này rằng uniqueness/transaction/RLS/SMTP/browser đã được xác minh.

## 8. Kết quả local đã thực thi sau khi nhận staging target

[LOCAL-UNIT] Đúng6class auth backend23test đã chạy:0failure/0error/0skip. Hai file auth frontend7test đạt; TypeScript noEmit check exit0. Backend compile toàn110main +8test source đã thành công; không khởi tạo Spring context hoặc truy cập database/SMTP. Các test source còn lại không được chạy trong lượt này. Chi tiết [auth-local-verification.md](D:/SWP/storage-rental/docs/testing/auth-local-verification.md). Không chuyển các ca114 G0–G4 thành PASS từ unit evidence.
