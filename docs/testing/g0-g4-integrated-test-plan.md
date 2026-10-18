# Kế hoạch kiểm thử tích hợp G0–G4 — Phase A/B, chưa thực thi

[NOT-TESTED] Không có kiểm thử/API/SQL/migration/startup được chạy trong task. Chỉ tạo tài liệu sau kiểm tra bốn đường dẫn chưa tồn tại. Không có test code, fixture file, SQL file hay dependency mới.

## 1. Phạm vi, nhãn và thẩm quyền

[FACT-DOC] Phạm vi đúng yêu cầu: đăng ký, đăng nhập, đăng xuất, Flow 1 (Storage Unit Reservation Flow) và Flow 2 (Storage Check-in and Handover Flow). Định nghĩa từ [SRS-F1](D:/SWP/storage-rental/docs/requirements/srs.md:228) và [SRS-F2](D:/SWP/storage-rental/docs/requirements/srs.md:255); xem flow-api-database-traceability.md. Không tự mở rộng sang Flow 3–7; các test refund/return có sẵn chỉ được kiểm kê, không biến thành scope triển khai mới.

- FACT-SOURCE: source hoặc assertion test chứng minh cách implementation/expectation hiện được viết; không có nghĩa đã chạy thành công.
- FACT-DOC: SRS/Scope/reference/decision được ghi rõ. Quyết định mới của user ưu tiên mô tả cũ.
- FACT-LIVE: chỉ snapshot metadata audit user từng cung cấp; capture time/DB/role chưa biết, không đủ thông qua G0 hiện tại.
- INFERENCE: suy luận chưa được thực thi/xác nhận. UNKNOWN: chưa đủ bằng chứng.
- NOT-TESTED: chưa chạy trong task. Không dùng test H2/report lịch sử làm PASS PostgreSQL.

[FACT-DOC] User đã chốt trong task: **giữ yêu cầu logout server FR-003, ghi gap implementation**. Không client-only PASS. Các rule chưa rõ phải TBD — cần xác nhận; không dùng mã HTTP theo thông lệ thay nguồn code.

## 2. Gates và trạng thái hiện tại

| Gate | Đầu vào / phép kiểm tương lai | Điều kiện PASS sau phê duyệt thực thi riêng | FAIL / BLOCKED | Trạng thái hiện tại |
|---|---|---|---|---|
| G0 Schema verification | Catalog/metadata đúng target/schema/role; 16 entity/216 field và constraint/default/sequence/trigger/RLS | Đủ bằng chứng visibility, mapping và mọi mismatch có quyết định review | Thiếu scope/permission/metadata →BLOCKED, mismatch thật trái invariant đã chốt →FAIL khi được kiểm | [UNKNOWN] BLOCKED, không kết nối |
| G1 Business invariants | Source + SRS + decision, auth state, role/owner/branch, Flow1/2, retry/tx/audit | Expected được owner chốt; suite sau này thỏa invariant, kể cả revoke server | Target còn mơ hồ/endpoint còn thiếu →BLOCKED; observed trái target →FAIL sau khi chạy | [FACT-SOURCE / FACT-DOC] Kế hoạch; B-LOGOUT và các TBD còn BLOCKED |
| G2 Data quality/test data | Metadata trước, scope dữ liệu riêng, fixture synthetic, privacy, duplicates/orphans/missing fields | Verifier đủ visibility; không unresolved anomaly theo invariant, fixture cô lập được kiểm | 0 rows dưới RLS không đủ; thiếu evidence/fixture authority →BLOCKED | [NOT-TESTED] Chưa đọc data hoặc seed |
| G3 Environment/safety | PostgreSQL thử nghiệm tách production; role/secret injection/operator approval, jobs/provider/files/restore | Target và effective config an toàn, isolation/cleanup/rollback có owner xác nhận | Config mơ hồ, không PG harness/backup proof, có nguy cơ chạm production →BLOCKED | [UNKNOWN] BLOCKED, không provision |
| G4 Rehearsal/integration | Artifact migration test đã duyệt + G0–G3, validate, real JWT/API/PG/concurrency/rollback/regression | Bằng chứng thực chạy trên PG, DB before/after và mọi P0 đạt; không có blocker bị giấu | Không có approval/env/implementation →BLOCKED; H2 không thay PG | [NOT-TESTED] BLOCKED, không apply/run |

[FACT-DOC] Đây là cách tổ chức G0–G4 cho test plan theo task mới, không tự đổi trạng thái gate trong bộ schema draft cũ. Chỉ việc viết plan hoàn tất không làm gate PASS.

## 3. Tiền kiểm chung và môi trường

[INFERENCE] Trước mọi thực thi tương lai cần một phê duyệt rõ cho phase sau, PostgreSQL/schema/role test định danh được và quyền dữ liệu cần dùng. Không dùng .env/DSN production; không nhận password/token trong tài liệu. Kết nối read-only G0 không tự cho phép seed/write/test G4. Khi target/profile/permission chưa rõ phải dừng.

[FACT-SOURCE] Main config đang validate; test profile nguồn mô tả H2 create-drop, local config không phải fixed H2 URL nhưng driver H2/create-drop. Runtime env/system properties và upload directory chưa được xác minh. Không coi mvn test, npm check hay startup là kiểm tra chỉ đọc. Không đưa lệnh thực thi mơ hồ vào task này.

[FACT-SOURCE] Scheduler/seed/history/file upload có side effect. Kế hoạch G3 phải xác định cách cô lập jobs/initializer đã được chứng minh, không giả định một flag sẽ tắt @EnableScheduling. Không có backup/restore/reset/cleanup được thực hiện.

## 4. Fixtures chỉ ở mức thiết kế

| Nhãn | Nội dung planned, không dữ liệu thật | Gate cần có |
|---|---|---|
| F-BASE | Customer A/B, Staff/Manager A/B, Ops/Admin; Facility A/B; Unit S/M/L/CLIMATE với status/type/price được kiểm soát, roles ACTIVE/LOCKED/DISABLED | [INFERENCE] G3 approved test target và fixture authority |
| F-REG | Name synthetic, DOB tương đối theo ngày test, gender hợp lệ, phone/CCCD synthetic đáp ứng validator, username nonce 4–20, email domain thử nghiệm không thuộc denylist | [FACT-SOURCE] Validator yêu cầu; không ghi PII/CCCD literal; credential là biến ephemeral do harness cấp, không lưu vào plan |
| F-OTP | Pending mock của synthetic identity, OTP chỉ giữ biến trong RAM; valid/invalid/expired/replayed | [FACT-SOURCE] Memory map + System.currentTimeMillis; harness time/expiry vẫn TBD và không code-change trong A/B |
| F-BOOK | T0 tạo, startDate/rentalStartAt/appointmentAt hợp lệ, type capacity, policies/snapshot, pending DEPOSIT/RENT invoices | [INFERENCE] Không tự tạo Invoice lịch sử từ từng Payment; chỉ synthetic test data sau approval |
| F-HAND | RESERVED + PAID deposit, Unit available/assigned, RENT pending/paid, heldBy match/different, signature/notes variants | [FACT-SOURCE] Preconditions Handover/Assign; không tạo customer consent thật giả |
| F-JWT | JWT thật được cấp bởi isolated test app với material test riêng được operator quản lý | [INFERENCE] Không lấy token/key runtime hoặc đọc browser storage thật; không giả .with(user()) là crypto coverage |

[FACT-SOURCE] Validation chặn một số fake email domains; không mặc định mọi địa chỉ example đều được chấp nhận. Các placeholder trên không là fixture có thể seed ngay, không chứa credential, email/CCCD hoặc bank proof thật.

[UNKNOWN] Biên 18/100 tuổi, exact OTP time và JVM/business timezone cần harness rõ. Không đổi application Clock hoặc dùng private reflection/time instrumentation chưa được duyệt. Nếu không kiểm soát được thời gian thì case tương ứng BLOCKED.

## 5. Cách xác minh và cleanup dự kiến

[FACT-DOC] Không tạo SQL nháp mới ngoài danh sách deliverable. Với G0, chỉ tham chiếu bộ metadata có sẵn M01–M12 ở docs/drafts/schema-alignment-20261018/sql/00_metadata_readonly.sql để operator cân nhắc sau phê duyệt. Definition có literal phải được làm sạch; không xuất secret. Bộ Q01–Q08 ở 01_quality_queries_readonly.sql chỉ là template/generator dựa existence; không chạy và không tự dùng trên bảng/cột live chưa xác minh.

[INFERENCE] Assertions dữ liệu sau này lấy theo fixture IDs và so count/link/status/amount, không trích customer names/CCCD/credential/PIN/token. Before/after phải cùng namespace/snapshot, verifier đủ quyền không bị RLS tạo false zero. Metadata/query thất bại vì quyền là BLOCKED, không tự báo MISSING hoặc sạch.

[INFERENCE] G3-CLEANUP là quy trình được owner duyệt cho môi trường test riêng: fixture ownership, memory OTP/session, upload paths, jobs và rollback/restore artifact có kiểm chứng. Không tự giả test rollback, không phụ thuộc thứ tự method, không reset sequence để lấp ID gap. Không có SQL xóa/truncate/drop hoặc reset nào được thực hiện/đưa thành script chạy trong A/B.

## 6. Ma trận tổng quan (63 case)

[NOT-TESTED] PLANNED mô tả kế hoạch đủ để review, không đồng nghĩa được phép chạy. BLOCKED cần thông tin/thiết kế/approval; không biến TBD thành expected theo thông lệ. Mọi case dưới đây chưa thực thi.

| Test ID | Gate | Flow | Mục tiêu | Priority | Trạng thái |
|---|---|---|---|---|---|
| G0-ID | G0 | Tất cả | Xác định đúng DB/schema/role/version và scope quan sát | P0 | BLOCKED / NOT-TESTED |
| G0-MAPPING | G0 | Tất cả | Đối chiếu 16 entity / 216 field với catalog được phép | P0 | BLOCKED / NOT-TESTED |
| G0-TEMPORAL | G0 | Auth / Flow 1 / Flow 2 | Kiểm type/length/precision/nullable/default và timestamp semantics | P0 | BLOCKED / NOT-TESTED |
| G0-CONSTRAINT | G0 | Auth / Flow 1 / Flow 2 | Xác minh PK/unique/FK/CHECK/index/sequence thực có | P0 | BLOCKED / NOT-TESTED |
| G0-RLS | G0 | Tất cả | Ghi trigger/RLS/policy/privilege và giới hạn quyền | P0 | BLOCKED / NOT-TESTED |
| G0-AUDIT | G0 | Flow 1 / Flow 2 audit | Xác nhận ba cột audit từ current live snapshot | P0 | BLOCKED / NOT-TESTED |
| G0-EXTRA | G0 | Tất cả | Phân biệt bảng legacy/ngoài entity và metadata không thấy | P0 | BLOCKED / NOT-TESTED |
| G1-REG-VALID | G1 | Đăng ký | Yêu cầu OTP hợp lệ chưa tạo User | P0 | PLANNED / NOT-TESTED |
| G1-REG-INVALID | G1 | Đăng ký | Biên validation registration | P0 | PLANNED / NOT-TESTED |
| G1-REG-UNIQUENESS | G1 | Đăng ký | Precheck username/email đã có | P0 | PLANNED / NOT-TESTED |
| G1-REG-VERIFY | G1 | Đăng ký | Verify đúng tạo CUSTOMER và session | P0 | PLANNED / NOT-TESTED |
| G1-REG-OTP-NEG | G1 | Đăng ký | Reject OTP sai, missing, replay | P0 | PLANNED / NOT-TESTED |
| G1-REG-OTP-EXP | G1 | Đăng ký | Biên hết hạn OTP | P0 | BLOCKED / NOT-TESTED |
| G1-REG-RESEND | G1 | Đăng ký | Phân biệt resend hiện trạng với nghĩa business | P0 | PLANNED / NOT-TESTED |
| G1-LOGIN-VALID | G1 | Đăng nhập | Login username/email và chuẩn hóa DTO role | P0 | PLANNED / NOT-TESTED |
| G1-LOGIN-INVALID | G1 | Đăng nhập | Tách bad login 400 với protected API 401 | P0 | PLANNED / NOT-TESTED |
| G1-LOGIN-LOCKED | G1 | Đăng nhập | User LOCKED/DISABLED không nhận token | P0 | PLANNED / NOT-TESTED |
| G1-JWT-GUARD | G1 | Đăng nhập / bảo vệ flow | Bearer thiếu/hỏng/hết hạn và principal inactive | P0 | PLANNED / NOT-TESTED |
| G1-LOGOUT-CLIENT | G1 | Đăng xuất | Xóa session client đúng source | P0 | PLANNED / NOT-TESTED |
| G1-LOGOUT-SERVER | G1 | Đăng xuất | Acceptance server revoke theo SRS được user giữ | P0 | BLOCKED / NOT-TESTED |
| G1-F1-CATALOG | G1 | Flow 1 | Catalog public và dữ liệu không có PIN | P0 | PLANNED / NOT-TESTED |
| G1-F1-QUOTE | G1 | Flow 1 | Giá server và validation thời hạn/loại | P0 | PLANNED / NOT-TESTED |
| G1-F1-CREATE | G1 | Flow 1 | Tạo hold theo type, snapshot và hai invoice | P0 | PLANNED / NOT-TESTED |
| G1-F1-CREATE-NEG | G1 | Flow 1 | Validation request và role trước create | P0 | PLANNED / NOT-TESTED |
| G1-F1-OWNERSHIP | G1 | Flow 1 | Ownership và khác biệt list/get scope | P0 | PLANNED / NOT-TESTED |
| G1-F1-PAID | G1 | Flow 1 | Deposit success và server-authoritative amount | P0 | PLANNED / NOT-TESTED |
| G1-F1-PAY-FAIL | G1 | Flow 1 | Failure mock không phải HTTP failure | P0 | PLANNED / NOT-TESTED |
| G1-F1-PAY-KEY | G1 | Flow 1 | Idempotent replay và attempt mới | P0 | PLANNED / NOT-TESTED |
| G1-F1-EXPIRY | G1 | Flow 1 | Giữ giá và mốc đủ24h chờ cọc | P0 | BLOCKED / NOT-TESTED |
| G1-F1-CANCEL | G1 | Flow 1 | Hủy chỉ giải phóng đúng hold | P0 | PLANNED / NOT-TESTED |
| G1-F1-POLICY-TBD | G1 | Flow 1 | Chốt late cancel và hiển thị/calendar availability | P0 | BLOCKED / NOT-TESTED |
| G1-F2-ASSIGN | G1 | Flow 2 | Manager gán đúng Unit sau cọc | P0 | PLANNED / NOT-TESTED |
| G1-F2-DAILY | G1 | Flow 2 | Task scope hiện tại và gap today | P0 | PLANNED / NOT-TESTED |
| G1-F2-ARRIVED | G1 | Flow 2 | Arrival chặn NO_SHOW nhầm | P0 | PLANNED / NOT-TESTED |
| G1-F2-RENT | G1 | Flow 2 | Thu kỳ đầu sau gán Unit | P0 | PLANNED / NOT-TESTED |
| G1-F2-HANDOVER | G1 | Flow 2 | Handover đủ cọc/rent/signature/hold | P0 | PLANNED / NOT-TESTED |
| G1-F2-HANDOVER-NEG | G1 | Flow 2 | Reject thiếu payment/signature/notes hoặc sai hold | P0 | PLANNED / NOT-TESTED |
| G1-F2-PIN-VIEW | G1 | Flow 2 | Xem contracts và verify access simulation | P0 | PLANNED / NOT-TESTED |
| G1-F2-CONSENT-TBD | G1 | Flow 2 | Chốt consent, early handover và task completion | P0 | BLOCKED / NOT-TESTED |
| G2-FIXTURE | G2 | Tất cả | Thiết kế fixtures tổng hợp không dữ liệu thật | P0 | PLANNED / NOT-TESTED |
| G2-DUPLICATE | G2 | Auth / Flow 1 / Flow 2 | Kiểm duplicate keys chỉ khi shape/quyền đã xác minh | P0 | BLOCKED / NOT-TESTED |
| G2-ORPHAN | G2 | Flow 1 / Flow 2 | Kiểm links owner/facility/reservation/invoice/contract/handover/task | P0 | BLOCKED / NOT-TESTED |
| G2-COMPLETENESS | G2 | Flow 1 / Flow 2 | Timestamps/snapshot/hold/required fields ở active rows | P0 | BLOCKED / NOT-TESTED |
| G2-ENUM-NUMERIC | G2 | Flow 1 / Flow 2 | State/length/numeric phù hợp code và dữ liệu không bị thu hẹp | P0 | BLOCKED / NOT-TESTED |
| G2-ISOLATION | G2 | Tất cả | Định nghĩa isolation và cleanup từng case | P0 | PLANNED / NOT-TESTED |
| G3-TARGET | G3 | Tất cả | Gate xác nhận environment test khác production | P0 | BLOCKED / NOT-TESTED |
| G3-PRIVILEGE | G3 | Tất cả | Tách quyền metadata G0 và quyền test ghi tương lai | P0 | BLOCKED / NOT-TESTED |
| G3-JOBS-PROVIDER | G3 | Auth / Flow 1 / Flow 2 | Ngăn side effect ngoại vi khi test sau này | P0 | BLOCKED / NOT-TESTED |
| G3-CLEANUP | G3 | Tất cả | Review backup/restore/cleanup không chạm production | P0 | BLOCKED / NOT-TESTED |
| G3-MIGRATION-ARTIFACT | G3 | Tất cả | Có migration test artifact đã được duyệt mà không bỏ guard draft | P0 | BLOCKED / NOT-TESTED |
| G4-SCHEMA | G4 | Tất cả | Rehearsal migration đã duyệt rồi validate | P0 | BLOCKED / NOT-TESTED |
| G4-AUTH-E2E | G4 | Đăng ký / đăng nhập | Registration OTP → login → protected API bằng JWT thật | P0 | BLOCKED / NOT-TESTED |
| G4-AUTH-RACE | G4 | Đăng ký | Hai verify cạnh tranh và uniqueness thật | P0 | BLOCKED / NOT-TESTED |
| G4-LOGOUT | G4 | Đăng xuất | Thu hồi server theo tiêu chí user giữ | P0 | BLOCKED / NOT-TESTED |
| G4-F1-E2E | G4 | Flow 1 | Browse → quote/create → failed deposit → retry success → pass/history | P0 | BLOCKED / NOT-TESTED |
| G4-F1-CAPACITY-RACE | G4 | Flow 1 | Không overbook type cuối khi create đồng thời | P0 | BLOCKED / NOT-TESTED |
| G4-F1-REPLAY | G4 | Flow 1 | Payment concurrent replay và payload/key scope | P0 | BLOCKED / NOT-TESTED |
| G4-F1-EXPIRY-CANCEL | G4 | Flow 1 | 24h, cancel và job phối hợp không release nhầm | P0 | BLOCKED / NOT-TESTED |
| G4-F2-E2E | G4 | Flow 2 | Manager assign → Staff arrival → rent → handover → view/verify | P0 | BLOCKED / NOT-TESTED |
| G4-F2-SCOPE-NEG | G4 | Flow 2 | Wrong branch/role, unpaid, signature/hold lỗi | P0 | BLOCKED / NOT-TESTED |
| G4-F2-HANDOVER-RACE | G4 | Flow 2 | Hai Staff cùng hoàn tất một Reservation | P0 | BLOCKED / NOT-TESTED |
| G4-ROLLBACK | G4 | Flow 1 / Flow 2 | Chứng minh transaction bằng lỗi giữa flow | P0 | BLOCKED / NOT-TESTED |
| G4-REGRESSION | G4 | Đăng ký / đăng nhập / đăng xuất / Flow 1 / Flow 2 | Regression và rollback release rehearsal | P0 | BLOCKED / NOT-TESTED |

## G0 — chi tiết case

### G0-ID — Xác định đúng DB/schema/role/version và scope quan sát

| Trường | Nội dung |
|---|---|
| Test ID | G0-ID |
| Giai đoạn | G0 |
| Flow | Tất cả |
| Step | Xác định đúng DB/schema/role/version và scope quan sát |
| Mục tiêu | Xác định đúng DB/schema/role/version và scope quan sát |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS và decision log; [NOT-TESTED] chưa chạy. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator cân nhắc metadata M01/M02, không tự chạy SQL. |
| Expected HTTP status / response | N/A — không có HTTP. |
| Expected database state | Không có thay đổi DB. |
| Cách xác minh dữ liệu | Xác nhận capture time, database/schema/search_path/current_role, read-only và visibility; thiếu mục thì BLOCKED. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-MAPPING — Đối chiếu 16 entity / 216 field với catalog được phép

| Trường | Nội dung |
|---|---|
| Test ID | G0-MAPPING |
| Giai đoạn | G0 |
| Flow | Tất cả |
| Step | Đối chiếu 16 entity / 216 field với catalog được phép |
| Mục tiêu | Đối chiếu 16 entity / 216 field với catalog được phép |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] mapping-inventory.json; [FACT-DOC] schema REF; [UNKNOWN] live. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator review M03/M04; nối field inventory với đúng schema/OID, không suy từ REF. |
| Expected HTTP status / response | N/A. |
| Expected database state | Giữ mọi bảng/cột hiện có. |
| Cách xác minh dữ liệu | Gán MATCH/MISSING/EXTRA/mismatch/UNVERIFIED theo bằng chứng và quyền; thiếu row info_schema chưa đủ báo missing. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-TEMPORAL — Kiểm type/length/precision/nullable/default và timestamp semantics

| Trường | Nội dung |
|---|---|
| Test ID | G0-TEMPORAL |
| Giai đoạn | G0 |
| Flow | Auth / Flow 1 / Flow 2 |
| Step | Kiểm type/length/precision/nullable/default và timestamp semantics |
| Mục tiêu | Kiểm type/length/precision/nullable/default và timestamp semantics |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] DTO/entity/Clock; [UNKNOWN] PG mapping/round-trip. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review metadata M03/M04 + inventory thời gian; không ALTER TYPE. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không cast/backfill dữ liệu. |
| Cách xác minh dữ liệu | Phân biệt LocalDateTime/TIMESTAMP/timestamptz, Java init khác DEFAULT, numeric unspecified; không thu hẹp varchar theo hint. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-CONSTRAINT — Xác minh PK/unique/FK/CHECK/index/sequence thực có

| Trường | Nội dung |
|---|---|
| Test ID | G0-CONSTRAINT |
| Giai đoạn | G0 |
| Flow | Auth / Flow 1 / Flow 2 |
| Step | Xác minh PK/unique/FK/CHECK/index/sequence thực có |
| Mục tiêu | Xác minh PK/unique/FK/CHECK/index/sequence thực có |
| Nhãn bằng chứng và nguồn | [FACT-DOC] REF; [UNKNOWN] live. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator cân nhắc M05–M09; definition chỉ sau review không chứa secret. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không thay constraint, quyền, sequence; không nextval/setval. |
| Cách xác minh dữ liệu | So PK User/LoginHistory/Audit và state/uniqueness; không thêm constraint vì Optional; metadata thiếu giữ UNVERIFIED. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-RLS — Ghi trigger/RLS/policy/privilege và giới hạn quyền

| Trường | Nội dung |
|---|---|
| Test ID | G0-RLS |
| Giai đoạn | G0 |
| Flow | Tất cả |
| Step | Ghi trigger/RLS/policy/privilege và giới hạn quyền |
| Mục tiêu | Ghi trigger/RLS/policy/privilege và giới hạn quyền |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS và decision log; [NOT-TESTED] chưa chạy. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator review M10–M12 sau scope duyệt; không function body nhạy cảm. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không đổi role/RLS/trigger. |
| Cách xác minh dữ liệu | Cờ enabled/forced/owner/bypass/visible được ghi; 0 rows dưới RLS không chứng minh sạch. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-AUDIT — Xác nhận ba cột audit từ current live snapshot

| Trường | Nội dung |
|---|---|
| Test ID | G0-AUDIT |
| Giai đoạn | G0 |
| Flow | Flow 1 / Flow 2 audit |
| Step | Xác nhận ba cột audit từ current live snapshot |
| Mục tiêu | Xác nhận ba cột audit từ current live snapshot |
| Nhãn bằng chứng và nguồn | [FACT-LIVE] snapshot cũ user cung cấp, capture time UNKNOWN; [FACT-SOURCE] [AUDIT](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java:26) |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator thu metadata audit đúng DB/schema/role và thời điểm. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không add column. |
| Cách xác minh dữ liệu | Đối chiếu user_id/entity_id/facility_code + time_str/time_display/ip/ip_address; lịch sử snapshot không tự PASS G0. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G0-EXTRA — Phân biệt bảng legacy/ngoài entity và metadata không thấy

| Trường | Nội dung |
|---|---|
| Test ID | G0-EXTRA |
| Giai đoạn | G0 |
| Flow | Tất cả |
| Step | Phân biệt bảng legacy/ngoài entity và metadata không thấy |
| Mục tiêu | Phân biệt bảng legacy/ngoài entity và metadata không thấy |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS và decision log; [NOT-TESTED] chưa chạy. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review relation inventory, staff_tasks và cột extra; không SQL DDL. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không xóa/hợp nhất object. |
| Cách xác minh dữ liệu | Object live extra được ghi là tồn tại, không mặc định lỗi; nguồn REF/permission-limited được tách rõ. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

## G1 — chi tiết case

### G1-REG-VALID — Yêu cầu OTP hợp lệ chưa tạo User

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-VALID |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Yêu cầu OTP hợp lệ chưa tạo User |
| Mục tiêu | Yêu cầu OTP hợp lệ chưa tạo User |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VALIDATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:198); [AUTH-OTP](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:322) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST /api/auth/register và alias /api/auth/send-otp với F-REG. |
| Expected HTTP status / response | [FACT-SOURCE] 200 success=true, data.email/code và root code/email; không token ở bước gửi. |
| Expected database state | users/login_history/audit không có insert từ bước này; pending memory được đặt TTL 5m. |
| Cách xác minh dữ liệu | So count theo fixture ID trước/sau, kiểm response bằng biến không log OTP; inspect memory chỉ trong harness cô lập. |
| Expected authentication / authorization | Public permitAll. |
| Expected transaction / audit / side effect | Không outer tx; đọc uniqueness; OTP/console mô phỏng, không thấy email network call. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-REG-INVALID — Biên validation registration

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-INVALID |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Biên validation registration |
| Mục tiêu | Biên validation registration |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VALIDATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:198) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST send-otp; parameterize name 1/51, dob invalid/future/tuổi ngoài18–100, gender thiếu/sai, phone/email/CCCD/username sai, credential quá ngắn/confirm khác. |
| Expected HTTP status / response | [FACT-SOURCE] 400 success=false cho từng nhánh riêng. |
| Expected database state | Không tạo User/history; invalid path không có pending mới sau validate. |
| Cách xác minh dữ liệu | Case chỉ đổi một field của F-REG; không dùng số CCCD/credential thật. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Không DB write/audit; không thực hiện test trong task. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-REG-UNIQUENESS — Precheck username/email đã có

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-UNIQUENESS |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Precheck username/email đã có |
| Mục tiêu | Precheck username/email đã có |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VALIDATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:198); [USER-REPO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java:9) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST send-otp với username hoặc email đã gắn fixture existing user. |
| Expected HTTP status / response | [FACT-SOURCE] 400; không mặc định409 ở send-otp precheck. |
| Expected database state | Không tạo User hoặc login_history mới. |
| Cách xác minh dữ liệu | Query/assert theo synthetic key trong clone; unique constraint live còn cần G0. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-REG-VERIFY — Verify đúng tạo CUSTOMER và session

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-VERIFY |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Verify đúng tạo CUSTOMER và session |
| Mục tiêu | Verify đúng tạo CUSTOMER và session |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:353); [AUTH-SAVE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:392); [USER-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java:21) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST /api/auth/verify-otp với email và biến OTP lấy từ mock/harness hợp lệ. |
| Expected HTTP status / response | [FACT-SOURCE] 200 success=true, UserDto và root token; không password trong UserDto. |
| Expected database state | Một User CUSTOMER/ACTIVE, credential được encode; history SUCCESS được cố gắng ghi; pending bị xóa. |
| Cách xác minh dữ liệu | Đọc only synthetic user fields không nhạy cảm; dùng encoder assertion trên fixture trong RAM nếu được duyệt, không xuất hash/token/CCCD. |
| Expected authentication / authorization | Public; không cho role request nâng quyền. |
| Expected transaction / audit / side effect | Không outer auth tx; history best-effort, không tự hứa atomic rollback. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-REG-OTP-NEG — Reject OTP sai, missing, replay

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-OTP-NEG |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Reject OTP sai, missing, replay |
| Mục tiêu | Reject OTP sai, missing, replay |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:353) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST verify-otp với email/code thiếu, không pending, sai code; sau success replay cùng logical OTP. |
| Expected HTTP status / response | [FACT-SOURCE] 400 tương ứng; không token thành công. |
| Expected database state | Không tạo User mới ở các nhánh lỗi; sai code chưa thấy attempt counter/lockout. |
| Cách xác minh dữ liệu | Assert User count theo key; pending đã xóa sau success; không log mã. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Không tự tạo rule rate-limit chưa có trong code. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-REG-OTP-EXP — Biên hết hạn OTP

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-OTP-EXP |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Biên hết hạn OTP |
| Mục tiêu | Biên hết hạn OTP |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:353) |
| Precondition | G3 approved harness cho OTP System.currentTimeMillis (khác Clock injected); chưa có bằng chứng kiểm soát thời gian. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Verify khi System.currentTimeMillis > expiresAt; exact equality được mô tả riêng theo source. |
| Expected HTTP status / response | [FACT-SOURCE] >deadline →400 và remove pending; exact equality chưa vào nhánh expired nếu các điều kiện còn đúng. |
| Expected database state | Không tạo User khi expired. |
| Cách xác minh dữ liệu | Cần harness kiểm soát System time hoặc cách chờ được duyệt; không sửa app clock để test trong Phase A/B. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G1-REG-RESEND — Phân biệt resend hiện trạng với nghĩa business

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-RESEND |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Phân biệt resend hiện trạng với nghĩa business |
| Mục tiêu | Phân biệt resend hiện trạng với nghĩa business |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-RESEND](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:432); [UNKNOWN] B-OTP |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | POST /api/auth/resend-otp email có/không pending, bao gồm pending đã quá TTL nhưng chưa verify. |
| Expected HTTP status / response | [FACT-SOURCE] Có pending →200 data hiện có; không pending →400. [UNKNOWN] Target resend mới/TTL/rate limit TBD. |
| Expected database state | Không DB write; không tạo OTP mới/extend TTL trong method. |
| Cách xác minh dữ liệu | So response với biến OTP trước và kiểm verify expiry sau; không xuất giá trị. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Giữ source behavior riêng, không chốt target từ tên resend. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-LOGIN-VALID — Login username/email và chuẩn hóa DTO role

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-VALID |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | Login username/email và chuẩn hóa DTO role |
| Mục tiêu | Login username/email và chuẩn hóa DTO role |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-LOGIN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:113); [USER-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java:21) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/auth/login; username hoặc email mixed case/space với fixture ACTIVE hợp lệ. |
| Expected HTTP status / response | [FACT-SOURCE] 200 success=true; root token và UserDto; UI navigate / theo source. |
| Expected database state | User không update; cố gắng ghi LoginHistory SUCCESS. |
| Cách xác minh dữ liệu | Kiểm response shape/role alias, history trên fixture không log token hoặc input credential. |
| Expected authentication / authorization | Public login; User lookup. |
| Expected transaction / audit / side effect | History best-effort, Jwt issuance; không outer tx. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-LOGIN-INVALID — Tách bad login 400 với protected API 401

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-INVALID |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | Tách bad login 400 với protected API 401 |
| Mục tiêu | Tách bad login 400 với protected API 401 |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-LOGIN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:113); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST login blank/missing, unknown username hoặc wrong credential; mỗi nhánh fixture độc lập. |
| Expected HTTP status / response | [FACT-SOURCE] 400 success=false, không token. Missing input dừng trước history; unknown/wrong credential cố ghi FAILED. |
| Expected database state | Không tạo/update User; history tùy nhánh như code. |
| Cách xác minh dữ liệu | Kiểm absence token và history by synthetic case, không coi mọi lỗi auth là401. |
| Expected authentication / authorization | Public. |
| Expected transaction / audit / side effect | Không tiết lộ dữ liệu riêng qua báo cáo; helper history lỗi bị catch. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-LOGIN-LOCKED — User LOCKED/DISABLED không nhận token

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-LOCKED |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | User LOCKED/DISABLED không nhận token |
| Mục tiêu | User LOCKED/DISABLED không nhận token |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-LOGIN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:113) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST login với credential đúng của synthetic locked hoặc disabled user. |
| Expected HTTP status / response | [FACT-SOURCE] 400, message báo khóa, không token. |
| Expected database state | Cố ghi LoginHistory BLOCKED; User không đổi. |
| Cách xác minh dữ liệu | Đảm bảo input match để không rẽ nhánh wrong credential trước status. |
| Expected authentication / authorization | Public; User status fixture được duyệt. |
| Expected transaction / audit / side effect | Không tự normalize status NULL/khác sang ACTIVE. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-JWT-GUARD — Bearer thiếu/hỏng/hết hạn và principal inactive

| Trường | Nội dung |
|---|---|
| Test ID | G1-JWT-GUARD |
| Giai đoạn | G1 |
| Flow | Đăng nhập / bảo vệ flow |
| Step | Bearer thiếu/hỏng/hết hạn và principal inactive |
| Mục tiêu | Bearer thiếu/hỏng/hết hạn và principal inactive |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [JWT-FILTER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java:30); [USER-DETAILS](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/CustomUserDetailsService.java:22); [SECURITY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/SecurityConfig.java:34) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | GET /api/contracts hoặc POST reservations với token thiếu/malformed/expired; User inactive với valid fixture token. |
| Expected HTTP status / response | [FACT-SOURCE] Dự kiến401 entry point khi không authentication. [UNKNOWN] Filter exception user deleted: exact response TBD. |
| Expected database state | Không mutation nghiệp vụ/history trên nhánh auth guard. |
| Cách xác minh dữ liệu | Harness dùng JWT thật của test context; không .with(user()) thay thế crypto chain; không xuất token. |
| Expected authentication / authorization | Protected; disabled loadUserDetails isEnabled false. |
| Expected transaction / audit / side effect | Không gọi token runtime/DB hiện có. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-LOGOUT-CLIENT — Xóa session client đúng source

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGOUT-CLIENT |
| Giai đoạn | G1 |
| Flow | Đăng xuất |
| Step | Xóa session client đúng source |
| Mục tiêu | Xóa session client đúng source |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [UI-LOGOUT](D:/SWP/storage-rental/frontend/src/app/layouts/AppShell.tsx:51); [UI-SESSION](D:/SWP/storage-rental/frontend/src/features/identity/session.ts:16); [UI-GUARD](D:/SWP/storage-rental/frontend/src/app/guards/RoleGuard.tsx:13) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Click logout trên protected route và public route với session synthetic trong browser harness cô lập. |
| Expected HTTP status / response | N/A HTTP logout; [FACT-SOURCE] xóa session/localStorage, protected guard →/login; public page không bắt buộc navigate. |
| Expected database state | Không DB write/history/audit do logout click. |
| Cách xác minh dữ liệu | Assert storage/listener/route, không đọc browser session thật. |
| Expected authentication / authorization | Client session fixture; không thay expected server. |
| Expected transaction / audit / side effect | Client-only; không gọi HTTP logout. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-LOGOUT-SERVER — Acceptance server revoke theo SRS được user giữ

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGOUT-SERVER |
| Giai đoạn | G1 |
| Flow | Đăng xuất |
| Step | Acceptance server revoke theo SRS được user giữ |
| Mục tiêu | Acceptance server revoke theo SRS được user giữ |
| Nhãn bằng chứng và nguồn | [FACT-DOC] [SRS-LOGOUT](D:/SWP/storage-rental/docs/requirements/srs.md:143); user xác nhận giữ SRS; [FACT-SOURCE] gap |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | TBD — route/DTO/logout protocol chưa tồn tại; sau logout thử lại request protected bằng token cũ của test. |
| Expected HTTP status / response | [FACT-DOC] Token đã logout phải không được chấp nhận. Exact HTTP/status/response TBD — cần thiết kế được duyệt. |
| Expected database state | Revocation/session state TBD; không tự tạo bảng token. |
| Cách xác minh dữ liệu | Không coi clear storage là đạt SRS; replay trên harness chỉ sau implementation scope được duyệt. |
| Expected authentication / authorization | Current session cần bị revoke; scope một phiên/mọi thiết bị còn mở. |
| Expected transaction / audit / side effect | Không triển khai endpoint/revocation trong Phase A/B. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G1-F1-CATALOG — Catalog public và dữ liệu không có PIN

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CATALOG |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Catalog public và dữ liệu không có PIN |
| Mục tiêu | Catalog public và dữ liệu không có PIN |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [FACILITY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:37); [CATALOG](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/facility/service/FacilityService.java:41) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | GET /api/facilities và /api/facilities/units với Unit available/occupied. |
| Expected HTTP status / response | [FACT-SOURCE] 200; Unit catalog chỉ available, map fields công khai; không pinCode. |
| Expected database state | R facilities/units, không W. |
| Cách xác minh dữ liệu | Đối chiếu returned IDs/status, không test route /unit-types như đã được implement. |
| Expected authentication / authorization | Guest được phép. |
| Expected transaction / audit / side effect | Không audit/read-side mutation theo method. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-QUOTE — Giá server và validation thời hạn/loại

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-QUOTE |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Giá server và validation thời hạn/loại |
| Mục tiêu | Giá server và validation thời hạn/loại |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [QUOTE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/reservations/calculate unitType/facilityCode/durationMonths hợp lệ và biến thể0/37/type sai. |
| Expected HTTP status / response | [FACT-SOURCE] 200 monthlyRate/deposit/total; 400 invalid;409 nếu không có available type trong facility. |
| Expected database state | R Units/policies, không Reservation/Invoice/Payment insert. |
| Cách xác minh dữ liệu | So arithmetic theo fixture policy/unit; quote không phải committed reservation. |
| Expected authentication / authorization | Authenticated qua security; quote không có role require riêng. |
| Expected transaction / audit / side effect | Không outer write tx. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-CREATE — Tạo hold theo type, snapshot và hai invoice

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CREATE |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Tạo hold theo type, snapshot và hai invoice |
| Mục tiêu | Tạo hold theo type, snapshot và hai invoice |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [RESERVATION-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/dto/CreateReservationRequest.java:6); [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/reservations với F-BOOK hợp lệ. |
| Expected HTTP status / response | [FACT-SOURCE] 200 Reservation PENDING_PAYMENT; không mặc định201. |
| Expected database state | Một Reservation owner=actor + snapshot; 2 Invoice PENDING DEPOSIT/RENT; CREATE_RESERVATION audit; không gán Unit cụ thể. |
| Cách xác minh dữ liệu | Assert links/amounts/status trong fixture; source transactions cần xác minh PG ở G4. |
| Expected authentication / authorization | CUSTOMER ACTIVE. |
| Expected transaction / audit / side effect | @Transactional CreateReservationWorkflow bao gồm Invoice/Audit; Unit chỉ đọc. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-CREATE-NEG — Validation request và role trước create

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CREATE-NEG |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Validation request và role trước create |
| Mục tiêu | Validation request và role trước create |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [RESERVATION-CTRL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/controller/ReservationController.java:13); [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Đổi một field: thiếu DTO fields, duration0/37, startDate khác rentalStartAt.date, ngày/hẹn quá khứ; wrong role với DTO hợp lệ. |
| Expected HTTP status / response | [FACT-SOURCE] 400 invalid/binding;403 wrong role;404 missing facility;409 capacity. |
| Expected database state | Không commit Reservation/Invoice/Audit từ request thất bại. |
| Cách xác minh dữ liệu | Dùng one-failure-at-a-time; unknown extra JSON/fractional coercion ghi TBD thay vì tự giả400. |
| Expected authentication / authorization | Role Customer với negative input; Staff riêng khi kiểm403. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-OWNERSHIP — Ownership và khác biệt list/get scope

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-OWNERSHIP |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Ownership và khác biệt list/get scope |
| Mục tiêu | Ownership và khác biệt list/get scope |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [RESERVATION-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36); [ACTOR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java:20) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Customer B GET reservation A; Staff B get A; Ops/Admin thử list và single với fixture đủ quyền source. |
| Expected HTTP status / response | [FACT-SOURCE] Khác owner/branch get404; list Customer/Staff/Manager200 scoped; Ops/Admin list403 nhưng single visible global có thể200. |
| Expected database state | Không W. |
| Cách xác minh dữ liệu | Kiểm từng endpoint theo caller require/visible, không gán chung một role matrix cho mọi API. |
| Expected authentication / authorization | JWT thật hoặc unit caller fixture được duyệt; scope source cụ thể. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-PAID — Deposit success và server-authoritative amount

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAID |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Deposit success và server-authoritative amount |
| Mục tiêu | Deposit success và server-authoritative amount |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/payments/simulate invoice DEPOSIT pending, valid method; thêm client amount giả trong Map. |
| Expected HTTP status / response | [FACT-SOURCE] 200 Payment PAID, amount lấy Invoice. |
| Expected database state | Payment attempt 1, Invoice PAID, Reservation RESERVED, PAYMENT_PAID audit. |
| Cách xác minh dữ liệu | Assert amount/key/owner/links, không xem mock như chuyển tiền thật. |
| Expected authentication / authorization | Customer owner; Staff đúng branch chỉ cash. |
| Expected transaction / audit / side effect | @Transactional payment/invoice/reservation/audit. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-PAY-FAIL — Failure mock không phải HTTP failure

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAY-FAIL |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Failure mock không phải HTTP failure |
| Mục tiêu | Failure mock không phải HTTP failure |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST simulate với simulateFailure Boolean true; request fixture đang hợp lệ. |
| Expected HTTP status / response | [FACT-SOURCE] 200 Payment FAILED. |
| Expected database state | Lưu FAILED attempt; Invoice còn PENDING, Reservation PENDING_PAYMENT; PAYMENT_FAILED audit (audit.status hiện SUCCESS). |
| Cách xác minh dữ liệu | So count/status/amount; không giả402 hoặc Invoice PAID. |
| Expected authentication / authorization | Authorized Customer/Staff theo method. |
| Expected transaction / audit / side effect | Tx commit attempt lỗi mô phỏng, khác exception rollback. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-PAY-KEY — Idempotent replay và attempt mới

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAY-KEY |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Idempotent replay và attempt mới |
| Mục tiêu | Idempotent replay và attempt mới |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50); [UI-RETRY](D:/SWP/storage-rental/frontend/src/shared/api/idempotent-request.ts:6) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Gửi cùng key+invoice; replay khác invoice; sau FAILED cùng key rồi key mới; paid invoice với key khác. |
| Expected HTTP status / response | [FACT-SOURCE] Cùng key/invoice →200 attempt cũ; khác invoice409; paid khác key409; failed key mới có thể200 nếu các gate còn hợp lệ. |
| Expected database state | Không thêm Payment cho replay; attempt mới chỉ theo state hiện tại. |
| Cách xác minh dữ liệu | Assert ID/count; payload mismatch ngoài invoice chưa có fingerprint đầy đủ nên target TBD, không tự siết. |
| Expected authentication / authorization | Cả invoice trong scope actor khi test key mismatch. |
| Expected transaction / audit / side effect | Key optional hiện tại; không suy unique DB live tồn tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-EXPIRY — Giữ giá và mốc đủ24h chờ cọc

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-EXPIRY |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Giữ giá và mốc đủ24h chờ cọc |
| Mục tiêu | Giữ giá và mốc đủ24h chờ cọc |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52); [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50); [EXPIRY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/job/ReservationMonitoringJob.java:33) |
| Precondition | G3 harness kiểm soát Clock và scheduler; setup thay bảng giá không mở rộng thành test Flow4. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Fixture T0, thay giá trong setup test được duyệt; pay trước deadline/đúng deadline; job monitor riêng có kiểm soát. |
| Expected HTTP status / response | [FACT-SOURCE] Trước24h và hợp lệ200 theo invoice snapshot; đúng24h409; monitor không có HTTP. |
| Expected database state | Snapshot/invoice cũ không tính lại; job chuyển expired unpaid + pending invoices CANCELLED. |
| Cách xác minh dữ liệu | Clock boundary và job isolated; InvoiceService/Audit now() khác Clock nên không assert mọi timestamp bằng nhau. |
| Expected authentication / authorization | Customer owner; job không actor HTTP. |
| Expected transaction / audit / side effect | Job @Transactional, không audit.record hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G1-F1-CANCEL — Hủy chỉ giải phóng đúng hold

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CANCEL |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Hủy chỉ giải phóng đúng hold |
| Mục tiêu | Hủy chỉ giải phóng đúng hold |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [CANCEL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CancelReservationWorkflow.java:40) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST reservation/{id}/cancel reason; pending/reserved hợp lệ, Unit heldBy match hoặc different. |
| Expected HTTP status / response | [FACT-SOURCE] 200 CANCELLED; missing reason400; wrong scope404; bad status409. |
| Expected database state | cancelled_at set; chỉ Unit reserved+matching hold được available; không tự refund/đổi Invoice trong cancel method. |
| Cách xác minh dữ liệu | Assert Unit không bị release nhầm; không tự gán refund đã completed. |
| Expected authentication / authorization | Customer owner hoặc Staff/Manager đúng branch. |
| Expected transaction / audit / side effect | @Transactional cancel + Unit + audit. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F1-POLICY-TBD — Chốt late cancel và hiển thị/calendar availability

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-POLICY-TBD |
| Giai đoạn | G1 |
| Flow | Flow 1 |
| Step | Chốt late cancel và hiển thị/calendar availability |
| Mục tiêu | Chốt late cancel và hiển thị/calendar availability |
| Nhãn bằng chứng và nguồn | [UNKNOWN] B-CANCEL/B-CAPACITY; [FACT-SOURCE] [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Review catalog/hold vs calendar và hủy qua giờ hẹn khi chưa check-in. |
| Expected HTTP status / response | TBD — owner xác nhận target; current source behavior đã ghi trong trace. |
| Expected database state | Không thay schema/state để đáp ứng giả định. |
| Cách xác minh dữ liệu | Đối chiếu SRS + decision mới; chưa tạo acceptance test tự đoán. |
| Expected authentication / authorization | Không thực hiện API trong Phase A/B. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G1-F2-ASSIGN — Manager gán đúng Unit sau cọc

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-ASSIGN |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Manager gán đúng Unit sau cọc |
| Mục tiêu | Manager gán đúng Unit sau cọc |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [ASSIGN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/AssignUnitWorkflow.java:48); [TASKS-SYSTEM](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:85) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | PATCH /api/reservations/{id}/assign-unit {unitCode}. |
| Expected HTTP status / response | [FACT-SOURCE] 200 khi RESERVED/unassigned/deposit PAID/type+branch+available đúng;409 invalid state/type,403 branch,404 missing,400 field. |
| Expected database state | Reservation.unit_code; Unit reserved/held_by/tenant; CHECKIN DailyTask + ASSIGN_UNIT audit. |
| Cách xác minh dữ liệu | Assert links, matching hold và assigned task; không tự tạo Contract hoặc mark rent PAID. |
| Expected authentication / authorization | FMANAGER đúng branch. |
| Expected transaction / audit / side effect | @Transactional; khóa Facility→Reservation→Unit. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-DAILY — Task scope hiện tại và gap today

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-DAILY |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Task scope hiện tại và gap today |
| Mục tiêu | Task scope hiện tại và gap today |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [TASKS](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:35); [FACT-DOC] FR-013 |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | GET /api/tasks/daily với task hôm qua/hôm nay/tương lai cùng Staff. |
| Expected HTTP status / response | [FACT-SOURCE] 200 scoped nhưng method không lọc ngày; target today-only policy TBD. |
| Expected database state | Không W; không tự complete task khi handover. |
| Cách xác minh dữ liệu | So tất cả task assigned/branch theo source; SRS conformance ghi gap, không gọi PASS daily chỉ vì endpoint trả list. |
| Expected authentication / authorization | STAFF assigned / Manager branch. |
| Expected transaction / audit / side effect | Task due_date tạo theo ngày assignment, không tự đổi theo appointment. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-ARRIVED — Arrival chặn NO_SHOW nhầm

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-ARRIVED |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Arrival chặn NO_SHOW nhầm |
| Mục tiêu | Arrival chặn NO_SHOW nhầm |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [ARRIVAL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/NoShowWorkflow.java:53); [NOSHOW](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/NoShowRules.java:32) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/reservations/{id}/arrived khi RESERVED, sau đó đánh giá NoShowRules trong harness. |
| Expected HTTP status / response | [FACT-SOURCE] 200; wrong role/branch403; bad state409. |
| Expected database state | arrived_at set + CUSTOMER_ARRIVED audit, Reservation vẫn RESERVED. |
| Cách xác minh dữ liệu | Assert eligibility false với arrived_at; không tự tạo contract/check-in bằng arrival. |
| Expected authentication / authorization | STAFF own branch. |
| Expected transaction / audit / side effect | @Transactional arrival/audit. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-RENT — Thu kỳ đầu sau gán Unit

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-RENT |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Thu kỳ đầu sau gán Unit |
| Mục tiêu | Thu kỳ đầu sau gán Unit |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST simulate invoice RENT: trước gán và sau gán, paid deposit/reservation RESERVED. |
| Expected HTTP status / response | [FACT-SOURCE] Trước gán409; sau gán200 PAID hoặc FAILED; Staff noncash400. |
| Expected database state | Rent invoice/Payment/Audit cập nhật theo success; Reservation chưa CHECKED_IN. |
| Cách xác minh dữ liệu | Assert invoice type/link và không Contract trước handover. |
| Expected authentication / authorization | Customer owner hoặc Staff own branch/cash. |
| Expected transaction / audit / side effect | @Transactional, không dùng amount client. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-HANDOVER — Handover đủ cọc/rent/signature/hold

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-HANDOVER |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Handover đủ cọc/rent/signature/hold |
| Mục tiêu | Handover đủ cọc/rent/signature/hold |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | POST /api/contracts/handover {reservationId,customerSignatureConfirmed:true,unitConditionNotes}. |
| Expected HTTP status / response | [FACT-SOURCE] 200 Contract ACTIVE. |
| Expected database state | 1 Contract + HandoverRecord, Unit occupied + PIN mới, Reservation CHECKED_IN/arrived_at, COMPLETE_HANDOVER audit; không update task trong path. |
| Cách xác minh dữ liệu | Assert owner/branch/IDs/snapshot dates/PIN length và equality trong RAM, không log PIN. |
| Expected authentication / authorization | STAFF own branch. |
| Expected transaction / audit / side effect | Outer @Transactional, random PIN software simulation, không email/IoT/provider. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-HANDOVER-NEG — Reject thiếu payment/signature/notes hoặc sai hold

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-HANDOVER-NEG |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Reject thiếu payment/signature/notes hoặc sai hold |
| Mục tiêu | Reject thiếu payment/signature/notes hoặc sai hold |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Biến thể một lỗi: chưa rent PAID; signature false/missing; notes blank; Unit hold khác; wrong Staff branch; duplicate. |
| Expected HTTP status / response | [FACT-SOURCE] Unpaid/hold/duplicate409, signature/notes400, branch403; tuân thứ tự guards theo trace. |
| Expected database state | Không commit Contract/Handover/Unit/Reservation/Audit một phần khi exception. |
| Cách xác minh dữ liệu | Notes blank nằm sau Contract save trong code: assert không persist orphan contract sau rollback trên PG. |
| Expected authentication / authorization | Staff own branch cho negative ngoài branch-case. |
| Expected transaction / audit / side effect | Rollback cần thực nghiệm PG, không kết luận đã chứng minh từ annotation. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-PIN-VIEW — Xem contracts và verify access simulation

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-PIN-VIEW |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Xem contracts và verify access simulation |
| Mục tiêu | Xem contracts và verify access simulation |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [CONTRACT-READ](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/ContractService.java:25); [PIN-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | GET /api/contracts; POST /api/contracts/verify-pin với PIN fixture đúng/sai/khác owner/hết hạn. |
| Expected HTTP status / response | [FACT-SOURCE] List200 scoped; verify200 authorized true/false; thiếu fields400; anonymous401. |
| Expected database state | Không W ở list/verify; không audit verification trong method. |
| Cách xác minh dữ liệu | So response IDs và boolean; không đưa PIN/CCCD/token thực vào report. |
| Expected authentication / authorization | Customer own; Staff/Manager branch; không assume403 cho wrong PIN. |
| Expected transaction / audit / side effect | Software simulation, không mở khóa IoT thật. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G1-F2-CONSENT-TBD — Chốt consent, early handover và task completion

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-CONSENT-TBD |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Chốt consent, early handover và task completion |
| Mục tiêu | Chốt consent, early handover và task completion |
| Nhãn bằng chứng và nguồn | [UNKNOWN] B-SIGNATURE/B-TASK-DATE; [FACT-SOURCE] [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Review source Staff flag / không time gate / không auto task complete. |
| Expected HTTP status / response | TBD — cần owner xác nhận target, không tự bổ sung customer endpoint. |
| Expected database state | Không mutation; current path được ghi riêng. |
| Cách xác minh dữ liệu | Không coi checkbox Staff là customer-authenticated signature đã chứng minh. |
| Expected authentication / authorization | Không chạy API. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

## G2 — chi tiết case

### G2-FIXTURE — Thiết kế fixtures tổng hợp không dữ liệu thật

| Trường | Nội dung |
|---|---|
| Test ID | G2-FIXTURE |
| Giai đoạn | G2 |
| Flow | Tất cả |
| Step | Thiết kế fixtures tổng hợp không dữ liệu thật |
| Mục tiêu | Thiết kế fixtures tổng hợp không dữ liệu thật |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] trace fields; [INFERENCE] fixture design. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review F-BASE/F-REG/F-BOOK/F-HAND manifest symbolic, chưa seed. |
| Expected HTTP status / response | N/A. |
| Expected database state | Chưa tạo bất kỳ row/file fixture nào. |
| Cách xác minh dữ liệu | Hai owner/branches, roles active/locked, policies/rates, dates và pending/paid/assigned states tách riêng; không real PII/secret. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

### G2-DUPLICATE — Kiểm duplicate keys chỉ khi shape/quyền đã xác minh

| Trường | Nội dung |
|---|---|
| Test ID | G2-DUPLICATE |
| Giai đoạn | G2 |
| Flow | Auth / Flow 1 / Flow 2 |
| Step | Kiểm duplicate keys chỉ khi shape/quyền đã xác minh |
| Mục tiêu | Kiểm duplicate keys chỉ khi shape/quyền đã xác minh |
| Nhãn bằng chứng và nguồn | [UNKNOWN] data; [FACT-DOC] REF unique username/email. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator cân nhắc Q04/Q05/Q08 từ artifact cũ sau scope data riêng; không tạo query mới. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không gộp/xóa/normalize rows. |
| Cách xác minh dữ liệu | Assertion dự kiến: không duplicate trái invariant đã chốt; Optional không tự là căn cứ thêm unique; 0 dưới RLS không đủ. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G2-ORPHAN — Kiểm links owner/facility/reservation/invoice/contract/handover/task

| Trường | Nội dung |
|---|---|
| Test ID | G2-ORPHAN |
| Giai đoạn | G2 |
| Flow | Flow 1 / Flow 2 |
| Step | Kiểm links owner/facility/reservation/invoice/contract/handover/task |
| Mục tiêu | Kiểm links owner/facility/reservation/invoice/contract/handover/task |
| Nhãn bằng chứng và nguồn | [UNKNOWN] data/live FK. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator cân nhắc Q06 nếu cả bảng/cột tồn tại và đã được cho phép dữ liệu. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không backfill từ tên/giá hiện tại hoặc tạo Invoice giả. |
| Cách xác minh dữ liệu | Count orphan/ambiguous links theo approved ID; prior REF FK không chứng minh FK live. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G2-COMPLETENESS — Timestamps/snapshot/hold/required fields ở active rows

| Trường | Nội dung |
|---|---|
| Test ID | G2-COMPLETENESS |
| Giai đoạn | G2 |
| Flow | Flow 1 / Flow 2 |
| Step | Timestamps/snapshot/hold/required fields ở active rows |
| Mục tiêu | Timestamps/snapshot/hold/required fields ở active rows |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] source dereference/gates; [UNKNOWN] rows. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Assertion dự kiến Q01/Q08 sau metadata; không đọc data trong task. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không gán0/false/now hoặc00:00 cho lịch sử. |
| Cách xác minh dữ liệu | Active Reservation có mốc/snapshot cần code, Contract end_at/owner phù hợp; thiếu thì BLOCKED cutover. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G2-ENUM-NUMERIC — State/length/numeric phù hợp code và dữ liệu không bị thu hẹp

| Trường | Nội dung |
|---|---|
| Test ID | G2-ENUM-NUMERIC |
| Giai đoạn | G2 |
| Flow | Flow 1 / Flow 2 |
| Step | State/length/numeric phù hợp code và dữ liệu không bị thu hẹp |
| Mục tiêu | State/length/numeric phù hợp code và dữ liệu không bị thu hẹp |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE + FACT-DOC] state review artifact; [UNKNOWN] live values. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator cân nhắc Q02/Q03/Q07, không đọc credential/PIN hoặc xuất row PII. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không truncate/round/relabel tự động. |
| Cách xác minh dữ liệu | State NO_SHOW và invoice CANCELLED, đúng lower-case Unit; max chars/numeric precision trước constraint; bounds phải dựa policy. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G2-ISOLATION — Định nghĩa isolation và cleanup từng case

| Trường | Nội dung |
|---|---|
| Test ID | G2-ISOLATION |
| Giai đoạn | G2 |
| Flow | Tất cả |
| Step | Định nghĩa isolation và cleanup từng case |
| Mục tiêu | Định nghĩa isolation và cleanup từng case |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] existing test inventory; [INFERENCE] harness design. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review namespace fixture/run ID, time, memory OTP/session, file evidence và job boundaries. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không cleanup DB hiện tại. |
| Cách xác minh dữ liệu | Không dựa thứ tự test hay @BeforeEach seed tạo DB sạch; audit IDs có thể có gap, không reset sequence. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | PLANNED |

## G3 — chi tiết case

### G3-TARGET — Gate xác nhận environment test khác production

| Trường | Nội dung |
|---|---|
| Test ID | G3-TARGET |
| Giai đoạn | G3 |
| Flow | Tất cả |
| Step | Gate xác nhận environment test khác production |
| Mục tiêu | Gate xác nhận environment test khác production |
| Nhãn bằng chứng và nguồn | [UNKNOWN] test env; [FACT-SOURCE] safe config inventory. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator xác nhận target/schema/role/profile/effective datasource/upload path cho ephemeral PG, không gửi DSN. |
| Expected HTTP status / response | N/A. |
| Expected database state | Chưa tạo DB hoặc đổi role/config. |
| Cách xác minh dữ liệu | Fail-closed nếu target mơ hồ, local config bất thường hoặc environment override chưa kiểm. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G3-PRIVILEGE — Tách quyền metadata G0 và quyền test ghi tương lai

| Trường | Nội dung |
|---|---|
| Test ID | G3-PRIVILEGE |
| Giai đoạn | G3 |
| Flow | Tất cả |
| Step | Tách quyền metadata G0 và quyền test ghi tương lai |
| Mục tiêu | Tách quyền metadata G0 và quyền test ghi tương lai |
| Nhãn bằng chứng và nguồn | [FACT-DOC] task limits; [UNKNOWN] privilege. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review roles/ACL/RLS và thao tác được phép trên môi trường thử nghiệm. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không GRANT/REVOKE hoặc thay RLS. |
| Cách xác minh dữ liệu | Read-only role G0 không tự có quyền seed/test; G4 write permission phải được phê duyệt riêng và nằm trong test env. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G3-JOBS-PROVIDER — Ngăn side effect ngoại vi khi test sau này

| Trường | Nội dung |
|---|---|
| Test ID | G3-JOBS-PROVIDER |
| Giai đoạn | G3 |
| Flow | Auth / Flow 1 / Flow 2 |
| Step | Ngăn side effect ngoại vi khi test sau này |
| Mục tiêu | Ngăn side effect ngoại vi khi test sau này |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] @EnableScheduling/OTP/mock/evidence; [UNKNOWN] effective harness. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review scheduling/seed, OTP console/email adapter, mock payment và PIN, upload storage. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không chạy process/provider/job hay tạo file. |
| Cách xác minh dữ liệu | Có isolation đã chứng minh cho scheduler/initializer/files/log; không tự giả định flag Spring bất kỳ tắt jobs. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G3-CLEANUP — Review backup/restore/cleanup không chạm production

| Trường | Nội dung |
|---|---|
| Test ID | G3-CLEANUP |
| Giai đoạn | G3 |
| Flow | Tất cả |
| Step | Review backup/restore/cleanup không chạm production |
| Mục tiêu | Review backup/restore/cleanup không chạm production |
| Nhãn bằng chứng và nguồn | [INFERENCE] planned operations; [UNKNOWN] approved environment. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Operator review restore rehearsal, fixture ownership và artifact rollback riêng. |
| Expected HTTP status / response | N/A. |
| Expected database state | Không backup/restore/reset/cleanup trong Phase A/B. |
| Cách xác minh dữ liệu | Chỉ môi trường test được dispose/restore sau phê duyệt; giữ evidence, không blanket data deletion/sequence repair. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G3-MIGRATION-ARTIFACT — Có migration test artifact đã được duyệt mà không bỏ guard draft

| Trường | Nội dung |
|---|---|
| Test ID | G3-MIGRATION-ARTIFACT |
| Giai đoạn | G3 |
| Flow | Tất cả |
| Step | Có migration test artifact đã được duyệt mà không bỏ guard draft |
| Mục tiêu | Có migration test artifact đã được duyệt mà không bỏ guard draft |
| Nhãn bằng chứng và nguồn | [FACT-DOC] candidate chưa phê duyệt; [UNKNOWN] release artifact. |
| Precondition | Chỉ kế hoạch; operator/harness và quyền quan sát cần được duyệt trước thực hiện; không kết nối trong Phase A/B. |
| Test data / fixture | Fixture symbolic/metadata được operator cung cấp đúng scope; chưa tạo dữ liệu. |
| Request / thao tác dự kiến | Review versioned migration + schema snapshot + rollback plan độc lập, chưa apply. |
| Expected HTTP status / response | N/A. |
| Expected database state | Các draft guard nguyên vẹn; không promote SQL bằng cách xóa guard. |
| Cách xác minh dữ liệu | G0–G3 review và phê duyệt thực thi riêng trước G4; nếu chưa có migration được duyệt thì BLOCKED. |
| Expected authentication / authorization | Operator role/scope phải được xác minh; không dùng credential tự tìm thấy. |
| Expected transaction / audit / side effect | Không thay đổi DB/source/privilege; không thực hiện side effect trong task hiện tại. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

## G4 — chi tiết case

### G4-SCHEMA — Rehearsal migration đã duyệt rồi validate

| Trường | Nội dung |
|---|---|
| Test ID | G4-SCHEMA |
| Giai đoạn | G4 |
| Flow | Tất cả |
| Step | Rehearsal migration đã duyệt rồi validate |
| Mục tiêu | Rehearsal migration đã duyệt rồi validate |
| Nhãn bằng chứng và nguồn | [INFERENCE] plan; [UNKNOWN] PG outcome. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Trong phase được duyệt sau: apply artifact test chính thức rồi Hibernate validate trên PG cô lập; không dùng draft guard bị sửa. |
| Expected HTTP status / response | TBD nếu validate fail; không gọi API khi context không lên. |
| Expected database state | Shape đúng không mất legacy columns; không có dữ liệu giả để bỏ lỗi. |
| Cách xác minh dữ liệu | Đối chiếu metadata before/after + startup validation; không suy G4 từ H2. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-AUTH-E2E — Registration OTP → login → protected API bằng JWT thật

| Trường | Nội dung |
|---|---|
| Test ID | G4-AUTH-E2E |
| Giai đoạn | G4 |
| Flow | Đăng ký / đăng nhập |
| Step | Registration OTP → login → protected API bằng JWT thật |
| Mục tiêu | Registration OTP → login → protected API bằng JWT thật |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-VERIFY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:353); [JWT-FILTER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java:30); [NOT-TESTED] |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Trên harness đã duyệt: send/verify synthetic user, login, dùng bearer token trả về vào POST/GET flow. |
| Expected HTTP status / response | [FACT-SOURCE] Positive200, bad input400, no/expired token401 theo nhánh; filter exception TBD. |
| Expected database state | User + history theo source; không dùng real customer; schema constraints đã xác minh. |
| Cách xác minh dữ liệu | Verify client/API response/DB subset; không .with(user()) thay real JWT; không log token. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-AUTH-RACE — Hai verify cạnh tranh và uniqueness thật

| Trường | Nội dung |
|---|---|
| Test ID | G4-AUTH-RACE |
| Giai đoạn | G4 |
| Flow | Đăng ký |
| Step | Hai verify cạnh tranh và uniqueness thật |
| Mục tiêu | Hai verify cạnh tranh và uniqueness thật |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [AUTH-SAVE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/service/AuthService.java:392); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10); [UNKNOWN] PG concurrency. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Hai pending synthetic signup tranh cùng normalized username/email theo harness được duyệt. |
| Expected HTTP status / response | [INFERENCE] Với unique đã xác minh: tối đa một success, duplicate409 tại DB handler; exact schedule cần đo. |
| Expected database state | Tối đa một User theo key nếu invariant/constraint được duyệt; history có semantics best-effort. |
| Cách xác minh dữ liệu | Count by synthetic keys; không dựa precheck; thiếu unique/visibility thì BLOCKED thay vì tự áp constraint. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-LOGOUT — Thu hồi server theo tiêu chí user giữ

| Trường | Nội dung |
|---|---|
| Test ID | G4-LOGOUT |
| Giai đoạn | G4 |
| Flow | Đăng xuất |
| Step | Thu hồi server theo tiêu chí user giữ |
| Mục tiêu | Thu hồi server theo tiêu chí user giữ |
| Nhãn bằng chứng và nguồn | [FACT-DOC] user decision + FR-003; [FACT-SOURCE] gap. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | TBD server logout protocol, replay current-session JWT sau logout, kiểm client route/storage. |
| Expected HTTP status / response | [FACT-DOC] Không chấp nhận lại phiên đã logout; exact status/DTO/route TBD. |
| Expected database state | Session/revocation mechanism TBD; không tự tạo schema token. |
| Cách xác minh dữ liệu | Phải test cả client + server; hiện chưa có implementation nên BLOCKED, không client-only PASS. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F1-E2E — Browse → quote/create → failed deposit → retry success → pass/history

| Trường | Nội dung |
|---|---|
| Test ID | G4-F1-E2E |
| Giai đoạn | G4 |
| Flow | Flow 1 |
| Step | Browse → quote/create → failed deposit → retry success → pass/history |
| Mục tiêu | Browse → quote/create → failed deposit → retry success → pass/history |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] trace F1; [NOT-TESTED] |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Real HTTP bằng Customer JWT; catalog/create → invoices → simulate FAILED rồi new attempt PAID → list/get/history. |
| Expected HTTP status / response | [FACT-SOURCE] Các bước hợp lệ200; FAILED attempt vẫn200; owner khác404, missing auth401. |
| Expected database state | Reservation RESERVED; Invoice DEPOSIT PAID/RENT PENDING; attempts FAILED+PAID đúng amount/link; audit đủ source calls. |
| Cách xác minh dữ liệu | Before/after DB + API IDs/amount/status/price snapshot; không giữ token/PIN/data thật trong report. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F1-CAPACITY-RACE — Không overbook type cuối khi create đồng thời

| Trường | Nội dung |
|---|---|
| Test ID | G4-F1-CAPACITY-RACE |
| Giai đoạn | G4 |
| Flow | Flow 1 |
| Step | Không overbook type cuối khi create đồng thời |
| Mục tiêu | Không overbook type cuối khi create đồng thời |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [CREATE](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:52); [UNKNOWN] runtime locking. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Fixture chỉ còn capacity một; hai Customer tạo cùng facility/type đồng thời. |
| Expected HTTP status / response | [INFERENCE] Một200, một409 nếu PostgreSQL pessimistic locks/transaction như ý định; phải đo. |
| Expected database state | Chỉ một hold thành công và hai Invoice cho hold đó; không orphan/audit success giả. |
| Cách xác minh dữ liệu | Observe counts/capacity/locks/timeouts với PG, không thêm unique để đoán giải pháp. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F1-REPLAY — Payment concurrent replay và payload/key scope

| Trường | Nội dung |
|---|---|
| Test ID | G4-F1-REPLAY |
| Giai đoạn | G4 |
| Flow | Flow 1 |
| Step | Payment concurrent replay và payload/key scope |
| Mục tiêu | Payment concurrent replay và payload/key scope |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [PAY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:50); [UNKNOWN] live unique/PG race. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Cùng key/invoice đồng thời, key khác paid invoice, key trùng trên hai invoice đều visible. |
| Expected HTTP status / response | [FACT-SOURCE] Logical same-key replay200/same Payment; paid/new-key409. [UNKNOWN] Cross-invoice race kết quả nếu unique live chưa chứng minh. |
| Expected database state | Không duplicate successful payment/Invoice state; key scope và constraint phải được duyệt. |
| Cách xác minh dữ liệu | Count/IDs/amount/rollback, nguồn key đúng operation; không gọi bank thật. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F1-EXPIRY-CANCEL — 24h, cancel và job phối hợp không release nhầm

| Trường | Nội dung |
|---|---|
| Test ID | G4-F1-EXPIRY-CANCEL |
| Giai đoạn | G4 |
| Flow | Flow 1 |
| Step | 24h, cancel và job phối hợp không release nhầm |
| Mục tiêu | 24h, cancel và job phối hợp không release nhầm |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [EXPIRY](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/job/ReservationMonitoringJob.java:33); [CANCEL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CancelReservationWorkflow.java:40) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Controlled clock; pay boundary, job expiry/cancel, holds matching/different. |
| Expected HTTP status / response | [FACT-SOURCE] At24h deposit409, cancel hợp lệ200, wrong state409; job không HTTP. |
| Expected database state | Expired unpaid + Invoice CANCELLED theo job; cancel chỉ đúng held Unit; không auto refund. |
| Cách xác minh dữ liệu | Assert states/ownership/source audit calls; late cancel policy cần chốt nếu acceptance case đó. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F2-E2E — Manager assign → Staff arrival → rent → handover → view/verify

| Trường | Nội dung |
|---|---|
| Test ID | G4-F2-E2E |
| Giai đoạn | G4 |
| Flow | Flow 2 |
| Step | Manager assign → Staff arrival → rent → handover → view/verify |
| Mục tiêu | Manager assign → Staff arrival → rent → handover → view/verify |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [ASSIGN](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/AssignUnitWorkflow.java:48); [ARRIVAL](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/NoShowWorkflow.java:53); [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | F1 RESERVED, ManagerA assign, StaffA arrived/cash RENT, handover flag true, Customer view/access simulation. |
| Expected HTTP status / response | [FACT-SOURCE] Positive200; PIN verify boolean true; user/branch trái phép theo trace. |
| Expected database state | Unit reserved→occupied; Reservation CHECKED_IN; Contract ACTIVE + HandoverRecord, audit, task đúng source links. |
| Cách xác minh dữ liệu | Assert all table links/amount snapshots/PIN equality and6digits chỉ RAM; task không auto complete theo source. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F2-SCOPE-NEG — Wrong branch/role, unpaid, signature/hold lỗi

| Trường | Nội dung |
|---|---|
| Test ID | G4-F2-SCOPE-NEG |
| Giai đoạn | G4 |
| Flow | Flow 2 |
| Step | Wrong branch/role, unpaid, signature/hold lỗi |
| Mục tiêu | Wrong branch/role, unpaid, signature/hold lỗi |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] trace F2 guards. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Cases độc lập dựa F-HAND; StaffB/ManagerB, RENT chưa PAID, flag false, Unit held by khác. |
| Expected HTTP status / response | [FACT-SOURCE] 403 scope/role,409 state/paid/hold,400 signature/notes,404 missing entity. |
| Expected database state | Không partial Contract/Handover/Unit/status/audit success. |
| Cách xác minh dữ liệu | Check business rows trước/sau bằng fixture IDs, RLS scope của verifier đầy đủ. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-F2-HANDOVER-RACE — Hai Staff cùng hoàn tất một Reservation

| Trường | Nội dung |
|---|---|
| Test ID | G4-F2-HANDOVER-RACE |
| Giai đoạn | G4 |
| Flow | Flow 2 |
| Step | Hai Staff cùng hoàn tất một Reservation |
| Mục tiêu | Hai Staff cùng hoàn tất một Reservation |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52); [UNKNOWN] PG runtime. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Hai handover concurrent cùng Reservation/held Unit, cả Invoice PAID. |
| Expected HTTP status / response | [INFERENCE] Một200, một409 khi serialization đúng; exact deadlock/timeout behavior cần đo. |
| Expected database state | Một Contract/Handover và Unit/Reservation state nhất quán; không2PIN cấp lặp. |
| Cách xác minh dữ liệu | Verify counts, locks và source branch, không tự đề xuất unique chỉ vì Optional. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-ROLLBACK — Chứng minh transaction bằng lỗi giữa flow

| Trường | Nội dung |
|---|---|
| Test ID | G4-ROLLBACK |
| Giai đoạn | G4 |
| Flow | Flow 1 / Flow 2 |
| Step | Chứng minh transaction bằng lỗi giữa flow |
| Mục tiêu | Chứng minh transaction bằng lỗi giữa flow |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] @Transactional + [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52); [INFERENCE] rollback target. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Handover notes blank sau Contract save; create/pay fault tại Invoice/Audit bằng test harness được duyệt (chưa chọn cơ chế). |
| Expected HTTP status / response | [FACT-SOURCE] Notes invalid400; [UNKNOWN] injected storage/DB fault exact status TBD. |
| Expected database state | Không commit partial business state cho outer transaction; auth/history best-effort được test riêng, không áp cùng expectation. |
| Cách xác minh dữ liệu | Compare committed rows sau request, kiểm audit consistency; không đổi privilege/trigger để fault trong Phase A/B. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-REGRESSION — Regression và rollback release rehearsal

| Trường | Nội dung |
|---|---|
| Test ID | G4-REGRESSION |
| Giai đoạn | G4 |
| Flow | Đăng ký / đăng nhập / đăng xuất / Flow 1 / Flow 2 |
| Step | Regression và rollback release rehearsal |
| Mục tiêu | Regression và rollback release rehearsal |
| Nhãn bằng chứng và nguồn | [FACT-DOC] test gate; [NOT-TESTED] chưa chạy. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Chạy suite đã được phê duyệt trên PG test, restore/revert artifact tương thích theo G3; không chạy từ task này. |
| Expected HTTP status / response | TBD runtime; mọi failed/blocked case giữ đúng trạng thái, không tổng hợp H2 thànhPASS. |
| Expected database state | Không mất legacy audit/payment/evidence hoặc thay nghĩa history để tests qua. |
| Cách xác minh dữ liệu | Evidence PostgreSQL + real JWT/API state, migration rollback và file retention; so các acceptance SRS kể cả logout server. |
| Expected authentication / authorization | JWT của actor đúng role/owner/facility theo testcase; role client không thay principal. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

## 7. Kế hoạch G4 không phải quyền chạy

[FACT-DOC] Sau review A/B vẫn dừng; Phase C phải có phê duyệt rõ. Trước G4 cần migration artifact riêng đã được duyệt, không bỏ guard trong candidate. Trình tự tương lai: clone/backup/restore rehearsal đã được phép → schema metadata/DDL được duyệt → validate → fixtures synthetic → auth/JWT → Flow1 → Flow2 → negatives/concurrency/rollback/regression → evidence đã làm sạch.

[UNKNOWN] Phương pháp fault injection, bật/tắt scheduler và seed, scope token revoke, consent, task daily/completion, late cancel/availability và temporal model còn cần quyết định. Không tự tạo test code/source patch để hoàn thành plan.

## 8. Kiểm tra tài liệu và bàn giao

[FACT-SOURCE] Đã kiểm tra mỗi case có Test ID, Gate, Flow/Step, mục tiêu, bằng chứng, precondition, fixture, request, expected HTTP/DB, verifier, auth, tx/audit/side effect, cleanup, priority và status. Chỉ có PLANNED/BLOCKED/NOT-TESTED; không có case PASS được tuyên bố.

[NOT-TESTED] Thao tác này là kiểm tra cấu trúc tài liệu trong bộ nhớ, không phải chạy test app/API/DB. Inventory test source ở existing-test-inventory.md; trace chi tiết ở flow-api-database-traceability.md; câu hỏi và các gap ở blockers-and-open-questions.md.

[FACT-DOC] FILES MODIFIED: NONE ngoài việc tạo bốn deliverable mới được phép. Các artifact G0 trước task này chỉ được đọc. Không connect SQL/API/test, không formatter/dependency/refactor/config/DDL/DML/migration/guard/commit/push/branch/PR. Dừng chờ review.

