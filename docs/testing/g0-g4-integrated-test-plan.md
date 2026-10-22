# Kế hoạch kiểm thử tích hợp G0–G4 — Phase A/B, chưa thực thi

> **Checkpoint implementation 2026-10-19:** phần FACT-SOURCE của Phase A/B dưới đây ghi snapshot trước đợt sửa auth, không là bằng chứng source/runtime hiện tại. Xem [delta implementation](D:/SWP/storage-rental/docs/testing/auth-implementation-status.md) và contract mới. Người dùng đã chốt tối đa72 byte UTF-8, giữ nguyên whitespace. Checkpoint mới:23unit backend +7unit frontend và TypeScript check đã đạt LOCAL; chưa chạy ứng dụng/API/Supabase, G0–G4 chưa đạt. Xem auth-local-verification.md.

[NOT-TESTED] Không có kiểm thử/API/SQL/migration/startup được chạy trong task. Đợt đầu tạo bốn tài liệu; đợt chuẩn hóa ngày 2026-10-19 chỉ cập nhật đúng bốn tài liệu hiện có trong docs/testing. Không có test code, fixture file, SQL file hay dependency mới.

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
| F-BASE | Customer A/B, Staff/Manager A/B, Ops/Admin; Facility A/B; Unit S/M/L/CLIMATE với status/type/price được kiểm soát, account statuses ACTIVE/LOCKED/DISABLED (không phải role) | [INFERENCE] G3 approved test target và fixture authority |
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

## 6. Ma trận tổng quan (114 case: 63 baseline + 51 bổ sung, đều chưa thực thi)

[NOT-TESTED] NOT-TESTED mô tả case chưa có bằng chứng thực thi, không đồng nghĩa được phép chạy. BLOCKED cần thông tin/thiết kế/approval; không biến TBD thành expected theo thông lệ. Mọi case dưới đây chưa thực thi.

| Test ID | Gate | Flow | Mục tiêu | Priority | Trạng thái |
|---|---|---|---|---|---|
| G0-ID | G0 | Tất cả | Xác định đúng DB/schema/role/version và scope quan sát | P0 | BLOCKED / NOT-TESTED |
| G0-MAPPING | G0 | Tất cả | Đối chiếu 16 entity / 216 field với catalog được phép | P0 | BLOCKED / NOT-TESTED |
| G0-TEMPORAL | G0 | Auth / Flow 1 / Flow 2 | Kiểm type/length/precision/nullable/default và timestamp semantics | P0 | BLOCKED / NOT-TESTED |
| G0-CONSTRAINT | G0 | Auth / Flow 1 / Flow 2 | Xác minh PK/unique/FK/CHECK/index/sequence thực có | P0 | BLOCKED / NOT-TESTED |
| G0-RLS | G0 | Tất cả | Ghi trigger/RLS/policy/privilege và giới hạn quyền | P0 | BLOCKED / NOT-TESTED |
| G0-AUDIT | G0 | Flow 1 / Flow 2 audit | Xác nhận ba cột audit từ current live snapshot | P0 | BLOCKED / NOT-TESTED |
| G0-EXTRA | G0 | Tất cả | Phân biệt bảng legacy/ngoài entity và metadata không thấy | P0 | BLOCKED / NOT-TESTED |
| G1-REG-VALID | G1 | Đăng ký | Yêu cầu OTP hợp lệ chưa tạo User | P0 | NOT-TESTED |
| G1-REG-INVALID | G1 | Đăng ký | Biên validation registration | P0 | NOT-TESTED |
| G1-REG-UNIQUENESS | G1 | Đăng ký | Precheck username/email đã có | P0 | NOT-TESTED |
| G1-REG-VERIFY | G1 | Đăng ký | Verify đúng tạo CUSTOMER và session | P0 | NOT-TESTED |
| G1-REG-OTP-NEG | G1 | Đăng ký | Reject OTP sai, missing, replay | P0 | NOT-TESTED |
| G1-REG-OTP-EXP | G1 | Đăng ký | Biên hết hạn OTP | P0 | BLOCKED / NOT-TESTED |
| G1-REG-RESEND | G1 | Đăng ký | Phân biệt resend hiện trạng với nghĩa business | P0 | NOT-TESTED |
| G1-LOGIN-VALID | G1 | Đăng nhập | Login username/email và chuẩn hóa DTO role | P0 | NOT-TESTED |
| G1-LOGIN-INVALID | G1 | Đăng nhập | Tách bad login 400 với protected API 401 | P0 | NOT-TESTED |
| G1-LOGIN-LOCKED | G1 | Đăng nhập | User LOCKED/DISABLED không nhận token | P0 | NOT-TESTED |
| G1-JWT-GUARD | G1 | Đăng nhập / bảo vệ flow | Bearer thiếu/hỏng/hết hạn và principal inactive | P0 | NOT-TESTED |
| G1-LOGOUT-CLIENT | G1 | Đăng xuất | Xóa session client đúng source | P0 | NOT-TESTED |
| G1-LOGOUT-SERVER | G1 | Đăng xuất | Acceptance server revoke theo SRS được user giữ | P0 | BLOCKED / NOT-TESTED |
| G1-F1-CATALOG | G1 | Flow 1 | Catalog public và dữ liệu không có PIN | P0 | NOT-TESTED |
| G1-F1-QUOTE | G1 | Flow 1 | Giá server và validation thời hạn/loại | P0 | NOT-TESTED |
| G1-F1-CREATE | G1 | Flow 1 | Tạo hold theo type, snapshot và hai invoice | P0 | NOT-TESTED |
| G1-F1-CREATE-NEG | G1 | Flow 1 | Validation request và role trước create | P0 | NOT-TESTED |
| G1-F1-OWNERSHIP | G1 | Flow 1 | Ownership và khác biệt list/get scope | P0 | NOT-TESTED |
| G1-F1-PAID | G1 | Flow 1 | Deposit success và server-authoritative amount | P0 | NOT-TESTED |
| G1-F1-PAY-FAIL | G1 | Flow 1 | Failure mock không phải HTTP failure | P0 | NOT-TESTED |
| G1-F1-PAY-KEY | G1 | Flow 1 | Idempotent replay và attempt mới | P0 | NOT-TESTED |
| G1-F1-EXPIRY | G1 | Flow 1 | Giữ giá và mốc đủ24h chờ cọc | P0 | BLOCKED / NOT-TESTED |
| G1-F1-CANCEL | G1 | Flow 1 | Hủy chỉ giải phóng đúng hold | P0 | NOT-TESTED |
| G1-F1-POLICY-TBD | G1 | Flow 1 | Chốt late cancel và hiển thị/calendar availability | P0 | BLOCKED / NOT-TESTED |
| G1-F2-ASSIGN | G1 | Flow 2 | Manager gán đúng Unit sau cọc | P0 | NOT-TESTED |
| G1-F2-DAILY | G1 | Flow 2 | Task scope hiện tại và gap today | P0 | NOT-TESTED |
| G1-F2-ARRIVED | G1 | Flow 2 | Arrival chặn NO_SHOW nhầm | P0 | NOT-TESTED |
| G1-F2-RENT | G1 | Flow 2 | Thu kỳ đầu sau gán Unit | P0 | NOT-TESTED |
| G1-F2-HANDOVER | G1 | Flow 2 | Handover đủ cọc/rent/signature/hold | P0 | NOT-TESTED |
| G1-F2-HANDOVER-NEG | G1 | Flow 2 | Reject thiếu payment/signature/notes hoặc sai hold | P0 | NOT-TESTED |
| G1-F2-PIN-VIEW | G1 | Flow 2 | Xem contracts và verify access simulation | P0 | NOT-TESTED |
| G1-F2-CONSENT-TBD | G1 | Flow 2 | Chốt consent, early handover và task completion | P0 | BLOCKED / NOT-TESTED |
| G2-FIXTURE | G2 | Tất cả | Thiết kế fixtures tổng hợp không dữ liệu thật | P0 | NOT-TESTED |
| G2-DUPLICATE | G2 | Auth / Flow 1 / Flow 2 | Kiểm duplicate keys chỉ khi shape/quyền đã xác minh | P0 | BLOCKED / NOT-TESTED |
| G2-ORPHAN | G2 | Flow 1 / Flow 2 | Kiểm links owner/facility/reservation/invoice/contract/handover/task | P0 | BLOCKED / NOT-TESTED |
| G2-COMPLETENESS | G2 | Flow 1 / Flow 2 | Timestamps/snapshot/hold/required fields ở active rows | P0 | BLOCKED / NOT-TESTED |
| G2-ENUM-NUMERIC | G2 | Flow 1 / Flow 2 | State/length/numeric phù hợp code và dữ liệu không bị thu hẹp | P0 | BLOCKED / NOT-TESTED |
| G2-ISOLATION | G2 | Tất cả | Định nghĩa isolation và cleanup từng case | P0 | NOT-TESTED |
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

| SRS-REG-PHONE | G1/G4 | Đăng ký | Từ chối đăng ký trùng số điện thoại | P0 | NOT-TESTED |
| SRS-REG-NAV | G1/G4 | Đăng ký | Điều hướng về đăng nhập sau đăng ký | P0 | NOT-TESTED |
| SRS-LOGIN-NAV | G1/G4 | Đăng nhập | Điều hướng theo role và chặn URL trái quyền | P0 | NOT-TESTED |
| SRS-LOGIN-ACTIVE | G1/G4 | Đăng nhập | Chỉ tài khoản ACTIVE được cấp phiên đăng nhập | P0 | NOT-TESTED |
| SRS-JWT-24H | G1/G4 | Đăng nhập / JWT | JWT có thời hạn 24 giờ theo BR-001 | P0 | BLOCKED |
| SRS-RES-OPS | G1/G4 | Flow 1 / Reservation scope | Quyền Ops xem Reservation toàn chuỗi | P0 | NOT-TESTED |
| SRS-RES-ADMIN | G1/G4 | Reservation / Admin | Phân biệt quyền Admin xem tổng hợp và chi tiết | P0 | BLOCKED |
| SRS-RES-ISOLATION | G1/G4 | Flow 1/2 / branch | Cách ly Reservation theo owner và chi nhánh | P0 | NOT-TESTED |
| SRS-TASK-TODAY | G1/G4 | Flow 2 / Daily Tasks | Daily Tasks đúng ngày nghiệp vụ | P0 | NOT-TESTED |
| SRS-TASK-ASSIGNEE | G1/G4 | Flow 2 / phân công | Nhiệm vụ xuất hiện cho đúng Staff được phân công | P0 | NOT-TESTED |
| SRS-LOOKUP-ID | G1/G4 | Flow 2 / lookup | Tra cứu Reservation hợp lệ bằng mã đơn | P0 | NOT-TESTED |
| SRS-LOOKUP-CCCD | G1/G4 | Flow 2 / lookup | Tra cứu Reservation hợp lệ bằng CCCD | P0 | NOT-TESTED |
| SRS-LOOKUP-PHONE | G1/G4 | Flow 2 / lookup | Tra cứu Reservation hợp lệ bằng số điện thoại | P0 | NOT-TESTED |
| SRS-CATALOG-FILTERS | G1/G4 | Flow 1 / catalog | Lọc kết hợp vị trí diện tích giá và khả dụng | P0 | NOT-TESTED |
| SRS-LOGOUT-TARGET | G1/G4 | Đăng xuất | Đăng xuất thu hồi server và chuyển về login | P0 | BLOCKED |
| OTP-RACE-01 | G4 | Đăng ký / race verify | Race verify cùng pending và pending bị ghi đè | P0 | BLOCKED |
| BILL-TYPE-01 | G1/G4 | Flow 2 / Billing | Xác minh đề xuất FIRST_MONTH_RENT ↔ RENT | P1 | BLOCKED |
| BILL-STATUS-01 | G1/G4 | Flow 1/2 / Billing | Đối chiếu riêng vòng đời Invoice và Payment | P1 | BLOCKED |
| BILL-ATTEMPT-01 | G1/G4 | Flow 1/2 / payment retry | Assert dữ liệu từng attempt và trạng thái hóa đơn | P1 | NOT-TESTED |
| AUTH-PWD-01 | G1/G4 | Đăng ký → OTP → đăng nhập | P0 đúng chuỗi | P0 | NOT-TESTED |
| AUTH-PWD-02 | G1/G4 | Đăng ký → OTP → đăng nhập | Đăng ký password có khoảng trắng đầu/cuối | P0 | NOT-TESTED |
| AUTH-PWD-03 | G1/G4 | Đăng ký → OTP → đăng nhập | Login chuỗi gốc sau AUTH-PWD-02 | P0 | NOT-TESTED |
| AUTH-PWD-04 | G1/G4 | Đăng ký → OTP → đăng nhập | Login bản trim phải bị từ chối | P0 | NOT-TESTED |
| AUTH-PWD-05 | G1/G4 | Đăng ký → OTP → đăng nhập | Confirm khác khoảng trắng | P0 | NOT-TESTED |
| AUTH-PWD-06 | G1/G4 | Đăng ký → OTP → đăng nhập | Mật khẩu chỉ whitespace | P0 | NOT-TESTED |
| AUTH-PWD-07 | G1/G4 | Đăng ký → OTP → đăng nhập | Giới hạn byte UTF-8 | P0 | NOT-TESTED |
| AUTH-PWD-08 | G1/G4 | Đăng ký → OTP → đăng nhập | Khoảng trắng ở giữa | P0 | NOT-TESTED |
| AUTH-PWD-09 | G1/G4 | Đăng ký → OTP → đăng nhập | JSON client giữ whitespace | P0 | NOT-TESTED |
| AUTH-PWD-10 | G4 | Đăng ký → OTP → đăng nhập | Browser đăng ký→OTP→login cùng identity | P0 | NOT-TESTED |
| SIG-01 | G1/G4 | Flow 2 / bằng chứng khách xác nhận | Từ chối bàn giao thiếu bằng chứng khách xác nhận | P0 | NOT-TESTED; BLOCKED — evidence design required |
| SIG-02 | G1/G4 | Flow 2 / bằng chứng khách xác nhận | Cho bàn giao khi bằng chứng hợp lệ và đủ guard | P0 | NOT-TESTED; BLOCKED — evidence design required |
| SIG-03 | G1/G4 | Flow 2 / bằng chứng khách xác nhận | Từ chối bằng chứng sai khách hoặc giao dịch | P0 | NOT-TESTED; BLOCKED — evidence design required |
| SIG-04 | G1/G4 | Flow 2 / bằng chứng khách xác nhận | Không mặc định Staff flag là bằng chứng khách | P0 | NOT-TESTED; BLOCKED — evidence design required |
| PIN-OPEN-01 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN ACTIVE, now < endAt | P0 | NOT-TESTED |
| PIN-CHANGE-01 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN ACTIVE, now < endAt | P0 | NOT-TESTED |
| PIN-OPEN-02 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN ACTIVE, now == endAt | P0 | NOT-TESTED |
| PIN-CHANGE-02 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN ACTIVE, now == endAt | P0 | NOT-TESTED |
| PIN-OPEN-03 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN ACTIVE, now > endAt | P0 | NOT-TESTED |
| PIN-CHANGE-03 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN ACTIVE, now > endAt | P0 | NOT-TESTED; BLOCKED — stale ACTIVE change-PIN semantics |
| PIN-OPEN-04 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN EXPIRING_SOON, now < endAt | P0 | NOT-TESTED |
| PIN-CHANGE-04 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN EXPIRING_SOON, now < endAt | P0 | NOT-TESTED |
| PIN-OPEN-05 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN EXPIRING_SOON, now == endAt | P0 | NOT-TESTED |
| PIN-CHANGE-05 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN EXPIRING_SOON, now == endAt | P0 | NOT-TESTED |
| PIN-OPEN-06 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN EXPIRING_SOON, now > endAt | P0 | NOT-TESTED |
| PIN-CHANGE-06 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN EXPIRING_SOON, now > endAt | P0 | NOT-TESTED |
| PIN-OPEN-07 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN OVERDUE, bất kỳ thời điểm | P0 | NOT-TESTED |
| PIN-CHANGE-07 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN OVERDUE, bất kỳ thời điểm | P0 | NOT-TESTED |
| PIN-OPEN-08 | G1/G4 | Flow 2 / PIN sau handover | Mở PIN TERMINATED, bất kỳ thời điểm | P0 | NOT-TESTED |
| PIN-CHANGE-08 | G1/G4 | Flow 2 / PIN sau handover | Đổi PIN TERMINATED, bất kỳ thời điểm | P0 | NOT-TESTED |
| PIN-CHANGE-09 | G1/G4 | PIN / ownership | Quyền đổi PIN chỉ thuộc Customer sở hữu | P0 | NOT-TESTED |
| PIN-ATOMIC-01 | G4 | PIN / transaction | Đổi PIN nguyên tử giữa Contract Unit và Audit | P0 | NOT-TESTED; BLOCKED — harness approval required |

## G0 — chi tiết case

### G0-ID — Xác định đúng DB/schema/role/version và scope quan sát

| Trường | Nội dung |
|---|---|
| Test ID | G0-ID |
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-008; FR-006/NFR-010 khi có audit; task G0 (không phải mã FR mới) |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Yêu cầu OTP hợp lệ chưa tạo User |
| Mục tiêu | Yêu cầu OTP hợp lệ chưa tạo User |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VALIDATE (snapshot AuthService.java:198; xem delta implementation); AUTH-OTP (snapshot AuthService.java:322; xem delta implementation) |
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
| Trạng thái | NOT-TESTED |

### G1-REG-INVALID — Biên validation registration

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-INVALID |
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Biên validation registration |
| Mục tiêu | Biên validation registration |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VALIDATE (snapshot AuthService.java:198; xem delta implementation) |
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
| Trạng thái | NOT-TESTED |

### G1-REG-UNIQUENESS — Precheck username/email đã có

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-UNIQUENESS |
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-REG-PHONE bổ sung phone; username/email precheck400 không đại diện mọi uniqueness case. |
| Gap tài liệu / source / câu hỏi | SRS-REG-PHONE bổ sung phone; username/email precheck400 không đại diện mọi uniqueness case. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Precheck username/email đã có |
| Mục tiêu | Precheck username/email đã có |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VALIDATE (snapshot AuthService.java:198; xem delta implementation); [USER-REPO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/repository/UserRepository.java:9) |
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
| Trạng thái | NOT-TESTED |

### G1-REG-VERIFY — Verify đúng tạo CUSTOMER và session

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-VERIFY |
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-REG-NAV và AUTH-PWD kiểm acceptance; auto-session/navigate / là baseline trái điều hướng FR-001. |
| Gap tài liệu / source / câu hỏi | SRS-REG-NAV và AUTH-PWD kiểm acceptance; auto-session/navigate / là baseline trái điều hướng FR-001. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Verify đúng tạo CUSTOMER và session |
| Mục tiêu | Verify đúng tạo CUSTOMER và session |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation); AUTH-SAVE (snapshot AuthService.java:392; xem delta implementation); [USER-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java:21) |
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
| Trạng thái | NOT-TESTED |

### G1-REG-OTP-NEG — Reject OTP sai, missing, replay

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-OTP-NEG |
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Reject OTP sai, missing, replay |
| Mục tiêu | Reject OTP sai, missing, replay |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation) |
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
| Trạng thái | NOT-TESTED |

### G1-REG-OTP-EXP — Biên hết hạn OTP

| Trường | Nội dung |
|---|---|
| Test ID | G1-REG-OTP-EXP |
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Biên hết hạn OTP |
| Mục tiêu | Biên hết hạn OTP |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation) |
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
| Yêu cầu SRS / quyết định | FR-001; NFR-004/NFR-006 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng ký |
| Step | Phân biệt resend hiện trạng với nghĩa business |
| Mục tiêu | Phân biệt resend hiện trạng với nghĩa business |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-RESEND (snapshot AuthService.java:432; xem delta implementation); [UNKNOWN] B-OTP |
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
| Trạng thái | NOT-TESTED |

### G1-LOGIN-VALID — Login username/email và chuẩn hóa DTO role

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-VALID |
| Yêu cầu SRS / quyết định | FR-002; BR-001; AC-01; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-LOGIN-NAV/ACTIVE/JWT-24H kiểm acceptance, không coi navigate / là đạt AC-01. |
| Gap tài liệu / source / câu hỏi | SRS-LOGIN-NAV/ACTIVE/JWT-24H kiểm acceptance, không coi navigate / là đạt AC-01. |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | Login username/email và chuẩn hóa DTO role |
| Mục tiêu | Login username/email và chuẩn hóa DTO role |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-LOGIN (snapshot AuthService.java:113; xem delta implementation); [USER-DTO](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/identity/dto/UserDto.java:21) |
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
| Trạng thái | NOT-TESTED |

### G1-LOGIN-INVALID — Tách bad login 400 với protected API 401

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-INVALID |
| Yêu cầu SRS / quyết định | FR-002; BR-001; AC-01; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | Tách bad login 400 với protected API 401 |
| Mục tiêu | Tách bad login 400 với protected API 401 |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-LOGIN (snapshot AuthService.java:113; xem delta implementation); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10) |
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
| Trạng thái | NOT-TESTED |

### G1-LOGIN-LOCKED — User LOCKED/DISABLED không nhận token

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGIN-LOCKED |
| Yêu cầu SRS / quyết định | FR-002; BR-001; AC-01; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-LOGIN-ACTIVE bao gồm status khác/NULL; BR-001 đã rõ chỉ ACTIVE. |
| Gap tài liệu / source / câu hỏi | SRS-LOGIN-ACTIVE bao gồm status khác/NULL; BR-001 đã rõ chỉ ACTIVE. |
| Giai đoạn | G1 |
| Flow | Đăng nhập |
| Step | User LOCKED/DISABLED không nhận token |
| Mục tiêu | User LOCKED/DISABLED không nhận token |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-LOGIN (snapshot AuthService.java:113; xem delta implementation) |
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
| Trạng thái | NOT-TESTED |

### G1-JWT-GUARD — Bearer thiếu/hỏng/hết hạn và principal inactive

| Trường | Nội dung |
|---|---|
| Test ID | G1-JWT-GUARD |
| Yêu cầu SRS / quyết định | FR-002; BR-001; AC-01; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-LOGOUT-CLIENT — Xóa session client đúng source

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGOUT-CLIENT |
| Yêu cầu SRS / quyết định | FR-003; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Baseline clear storage không thay FR-003; SRS-LOGOUT-TARGET kiểm server+redirect. |
| Gap tài liệu / source / câu hỏi | Baseline clear storage không thay FR-003; SRS-LOGOUT-TARGET kiểm server+redirect. |
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
| Trạng thái | NOT-TESTED |

### G1-LOGOUT-SERVER — Acceptance server revoke theo SRS được user giữ

| Trường | Nội dung |
|---|---|
| Test ID | G1-LOGOUT-SERVER |
| Yêu cầu SRS / quyết định | FR-003; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-LOGOUT-TARGET giữ FR-003; endpoint/scope/harness còn BLOCKED. |
| Gap tài liệu / source / câu hỏi | SRS-LOGOUT-TARGET giữ FR-003; endpoint/scope/harness còn BLOCKED. |
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
| Yêu cầu SRS / quyết định | FR-007/FR-008; BR-003; AC-02 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-CATALOG-FILTERS bổ sung structured facets/ranges theo FR-008, không chỉ substring. |
| Gap tài liệu / source / câu hỏi | SRS-CATALOG-FILTERS bổ sung structured facets/ranges theo FR-008, không chỉ substring. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-QUOTE — Giá server và validation thời hạn/loại

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-QUOTE |
| Yêu cầu SRS / quyết định | FR-009/FR-010; AC-03 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-CREATE — Tạo hold theo type, snapshot và hai invoice

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CREATE |
| Yêu cầu SRS / quyết định | FR-007–FR-012; BR-003/BR-004; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-CREATE-NEG — Validation request và role trước create

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-CREATE-NEG |
| Yêu cầu SRS / quyết định | FR-007–FR-012; BR-003/BR-004; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-OWNERSHIP — Ownership và khác biệt list/get scope

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-OWNERSHIP |
| Yêu cầu SRS / quyết định | BR-002; NFR-005; AC-11 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-RES-OPS/ADMIN/ISOLATION tách acceptance; Admin raw/aggregate còn BLOCKED. |
| Gap tài liệu / source / câu hỏi | SRS-RES-OPS/ADMIN/ISOLATION tách acceptance; Admin raw/aggregate còn BLOCKED. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-PAID — Deposit success và server-authoritative amount

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAID |
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-010; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-PAY-FAIL — Failure mock không phải HTTP failure

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAY-FAIL |
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-010; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-PAY-KEY — Idempotent replay và attempt mới

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-PAY-KEY |
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-010; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-EXPIRY — Giữ giá và mốc đủ24h chờ cọc

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-EXPIRY |
| Yêu cầu SRS / quyết định | BR-004; FR-010 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-012; BR-004; quyết định hủy/cọc đã chốt; phần cutoff còn TBD |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F1-POLICY-TBD — Chốt late cancel và hiển thị/calendar availability

| Trường | Nội dung |
|---|---|
| Test ID | G1-F1-POLICY-TBD |
| Yêu cầu SRS / quyết định | FR-007–FR-012; BR-003/BR-004; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-029/FR-030; AC-04/AC-05; BR-002 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-DAILY — Task scope hiện tại và gap today

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-DAILY |
| Yêu cầu SRS / quyết định | FR-013; FR-030; AC-05 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-TASK-TODAY/ASSIGNEE; today-only/đúng người đã rõ; timezone/reschedule/linkage/completion TBD. |
| Gap tài liệu / source / câu hỏi | SRS-TASK-TODAY/ASSIGNEE; today-only/đúng người đã rõ; timezone/reschedule/linkage/completion TBD. |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Task scope hiện tại và gap today |
| Mục tiêu | Task scope hiện tại và gap today |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] [TASKS](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:35); [FACT-DOC] FR-013 |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | GET /api/tasks/daily với task hôm qua/hôm nay/tương lai cùng Staff. |
| Expected HTTP status / response | [FACT-SOURCE] 200 scoped nhưng method không lọc ngày. [FACT-DOC] FR-013 yêu cầu today-only đã rõ; đây là gap source, oracle SRS ở SRS-TASK-TODAY. |
| Expected database state | Không W; không tự complete task khi handover. |
| Cách xác minh dữ liệu | So tất cả task assigned/branch theo source; SRS conformance ghi gap, không gọi PASS daily chỉ vì endpoint trả list. |
| Expected authentication / authorization | STAFF assigned / Manager branch. |
| Expected transaction / audit / side effect | Task due_date tạo theo ngày assignment, không tự đổi theo appointment. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### G1-F2-ARRIVED — Arrival chặn NO_SHOW nhầm

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-ARRIVED |
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-RENT — Thu kỳ đầu sau gán Unit

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-RENT |
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-HANDOVER — Handover đủ cọc/rent/signature/hold

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-HANDOVER |
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SIG-01…04 acceptance evidence BLOCKED; Staff flag baseline không tự là bằng chứng khách. |
| Gap tài liệu / source / câu hỏi | SIG-01…04 acceptance evidence BLOCKED; Staff flag baseline không tự là bằng chứng khách. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-HANDOVER-NEG — Reject thiếu payment/signature/notes hoặc sai hold

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-HANDOVER-NEG |
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SIG-01…04 bổ sung validity/owner/evidence, không chỉ Boolean guard. |
| Gap tài liệu / source / câu hỏi | SIG-01…04 bổ sung validity/owner/evidence, không chỉ Boolean guard. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-PIN-VIEW — Xem contracts và verify access simulation

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-PIN-VIEW |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; P-PIN-20261018 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | PIN-OPEN/CHANGE theo P-PIN-20261018; EXPIRING_SOON không còn policy UNKNOWN. |
| Gap tài liệu / source / câu hỏi | PIN-OPEN/CHANGE theo P-PIN-20261018; EXPIRING_SOON không còn policy UNKNOWN. |
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
| Trạng thái | NOT-TESTED |

### G1-F2-CONSENT-TBD — Chốt consent, early handover và task completion

| Trường | Nội dung |
|---|---|
| Test ID | G1-F2-CONSENT-TBD |
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SIG-01…04: yêu cầu khách xác nhận đã rõ, chỉ cơ chế evidence BLOCKED; early handover/task completion riêng. |
| Gap tài liệu / source / câu hỏi | SIG-01…04: yêu cầu khách xác nhận đã rõ, chỉ cơ chế evidence BLOCKED; early handover/task completion riêng. |
| Giai đoạn | G1 |
| Flow | Flow 2 |
| Step | Chốt consent, early handover và task completion |
| Mục tiêu | Chốt consent, early handover và task completion |
| Nhãn bằng chứng và nguồn | [UNKNOWN] B-SIGNATURE/B-TASK-DATE; [FACT-SOURCE] [HANDOVER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:52) |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-BASE actors/branches độc lập + F-BOOK/F-HAND theo precondition; ID chỉ là nhãn tổng hợp. |
| Request / thao tác dự kiến | Review source Staff flag / không time gate / không auto task complete. |
| Expected HTTP status / response | FR-016/BR-005 đã yêu cầu khách xác nhận; chỉ cơ chế evidence/HTTP còn TBD. SIG-01–04 BLOCKED; không tự bổ sung endpoint Customer. Early handover/task completion là câu hỏi riêng. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

### G2-DUPLICATE — Kiểm duplicate keys chỉ khi shape/quyền đã xác minh

| Trường | Nội dung |
|---|---|
| Test ID | G2-DUPLICATE |
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Trạng thái | NOT-TESTED |

## G3 — chi tiết case

### G3-TARGET — Gate xác nhận environment test khác production

| Trường | Nội dung |
|---|---|
| Test ID | G3-TARGET |
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Expected authentication / authorization | Role database/harness cho migration và Hibernate validate được operator duyệt riêng; không yêu cầu JWT cho DDL/validate. Task này không chạy. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-AUTH-E2E — Registration OTP → login → protected API bằng JWT thật

| Trường | Nội dung |
|---|---|
| Test ID | G4-AUTH-E2E |
| Yêu cầu SRS / quyết định | FR-002; BR-001; AC-01; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
| Giai đoạn | G4 |
| Flow | Đăng ký / đăng nhập |
| Step | Registration OTP → login → protected API bằng JWT thật |
| Mục tiêu | Registration OTP → login → protected API bằng JWT thật |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-VERIFY (snapshot AuthService.java:353; xem delta implementation); [JWT-FILTER](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtAuthenticationFilter.java:30); [NOT-TESTED] |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Trên harness đã duyệt: send/verify synthetic user, login, dùng bearer token trả về vào POST/GET flow. |
| Expected HTTP status / response | [FACT-SOURCE] Positive200, bad input400, no/expired token401 theo nhánh; filter exception TBD. |
| Expected database state | User + history theo source; không dùng real customer; schema constraints đã xác minh. |
| Cách xác minh dữ liệu | Verify client/API response/DB subset; không .with(user()) thay real JWT; không log token. |
| Expected authentication / authorization | Send/verify/login là public; protected API mới dùng JWT được app test cấp, role/owner/branch lấy từ principal server. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-AUTH-RACE — Race tạo tài khoản: hai pending khác email, cùng username

| Trường | Nội dung |
|---|---|
| Test ID | G4-AUTH-RACE |
| Yêu cầu SRS / quyết định | FR-001; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | OTP-RACE-01 kiểm một pending/hai verify riêng; public auth, account race dùng email khác/cùng username. |
| Gap tài liệu / source / câu hỏi | OTP-RACE-01 kiểm một pending/hai verify riêng; public auth, account race dùng email khác/cùng username. |
| Giai đoạn | G4 |
| Flow | Đăng ký |
| Step | Hai verify cạnh tranh và uniqueness thật |
| Mục tiêu | Hai verify cạnh tranh và uniqueness thật |
| Nhãn bằng chứng và nguồn | [FACT-SOURCE] AUTH-SAVE (snapshot AuthService.java:392; xem delta implementation); [ERROR](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/common/exception/GlobalExceptionHandler.java:10); [UNKNOWN] PG concurrency. |
| Precondition | G0/G2/G3 được duyệt cho PostgreSQL thử nghiệm; schema tương thích và fixture riêng của case; chưa chạy trong Phase A/B. |
| Test data / fixture | F-REG synthetic hợp lệ/biến thể được nêu, credential/OTP chỉ là biến trong RAM; không dữ liệu thật. |
| Request / thao tác dự kiến | Tạo hai pending bằng hai email tổng hợp khác nhau, cùng normalized username; bảo đảm cả hai send-otp hoàn tất trước verify cạnh tranh. Không dùng hai pending cùng email vì map ghi đè. OTP-RACE-01 kiểm verify cùng một pending riêng. |
| Expected HTTP status / response | [INFERENCE] Với unique username đã xác minh: tối đa một User; collision tại save có thể 409. Không mặc định mọi request thua đều409; lỗi pending/expiry/input có thể400, filter/storage errors còn TBD. Phải phân loại nhánh thực tế. |
| Expected database state | Tối đa một User theo key nếu invariant/constraint được duyệt; history có semantics best-effort. |
| Cách xác minh dữ liệu | Count by synthetic keys; không dựa precheck; thiếu unique/visibility thì BLOCKED thay vì tự áp constraint. |
| Expected authentication / authorization | Public send-otp/verify-otp; không yêu cầu JWT. Unique/race cần PostgreSQL cô lập, không .with(user()) để giả signup. |
| Expected transaction / audit / side effect | Chỉ side effect đã nêu trong source của path; audit/transaction phải kiểm riêng, không suy từ HTTP thành công. |
| Cleanup | Theo G3-CLEANUP: chỉ môi trường/fixture riêng đã được phê duyệt; lưu bằng chứng đã làm sạch; không cleanup/reset trong Phase A/B. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### G4-LOGOUT — Thu hồi server theo tiêu chí user giữ

| Trường | Nội dung |
|---|---|
| Test ID | G4-LOGOUT |
| Yêu cầu SRS / quyết định | FR-003; NFR-004 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | SRS-LOGOUT-TARGET: cả redirect public/protected và server revoke, không client-only. |
| Gap tài liệu / source / câu hỏi | SRS-LOGOUT-TARGET: cả redirect public/protected và server revoke, không client-only. |
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
| Yêu cầu SRS / quyết định | FR-007–FR-012; BR-003/BR-004; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-007–FR-012; BR-003/BR-004; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-010; NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-012; BR-004; quyết định hủy/cọc đã chốt; phần cutoff còn TBD |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Evidence consent acceptance chưa chứng minh bằng Staff flag; SIG group BLOCKED; PIN policy kiểm riêng. |
| Gap tài liệu / source / câu hỏi | Evidence consent acceptance chưa chứng minh bằng Staff flag; SIG group BLOCKED; PIN policy kiểm riêng. |
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
| Yêu cầu SRS / quyết định | BR-002; NFR-005; AC-11 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-013–FR-017; BR-005/BR-008; AC-06 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | NFR-004/NFR-005/NFR-008; task G0–G4 và FR của flow liên quan |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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
| Yêu cầu SRS / quyết định | FR-001/FR-002/FR-003; FR-007–FR-017; NFR-004/NFR-005/NFR-008 |
| Loại tiêu chí | BASELINE-SOURCE / kiểm tra kỹ thuật theo evidence; không tự thay acceptance SRS. Các gap được kiểm riêng ở nhóm bổ sung mục 9–12. |
| Source behavior / giới hạn | Nhánh source/evidence ở dưới là phân tích tĩnh, chưa quan sát runtime; annotation hoặc lời gọi API trong test không chứng minh DB-state assertion. |
| Expected behavior theo SRS / quyết định | Đối chiếu yêu cầu SRS ở trên và evidence từng nhánh; các status/state nguồn hiện tại là baseline regression, acceptance chưa có implementation/metadata/harness giữ TBD/BLOCKED, không suy PASS. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/UNKNOWN runtime hoặc metadata theo case; không kết luận source/schema đã tương thích chỉ từ kế hoạch. |
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

[UNKNOWN] Fault injection, scheduler/seed isolation, scope token revoke, thiết kế bằng chứng consent, timezone/task completion, late cancel/calendar availability và temporal model còn cần quyết định. [FACT-DOC] Không còn hỏi quyền dùng PIN EXPIRING_SOON còn hạn, today-only, hay có được trim password: các target này đã rõ. Giới hạn byte BCrypt vẫn là đề xuất. Không tự tạo test code/source patch để hoàn thành plan.

## 8. Kiểm tra tài liệu và bàn giao

[FACT-SOURCE] Đã kiểm tra mỗi case có Test ID, Gate, Flow/Step, mục tiêu, bằng chứng, precondition, fixture, request, expected HTTP/DB, verifier, auth, tx/audit/side effect, cleanup, priority và status. Chỉ có NOT-TESTED/BLOCKED/TBD cho các case; không có kết quả thực thi PASS được tuyên bố.

[NOT-TESTED] Thao tác này là kiểm tra cấu trúc tài liệu trong bộ nhớ, không phải chạy test app/API/DB. Inventory test source ở existing-test-inventory.md; trace chi tiết ở flow-api-database-traceability.md; câu hỏi và các gap ở blockers-and-open-questions.md.

[FACT-DOC] Đợt chuẩn hóa 2026-10-19 sửa đúng bốn tài liệu docs/testing được chỉ định; không tạo file mới. Các artifact G0 trước task này chỉ được đọc. Không connect SQL/API/test, không formatter/dependency/refactor/config/DDL/DML/migration/guard/commit/push/branch/PR. Dừng chờ review.


## 9. Chuẩn hóa oracle theo SRS v2.0 — cập nhật 2026-10-19

[FACT-DOC] Thứ tự bằng chứng: yêu cầu chính thức ở [SRS v2.0](D:/SWP/storage-rental/docs/requirements/srs.md:138); quyết định người dùng P-PWD-20261018 và P-PIN-20261018 được ghi bổ sung, không giả là SRS đã sửa. BASELINE-SOURCE mô tả cách code được viết; EXPECTED-BEHAVIOR là oracle SRS/quyết định. TEST EXECUTION: NOT-TESTED cho mọi case mới; không có observed runtime, HTTP trace hoặc DB evidence. GAP-DOC, GAP-SOURCE và UNKNOWN được tách trong từng case. BLOCKED/TBD mô tả điều kiện còn thiếu, không thay NOT-TESTED.

[FACT-DOC] Billing: FIRST_MONTH_RENT ↔ RENT, UNPAID ↔ PENDING và Payment SUCCESS ↔ PAID chỉ là mapping đề xuất. Bảng nghĩa và lifecycle độc lập nằm ở mục 10 của flow-api-database-traceability.md; BILL-TYPE-01/BILL-STATUS-01 BLOCKED đến khi được duyệt. Invoice.status là nghĩa vụ phải thu; Payment.status thuộc từng attempt, không suy trạng thái của một entity từ tên trạng thái entity còn lại.

[FACT-DOC] Các ca cũ vẫn giữ baseline source cho regression, không dùng baseline trái SRS làm acceptance. Phần bổ sung sau đây cung cấp tiền điều kiện, thao tác, assertions và trạng thái riêng cho các gap bắt buộc.


### SRS-REG-PHONE — Từ chối đăng ký trùng số điện thoại

| Trường | Nội dung |
|---|---|
| Test ID | SRS-REG-PHONE |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký |
| Step | Từ chối đăng ký trùng số điện thoại |
| Mục tiêu | Từ chối đăng ký trùng số điện thoại: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001; NFR-006 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | AuthService.java:303 (snapshot AuthService.java:303; xem delta implementation): precheck username/email, chưa thấy precheck phone hoặc repo existsByPhone. Constraint live UNKNOWN. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Existing synthetic user có phone hợp lệ; đăng ký user thứ hai với cùng phone nhưng username/email/CCCD khác; send-otp rồi verify nếu source cho đi tiếp. |
| Expected behavior theo SRS / quyết định | SRS: từ chối tạo thêm tài khoản với SĐT đã tồn tại. Exact HTTP/DTO TBD; source hiện có thể đi tiếp nếu không có DB constraint. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Count User theo phone tổng hợp trước/sau không tăng; không token cho tài khoản bị từ chối; kiểm error rõ ràng, không đoán409. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE: thiếu precheck; UNKNOWN: DB constraint, chuẩn hóa phone và cách xử lý dữ liệu legacy. B-REG-PHONE. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-REG-NAV — Điều hướng về đăng nhập sau đăng ký

| Trường | Nội dung |
|---|---|
| Test ID | SRS-REG-NAV |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký |
| Step | Điều hướng về đăng nhập sau đăng ký |
| Mục tiêu | Điều hướng về đăng nhập sau đăng ký: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [AuthPage.tsx:25](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:25): verify thành công lưu session/token rồi navigate /. SRS nói chuyển đăng nhập. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Browser cô lập gửi F-REG → OTP → verify hợp lệ. |
| Expected behavior theo SRS / quyết định | Đích theo SRS là trang đăng nhập; không coi navigate / là đạt FR-001. Chính sách auto-session sau đăng ký còn cần quyết định riêng. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert pathname /login sau đăng ký; ghi riêng session/token theo source; không tự yêu cầu xóa session nếu chưa chốt. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE/UI; B-AUTH-NAV: exact auto-session semantics chưa chốt, yêu cầu điều hướng đã rõ. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-LOGIN-NAV — Điều hướng theo role và chặn URL trái quyền

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOGIN-NAV |
| Giai đoạn | G1/G4 |
| Flow | Đăng nhập |
| Step | Điều hướng theo role và chặn URL trái quyền |
| Mục tiêu | Điều hướng theo role và chặn URL trái quyền: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-002; AC-01; NFR-004 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [AuthPage.tsx:25](D:/SWP/storage-rental/frontend/src/features/identity/pages/AuthPage.tsx:25): navigate / cho mọi role; RoleGuard kiểm role trên route. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Login lần lượt 5 role ACTIVE trong browser riêng; thử URL của role khác. |
| Expected behavior theo SRS / quyết định | Đưa đến giao diện chuyên biệt đúng role; không render nội dung role khác. Exact URL dashboard TBD, không tự đặt route mới. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Đối chiếu landing component/menu với role đã xác minh ở server; URL trái role hiển thị deny/redirect và không có dữ liệu trái quyền; không bắt buộc HTTP403 cho UI. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE/UI và GAP-TEST; exact route mapping cần owner duyệt, không hạ AC-01 thành home /. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-LOGIN-ACTIVE — Chỉ tài khoản ACTIVE được cấp phiên đăng nhập

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOGIN-ACTIVE |
| Giai đoạn | G1/G4 |
| Flow | Đăng nhập |
| Step | Chỉ tài khoản ACTIVE được cấp phiên đăng nhập |
| Mục tiêu | Chỉ tài khoản ACTIVE được cấp phiên đăng nhập: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-002; BR-001 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | AuthService.java:160 (snapshot AuthService.java:160; xem delta implementation): chỉ loại LOCKED/DISABLED; UserDetails chỉ enabled ACTIVE. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Fixture ACTIVE/LOCKED/DISABLED/NULL/status khác nếu schema test đã xác minh cho phép; credential đúng; login từng case. |
| Expected behavior theo SRS / quyết định | Chỉ ACTIVE nhận token. LOCKED/DISABLED source400; status khác/NULL phải bị từ chối theo BR-001, exact HTTP TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert không token/history SUCCESS cho status không ACTIVE; ACTIVE có token; nếu constraint cấm fixture thì ghi N/A có metadata proof, không tự nới constraint. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE với status ngoài ACTIVE/LOCKED/DISABLED; UNKNOWN chỉ về fixture/live shape, không phải rule ACTIVE. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-JWT-24H — JWT có thời hạn 24 giờ theo BR-001

| Trường | Nội dung |
|---|---|
| Test ID | SRS-JWT-24H |
| Giai đoạn | G1/G4 |
| Flow | Đăng nhập / JWT |
| Step | JWT có thời hạn 24 giờ theo BR-001 |
| Mục tiêu | JWT có thời hạn 24 giờ theo BR-001: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-001; NFR-004 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [JwtUtil.java:25](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/security/JwtUtil.java:25) default expiration 86400000ms; iat/exp tạo bằng hai lần System.currentTimeMillis (L43–44). Runtime override UNKNOWN. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Harness cô lập có clock JWT riêng được duyệt; login; đọc claims trong RAM; gọi protected API trước/sau exp. |
| Expected behavior theo SRS / quyết định | TTL cấu hình24h; exp-iat trong cửa sổ sai số đo đã chốt vì NumericDate precision và hai lần đọc clock. Trước exp có thể200 nếu guards hợp lệ; sau exp từ chối, source entry point dự kiến401. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert effective expiration=86400000ms không xuất signing material; claims/window, token sau expiry không được chấp nhận; exact exp equality theo parser/version cần xác minh. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; BLOCKED harness/time control và runtime TTL; không suy source default là runtime fact. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### SRS-RES-OPS — Quyền Ops xem Reservation toàn chuỗi

| Trường | Nội dung |
|---|---|
| Test ID | SRS-RES-OPS |
| Giai đoạn | G1/G4 |
| Flow | Flow 1 / Reservation scope |
| Step | Quyền Ops xem Reservation toàn chuỗi |
| Mục tiêu | Quyền Ops xem Reservation toàn chuỗi: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-002; NFR-005; RBAC §2.2 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationService.java:36](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36): Ops list bị require() từ chối403, single GET visible global có thể200. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Ops ACTIVE xem reservations hai facility bằng list và single qua JWT test. |
| Expected behavior theo SRS / quyết định | SRS RBAC cho Ops xem đơn toàn chuỗi. Source list403 là gap, không dùng403 làm acceptance thành công. Contract response/list filter exact TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert read-only scope toàn chuỗi theo SRS; không cấp quyền ghi chỉ từ quyền xem; kiểm request ghi trái role không có DB mutation. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE: Ops list; GAP-DOC: route/DTO contract toàn chuỗi chưa chốt. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-RES-ADMIN — Phân biệt quyền Admin xem tổng hợp và chi tiết

| Trường | Nội dung |
|---|---|
| Test ID | SRS-RES-ADMIN |
| Giai đoạn | G1/G4 |
| Flow | Reservation / Admin |
| Step | Phân biệt quyền Admin xem tổng hợp và chi tiết |
| Mục tiêu | Phân biệt quyền Admin xem tổng hợp và chi tiết: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-002; NFR-005; RBAC §2.2 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationService.java:36](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36): Admin list403, single có thể200; RBAC reservation đánh dấu — cho Admin trong khi BR-002 nói xem dữ liệu tổng hợp toàn chuỗi. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Review quyền raw Reservation vs aggregate; sau phê duyệt thử list/single cho Admin với hai branch. |
| Expected behavior theo SRS / quyết định | TBD: quyền xem tổng hợp không tự cấp quyền đọc raw record; không chọn200/403 cho acceptance trước khi giải quyết xung đột SRS. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Ghi quyết định phân biệt aggregate/detail; assert đúng từng route và không vượt scope đã duyệt. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-DOC/SRS nội bộ B-RES-ADMIN; không tự ưu tiên một dòng SRS. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### SRS-RES-ISOLATION — Cách ly Reservation theo owner và chi nhánh

| Trường | Nội dung |
|---|---|
| Test ID | SRS-RES-ISOLATION |
| Giai đoạn | G1/G4 |
| Flow | Flow 1/2 / branch |
| Step | Cách ly Reservation theo owner và chi nhánh |
| Mục tiêu | Cách ly Reservation theo owner và chi nhánh: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-002; NFR-005; AC-11 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationService.java:36](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/reservation/service/ReservationService.java:36) + ActorContext.visible/facility: Customer owner; Staff/Manager branch; route scope guards khác nhau. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | CustomerB đọc đơnA; StaffB/ManagerB list/get/assign/cancel đơnA bằng JWT thật; tất cả input khác hợp lệ. |
| Expected behavior theo SRS / quyết định | Không thấy/sửa dữ liệu chéo. Source get ngoài scope404, assign wrong branch403; status từng route theo trace, không gộp. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Response không chứa fixtureA cho actorB; count/status/hold/Invoice/Audit không bị mutation bởi request từ chối. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: JWT/PG isolation chưa chạy; không áp quyền global của Ops/Admin cho Staff/Manager. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-TASK-TODAY — Daily Tasks đúng ngày nghiệp vụ

| Trường | Nội dung |
|---|---|
| Test ID | SRS-TASK-TODAY |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / Daily Tasks |
| Step | Daily Tasks đúng ngày nghiệp vụ |
| Mục tiêu | Daily Tasks đúng ngày nghiệp vụ: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-013; AC-05 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [TaskService.java:35](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/service/TaskService.java:35): list không lọc dueDate; system L101 lấy LocalDate.now thay vì lịch hẹn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Cùng Staff có task hôm qua/hôm nay/ngày mai; reservation hẹn ngày mai nhưng assign hôm nay; GET tasks/daily. |
| Expected behavior theo SRS / quyết định | Daily list chỉ công việc ngày nghiệp vụ hiện tại được phân công đúng scope; không bỏ sót check-in đúng ngày hẹn. Today-only đã rõ; timezone và reschedule rules còn TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Returned IDs bằng tập nhiệm vụ hôm nay theo lịch nghiệp vụ đã xác nhận; future/past IDs vắng; không coi ngày tạo là lịch hẹn. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE: filter và dueDate; B-TASK-DATE chỉ còn timezone/reschedule/completion, không còn hỏi có lọc today không. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-TASK-ASSIGNEE — Nhiệm vụ xuất hiện cho đúng Staff được phân công

| Trường | Nội dung |
|---|---|
| Test ID | SRS-TASK-ASSIGNEE |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / phân công |
| Step | Nhiệm vụ xuất hiện cho đúng Staff được phân công |
| Mục tiêu | Nhiệm vụ xuất hiện cho đúng Staff được phân công: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-030; FR-013; AC-05; BR-002 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [TaskController.java:23](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/workforce/controller/TaskController.java:23) POST /api/tasks/dispatch → TaskService.assign; system tự chọn Staff đầu, assign đổi sang Staff được Manager chọn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | ManagerA POST dispatch {staffId,title,taskType,unitCode,date} với StaffA2; StaffA1/A2/B GET daily; thử chọn StaffB. |
| Expected behavior theo SRS / quyết định | Source hợp lệ200; wrong branch403. AC-05: người được chọn thấy nhiệm vụ; Staff khác không thấy trong danh sách cá nhân. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert staff_id=StaffA2,facility_code=A,due_date=date, task_type/title đúng; linked reservation nếu thiết kế link được duyệt, không tự thêm request field source chưa hỗ trợ; audit ASSIGN_TASK. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dispatch chưa nhận reservationId/contractId (system gọi null), task→Reservation linkage cho AC-05 cần xác minh thiết kế B-TASK-LINK. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-LOOKUP-ID — Tra cứu Reservation hợp lệ bằng mã đơn

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOOKUP-ID |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / lookup |
| Step | Tra cứu Reservation hợp lệ bằng mã đơn |
| Mục tiêu | Tra cứu Reservation hợp lệ bằng mã đơn: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-014; BR-002; NFR-005 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationLookupPage.tsx:5](D:/SWP/storage-rental/frontend/src/features/reservation/pages/ReservationLookupPage.tsx:5): tải list, tìm chuỗi local; Reservation có customerPhone/id nhưng không CCCD; chưa thấy lookup CCCD server. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | StaffA tìm bằng mã Reservation của Customer có ReservationA đã assigned; thử không tồn tại/đơn hủy/khác facility; chỉ dữ liệu synthetic. |
| Expected behavior theo SRS / quyết định | Hiển thị đúng đơn hợp lệ, đúng Unit Manager gán, cùng facility; không trả đơn hủy như đơn sẵn sàng check-in. Exact lookup endpoint/HTTP nếu chưa có TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert result IDs, assigned unit, trạng thái/hợp lệ và branch; tìm sai/khác branch không lộ dữ liệu; phân biệt list text-search với lookup nghiệp vụ. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE/UI đặc biệt CCCD và lọc hợp lệ; GAP-TEST; không tự tạo route lookup mới. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-LOOKUP-CCCD — Tra cứu Reservation hợp lệ bằng CCCD

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOOKUP-CCCD |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / lookup |
| Step | Tra cứu Reservation hợp lệ bằng CCCD |
| Mục tiêu | Tra cứu Reservation hợp lệ bằng CCCD: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-014; BR-002; NFR-005 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationLookupPage.tsx:5](D:/SWP/storage-rental/frontend/src/features/reservation/pages/ReservationLookupPage.tsx:5): tải list, tìm chuỗi local; Reservation có customerPhone/id nhưng không CCCD; chưa thấy lookup CCCD server. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | StaffA tìm bằng CCCD của Customer có ReservationA đã assigned; thử không tồn tại/đơn hủy/khác facility; chỉ dữ liệu synthetic. |
| Expected behavior theo SRS / quyết định | Hiển thị đúng đơn hợp lệ, đúng Unit Manager gán, cùng facility; không trả đơn hủy như đơn sẵn sàng check-in. Exact lookup endpoint/HTTP nếu chưa có TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert result IDs, assigned unit, trạng thái/hợp lệ và branch; tìm sai/khác branch không lộ dữ liệu; phân biệt list text-search với lookup nghiệp vụ. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE/UI đặc biệt CCCD và lọc hợp lệ; GAP-TEST; không tự tạo route lookup mới. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-LOOKUP-PHONE — Tra cứu Reservation hợp lệ bằng số điện thoại

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOOKUP-PHONE |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / lookup |
| Step | Tra cứu Reservation hợp lệ bằng số điện thoại |
| Mục tiêu | Tra cứu Reservation hợp lệ bằng số điện thoại: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-014; BR-002; NFR-005 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [ReservationLookupPage.tsx:5](D:/SWP/storage-rental/frontend/src/features/reservation/pages/ReservationLookupPage.tsx:5): tải list, tìm chuỗi local; Reservation có customerPhone/id nhưng không CCCD; chưa thấy lookup CCCD server. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | StaffA tìm bằng SĐT của Customer có ReservationA đã assigned; thử không tồn tại/đơn hủy/khác facility; chỉ dữ liệu synthetic. |
| Expected behavior theo SRS / quyết định | Hiển thị đúng đơn hợp lệ, đúng Unit Manager gán, cùng facility; không trả đơn hủy như đơn sẵn sàng check-in. Exact lookup endpoint/HTTP nếu chưa có TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert result IDs, assigned unit, trạng thái/hợp lệ và branch; tìm sai/khác branch không lộ dữ liệu; phân biệt list text-search với lookup nghiệp vụ. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE/UI đặc biệt CCCD và lọc hợp lệ; GAP-TEST; không tự tạo route lookup mới. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### SRS-CATALOG-FILTERS — Lọc kết hợp vị trí diện tích giá và khả dụng

| Trường | Nội dung |
|---|---|
| Test ID | SRS-CATALOG-FILTERS |
| Giai đoạn | G1/G4 |
| Flow | Flow 1 / catalog |
| Step | Lọc kết hợp vị trí diện tích giá và khả dụng |
| Mục tiêu | Lọc kết hợp vị trí diện tích giá và khả dụng: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-007/FR-008; BR-003; AC-02 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | CatalogPage gửi structured query params `facilityCode`, `minSize`, `maxSize`, `minPrice`, `maxPrice`; UnitRepository lọc `available` bằng inclusive bounds. ResourcePage chỉ hiển thị kết quả và tìm kiếm cục bộ trong kết quả. |
| Precondition | Staging schema/startup đã qua migration gate; fixture `FLOW1-DEMO-*` được tạo trong DB scope đã duyệt; browser UX chưa chạy. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Synthetic Units ở2branch, nhiều diện tích/giá/status; chọn vị trí, area range, price range và kết hợp; có nhánh không match. |
| Expected behavior theo SRS / quyết định | Chỉ kết quả đúng tất cả tiêu chí và AVAILABLE; giá/diện tích hiển thị đúng; không match → danh sách rỗng; bounds inclusive. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Returned IDs so với fixture predicate; không dùng substring search như bằng chứng range filter; không có reserved/occupied/maintenance. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | Structured filters đã đóng gap source/UI. Calendar holds và availability theo khoảng thời gian vẫn TBD. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | HTTP-STAGING-PASSED; browser UX NOT-TESTED |

### SRS-LOGOUT-TARGET — Đăng xuất thu hồi server và chuyển về login

| Trường | Nội dung |
|---|---|
| Test ID | SRS-LOGOUT-TARGET |
| Giai đoạn | G1/G4 |
| Flow | Đăng xuất |
| Step | Đăng xuất thu hồi server và chuyển về login |
| Mục tiêu | Đăng xuất thu hồi server và chuyển về login: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-003; NFR-004 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [AppShell.tsx:51](D:/SWP/storage-rental/frontend/src/app/layouts/AppShell.tsx:51) chỉ clear session; public route không bắt buộc /login; chưa có revoke server. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Browser test trên public và protected route: logout; lưu token fixture chỉ trong RAM rồi replay protected request. |
| Expected behavior theo SRS / quyết định | Client hết session, cả hai route về trang đăng nhập công khai; server không chấp nhận token phiên đã logout. HTTP/DTO server TBD. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert storage/listeners/route và denial replay độc lập; không client-only acceptance; scope một phiên/mọi thiết bị cần chốt. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE; B-LOGOUT vẫn BLOCKED, giữ SRS. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### OTP-RACE-01 — Race verify cùng pending và pending bị ghi đè

| Trường | Nội dung |
|---|---|
| Test ID | OTP-RACE-01 |
| Giai đoạn | G4 |
| Flow | Đăng ký / race verify |
| Step | Race verify cùng pending và pending bị ghi đè |
| Mục tiêu | Race verify cùng pending và pending bị ghi đè: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001; NFR-008 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | AuthService.java:331 (snapshot AuthService.java:331; xem delta implementation) map keyed cleanEmail ghi đè; verify get→save→remove không atomic consume. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Một pending synthetic, hai verify cùng email/code đồng thời; riêng thử send-otp lần hai cùng email ghi đè request/code trước. |
| Expected behavior theo SRS / quyết định | Không suy mọi request thua409: pending đã bị xóa/sai mã có thể400; nếu cùng đọc pending thì unique conflict có thể409; schema/encoder/store lỗi khác TBD. Target tối đa1User, không token cho identity sai. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Count theo email/username, phân loại branch và response; chỉ map entry hiện hành; không dùng setup hai pending độc lập cùng email. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST/INFERENCE concurrency; PostgreSQL uniqueness và thao tác consume chưa xác minh. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | BLOCKED |

### BILL-TYPE-01 — Xác minh đề xuất FIRST_MONTH_RENT ↔ RENT

| Trường | Nội dung |
|---|---|
| Test ID | BILL-TYPE-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / Billing |
| Step | Xác minh đề xuất FIRST_MONTH_RENT ↔ RENT |
| Mục tiêu | Xác minh đề xuất FIRST_MONTH_RENT ↔ RENT: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-015; SRS §7 Invoice |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [CreateReservationWorkflow.java:123](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java:123) tạo RENT=monthly snapshot; SRS FIRST_MONTH_RENT. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Review source issue→pay→handover; sau approval fixture 1/3tháng so số tiền và vai trò invoice. |
| Expected behavior theo SRS / quyết định | FIRST_MONTH_RENT ↔ RENT chỉ ánh xạ đề xuất; cần owner xác minh đúng phí kỳ đầu, không phải toàn bộ thời hạn. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert theo source amount=monthly snapshot và Invoice RENT dùng guard handover; chỉ kết luận equivalence khi ngữ nghĩa đã duyệt. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-DOC/SEMANTIC B-BILLING-MAP; chưa tương đương mặc định. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P1 |
| Trạng thái | BLOCKED |

### BILL-STATUS-01 — Đối chiếu riêng vòng đời Invoice và Payment

| Trường | Nội dung |
|---|---|
| Test ID | BILL-STATUS-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 1/2 / Billing |
| Step | Đối chiếu riêng vòng đời Invoice và Payment |
| Mục tiêu | Đối chiếu riêng vòng đời Invoice và Payment: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-010; SRS §7 Invoice/Payment |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [PayInvoiceWorkflow.java:119](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:119): source Invoice PENDING→PAID/CANCELLED; Payment từng attempt FAILED/PAID. SRS Invoice UNPAID/PAID/CANCELLED, Payment SUCCESS/FAILED. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Review độc lập hai state machines và retry; không rename enum dữ liệu hoặc dùng Invoice.status để suy Payment.status. |
| Expected behavior theo SRS / quyết định | UNPAID↔PENDING và Payment SUCCESS↔PAID là đề xuất cần xác minh vòng đời; cùng chữ PAID không đồng nghĩa hai entity cùng lifecycle. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Lập oracle theo entity: invoice obligation và từng attempt; verify cardinality/payment retries/partial/refund semantics trước chốt mapping. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-DOC/SRS: BR-010 cũng dùng Payment PAID trong khi §7 dùng SUCCESS; không tự chọn một vocabulary. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P1 |
| Trạng thái | BLOCKED |

### BILL-ATTEMPT-01 — Assert dữ liệu từng attempt và trạng thái hóa đơn

| Trường | Nội dung |
|---|---|
| Test ID | BILL-ATTEMPT-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 1/2 / payment retry |
| Step | Assert dữ liệu từng attempt và trạng thái hóa đơn |
| Mục tiêu | Assert dữ liệu từng attempt và trạng thái hóa đơn: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-010/FR-015; BR-008/BR-010; NFR-008 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [PayInvoiceWorkflow.java:119](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java:119): failure lưu FAILED, Invoice PENDING; new-key success PAID, Invoice PAID. Replay same-key returns previous. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Invoice synthetic PENDING: simulateFailure true; retry cùng key; attempt mới key khác thành công; query fixtures sau mỗi bước trong phase được duyệt. |
| Expected behavior theo SRS / quyết định | Theo SOURCE regression: cả hai attemptsHTTP200; FAILED không trả tiền, invoice giữ PENDING; sau success Invoice PAID. Không dùng kết quả này để phê duyệt SRS status mapping. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert Payment IDs/count/status/link/amount, same-key không insert; Invoice state riêng; deposit success Reservation RESERVED; audit actions tách statusSUCCESS của audit. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: inventory cũ chỉ HTTP chưa chứng minh trạng thái; không có provider thật. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P1 |
| Trạng thái | NOT-TESTED |

## 10. AUTH-PWD — Chính sách giữ nguyên password/confirmPassword

[FACT-DOC] P-PWD-20261018 (user attachment c46bc6ff-964f-41e7-87f7-2118f11808fe): giữ nguyên chuỗi nhập ở frontend, transport, DTO/deserialization, validation, encode và login; không trim/strip/normalize. So confirm trên raw string; từ chối whitespace-only. Minimum length áp dụng chuỗi gốc; nguồn hiện là Java String.length >=6, đơn vị độ dài Unicode/giới hạn tối đa nếu thay đổi cần duyệt. Không log password/hash/token/OTP. Giới hạn72 byte UTF-8 đã được người dùng chốt ngày2026-10-19; frontend/backend có byte guard mới, chưa chạy test/encoder runtime.

[FACT-SOURCE] AuthService.validateRegistrationData kiểm length raw và equals khi confirm khác null; registerUser encode(password.trim()); login matches(raw,passwordHash), blank guard dùng trim().isEmpty() như predicate, không thay raw truyền vào matches. GAP-SOURCE: encode làm thay đổi credential; không còn hỏi chính sách trim. Plain DTO/setter không normalize; những điểm đã kiểm kê tĩnh và giới hạn runtime được ghi ở trace mục 11.

[INFERENCE] P0 là chuỗi tổng hợp không whitespace ở hai đầu, >=6 và thỏa mọi giới hạn đã chốt; Pedge=SPACE+P0+SPACE; Pinner có SPACE ở giữa; Pblank chỉ SPACE. Giá trị sinh trong RAM, không ghi literal credential/hash/OTP/token vào tài liệu. Case03/04 tái tạo fixture tương đương02 bằng setup rõ ràng, không phụ thuộc thứ tự chạy test.

### AUTH-PWD-01 — P0 đúng chuỗi

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-01 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | P0 đúng chuỗi |
| Mục tiêu | P0 đúng chuỗi: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). Case đối chứng không whitespace; code encode(trim(P0)) bằng P0 và matches raw. Không coi là proof toàn bộ whitespace policy. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Send-otp(password=P0,confirmPassword=P0) → verify OTP → login P0. |
| Expected behavior theo SRS / quyết định | Chuỗi gốc thỏa validation: đăng ký/verify/login thành công; source dự kiến200 khi mọi điều kiện khác đúng. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | User CUSTOMER/ACTIVE; credential encode(P0); history best-effort; login200 có token chỉ RAM. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-02 — Đăng ký password có khoảng trắng đầu/cuối

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-02 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Đăng ký password có khoảng trắng đầu/cuối |
| Mục tiêu | Đăng ký password có khoảng trắng đầu/cuối: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). Source validate/confirm raw nhưng encode(trim(Pedge)); [INFERENCE] chưa giữ nguyên credential theo P-PWD-20261018. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Pedge=SPACE+P0+SPACE, confirm=Pedge; send-otp và verify bằng OTP tổng hợp. |
| Expected behavior theo SRS / quyết định | Chấp nhận nếu đạt validation; BCrypt encode chính Pedge, không trim/strip. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Trong harness encoder đã duyệt: matches(Pedge,storedHash)=true, matches(P0,storedHash)=false; không xuất password/hash. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-03 — Login chuỗi gốc sau AUTH-PWD-02

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-03 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Login chuỗi gốc sau AUTH-PWD-02 |
| Mục tiêu | Login chuỗi gốc sau AUTH-PWD-02: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). [INFERENCE] Hash từ source hiện tại dùng P0, nên login Pedge có thể400; cần thực thi để xác nhận. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Cùng tài khoản AUTH-PWD-02, login Pedge nguyên gốc. |
| Expected behavior theo SRS / quyết định | Thành công theo policy; không chuẩn hóa trước matches. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Login success/token; đối chiếu identity đúng; không cập nhật credential; không log token. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-04 — Login bản trim phải bị từ chối

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-04 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Login bản trim phải bị từ chối |
| Mục tiêu | Login bản trim phải bị từ chối: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). [INFERENCE] Source hiện tại có thể chấp nhận P0 vì hash được tạo từ trim(Pedge), ngược policy. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Cùng tài khoản AUTH-PWD-02, login P0=trim(Pedge). |
| Expected behavior theo SRS / quyết định | Từ chối vì khác chuỗi đã đăng ký; source invalid credential400 là nhánh hiện hành, exact target contract chưa sửa. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Không token và không history SUCCESS cho input sai; credential không đổi; không tự sửa tài khoản legacy. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-05 — Confirm khác khoảng trắng

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-05 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Confirm khác khoảng trắng |
| Mục tiêu | Confirm khác khoảng trắng: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). Source equals trước trim đã kiểm mismatch khi confirm nonnull. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | password=P0+SPACE, confirmPassword=P0; send-otp; các field khác hợp lệ. |
| Expected behavior theo SRS / quyết định | Từ chối so sánh chuỗi gốc; source hiện tại dự kiến400. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Không pending/User/history mới; response lỗi không chứa credential. Missing confirm là câu hỏi riêng, không suy từ case này. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-06 — Mật khẩu chỉ whitespace

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-06 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Mật khẩu chỉ whitespace |
| Mục tiêu | Mật khẩu chỉ whitespace: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). Validation register chỉ length raw và optional equals, chưa có whitespace-only gate; login trim().isEmpty() chặn blank nhưng không normalize raw trước matches. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Pblank là >=6 SPACE tổng hợp, confirm=Pblank; thử send-otp và login trong fixture riêng. |
| Expected behavior theo SRS / quyết định | Từ chối validation, không tạo pending/User/credential/token; không trim thành empty rồi encode. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Không tạo user ở registration; login không token. Source có thể tiến tới encode empty sau trim là INFERENCE, không kết quả runtime. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-07 — Giới hạn byte UTF-8

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-07 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Giới hạn byte UTF-8 |
| Mục tiêu | Giới hạn byte UTF-8: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] PasswordPolicy.validateRegistration kiểm raw UTF-8 bytes <=72; frontend auth-validation kiểm TextEncoder; không cắt/trim. Code mới chưa được compile/test. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | L=72 đã chốt: ASCII/multibyte ở71/72/73byte, giữ raw; kiểm registration và login input quá giới hạn. |
| Expected behavior theo SRS / quyết định | Quyết định ngày2026-10-19: tối đa72byte UTF-8 trên chuỗi gốc; vượt ngưỡng bị từ chối rõ, không cắt/trim. Min6 theo raw UTF-16 length hiện hành. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert UTF-8 byte length độc lập Java UTF-16 length; nếu quá L không pending/save/token/truncation; exact exception→HTTP cần kiểm sau approval. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | Policy raw/72byte đã chốt; guard source đã viết. Encoder/runtime/PostgreSQL/browser chưa thực thi; không đánh dấu PASS hoặc mở lại câu hỏi policy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-08 — Khoảng trắng ở giữa

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-08 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Khoảng trắng ở giữa |
| Mục tiêu | Khoảng trắng ở giữa: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). trim hiện tại không xóa whitespace giữa; source dự kiến đi cùng raw nhưng chưa chạy. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Pinner có SPACE giữa ký tự, >=6 và confirm đúng; send→verify→login đúng; thử bỏ SPACE. |
| Expected behavior theo SRS / quyết định | Chấp nhận chuỗi hợp lệ; chỉ đúng Pinner login được. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Login Pinner thành công, bản bỏ SPACE từ chối; encoder assertion giữ SPACE giữa, không xuất hash. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-09 — JSON client giữ whitespace

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-09 |
| Giai đoạn | G1/G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | JSON client giữ whitespace |
| Mục tiêu | JSON client giữ whitespace: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). DTO setter/User setter gán raw; không tìm thấy custom trimmer/deserializer trong backend/src/main/java đã tìm. registerUser encode trim là gap đã xác minh; effective runtime interceptors UNKNOWN. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | API client test độc lập gửi JSON password/confirm=Pedge, kiểm giá trị qua deserialization→validate→encode; không gọi API thật trong task này. |
| Expected behavior theo SRS / quyết định | Backend giữ nguyên Pedge mọi stage; không normalize ở DTO/filter/Jackson/binder. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert chuỗi tới encoder bằng raw JSON và login matches raw; kiểm response/log không lộ password/hash. Chưa chọn cơ chế spy/harness, không sửa source. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### AUTH-PWD-10 — Browser đăng ký→OTP→login cùng identity

| Trường | Nội dung |
|---|---|
| Test ID | AUTH-PWD-10 |
| Giai đoạn | G4 |
| Flow | Đăng ký → OTP → đăng nhập |
| Step | Browser đăng ký→OTP→login cùng identity |
| Mục tiêu | Browser đăng ký→OTP→login cùng identity: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-001/FR-002; NFR-004/NFR-006; P-PWD-20261018 (quyết định người dùng, không ghi giả là điều khoản SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] AuthService:311 (snapshot AuthService.java:311; xem delta implementation), AuthService:403 (snapshot AuthService.java:403; xem delta implementation), AuthService:143 (snapshot AuthService.java:143; xem delta implementation). FormData→JSON giữ chuỗi theo inspected source; verify hiện auto-session; hash trim khiến chuỗi encode khác chuỗi login. Đây là GAP, không quan sát runtime. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-REG + P0/Pedge/Pblank/Pinner ký hiệu, sinh trong RAM; OTP/credential/hash/token không ghi log hoặc file; mỗi nhánh fixture độc lập, riêng02→03/04 cùng identity. |
| Request / thao tác dự kiến | Browser cô lập nhập Pedge/confirm, OTP đúng; xử lý auto-session và điều hướng riêng FR-001; explicit login original rồi bản trim. |
| Expected behavior theo SRS / quyết định | Original thành công; bản trim bị từ chối; không dựa auto-login token để chứng minh password login. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert FE payload/raw DTO/encoder input/true-and-false matches và explicit login riêng; không để việc verify cấp JWT thay assertion login; route acceptance theo SRS-REG-NAV. |
| Expected authentication / authorization | Auth public send-otp/verify/login; chỉ protected request sau login mới cần JWT test; không yêu cầu JWT để đăng ký. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-SOURCE nếu trái policy đã chốt; GAP-TEST: chưa có AUTH-PWD test implementation; không migration credential legacy. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

## 11. PIN — Mở và đổi là hai quyền độc lập

[FACT-DOC] P-PIN-20261018 là quyết định người dùng trong yêu cầu ngày 2026-10-18, bổ sung BR-006 đang chỉ ghi ACTIVE. Không sửa SRS và không coi quyết định này là source đã triển khai.

| Contract status | Điều kiện thời gian | Expected mở PIN | Expected đổi PIN | Source hiện tại |
|---|---|---|---|---|
| ACTIVE | Theo điều kiện nghiệp vụ hiện hành; fixture còn hạn hoặc đúng endAt | Cho phép khi các guard khác hợp lệ | Cho phép khi các guard khác hợp lệ | verify kiểm endAt; update không kiểm endAt |
| ACTIVE | now > endAt, status chưa đồng bộ | Từ chối theo endAt guard / yêu cầu kiểm hợp đồng hết hạn | TBD nhánh stale ACTIVE; không suy từ EXPIRING_SOON | verify=false; update vẫn có thể ghi |
| EXPIRING_SOON | now <= endAt | Cho phép | Cho phép | verify inclusive; update không time gate |
| EXPIRING_SOON | now > endAt, chưa OVERDUE | Từ chối | Từ chối | GAP-SOURCE: update có thể ghi |
| OVERDUE | Bất kỳ | Từ chối | Từ chối | Query chỉ ACTIVE/EXPIRING_SOON |
| TERMINATED | Bất kỳ | Từ chối | Từ chối | Query chỉ ACTIVE/EXPIRING_SOON |

[UNKNOWN] Chỉ đổi PIN của stale ACTIVE quá endAt, endAt NULL/độ chính xác/timezone và harness còn cần làm rõ. Không còn câu hỏi “EXPIRING_SOON có được dùng/đổi PIN không”. Bằng chứng handover vẫn theo B-SIGNATURE; sinh PIN không chứng minh khách đã xác nhận.

### PIN-OPEN-01 — Mở PIN ACTIVE, now < endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN ACTIVE, now < endAt |
| Mục tiêu | Mở PIN ACTIVE, now < endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now < endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; ACTIVE, now < endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: cho phép mở. [FACT-SOURCE] HTTP200, authorized=true; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=true ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dữ liệu fixture và clock là tiền điều kiện, không tự chạy scheduler để đổi status. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-01 — Đổi PIN ACTIVE, now < endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN ACTIVE, now < endAt |
| Mục tiêu | Đổi PIN ACTIVE, now < endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now < endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, ACTIVE, now < endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Cho phép đổi; [FACT-SOURCE] source happy200 envelope. Không dùng đổi PIN thành công để suy mở PIN luôn hợp lệ. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract.pinCode == Unit.pinCode == biến newPin trong RAM; PIN cũ mở bị từ chối, PIN mới mở được trong cùng mốc hợp lệ; UPDATE_PIN audit đúng actor/entity và transaction; không xuất PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-02 — Mở PIN ACTIVE, now == endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-02 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN ACTIVE, now == endAt |
| Mục tiêu | Mở PIN ACTIVE, now == endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now == endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; ACTIVE, now == endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: cho phép mở. [FACT-SOURCE] HTTP200, authorized=true; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=true ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dữ liệu fixture và clock là tiền điều kiện, không tự chạy scheduler để đổi status. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-02 — Đổi PIN ACTIVE, now == endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-02 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN ACTIVE, now == endAt |
| Mục tiêu | Đổi PIN ACTIVE, now == endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now == endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, ACTIVE, now == endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Cho phép đổi; [FACT-SOURCE] source happy200 envelope. Không dùng đổi PIN thành công để suy mở PIN luôn hợp lệ. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract.pinCode == Unit.pinCode == biến newPin trong RAM; PIN cũ mở bị từ chối, PIN mới mở được trong cùng mốc hợp lệ; UPDATE_PIN audit đúng actor/entity và transaction; không xuất PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-03 — Mở PIN ACTIVE, now > endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-03 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN ACTIVE, now > endAt |
| Mục tiêu | Mở PIN ACTIVE, now > endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now > endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; ACTIVE, now > endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: từ chối mở. [FACT-SOURCE] HTTP200, authorized=false; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=false ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dữ liệu fixture và clock là tiền điều kiện, không tự chạy scheduler để đổi status. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-03 — Đổi PIN ACTIVE, now > endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-03 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN ACTIVE, now > endAt |
| Mục tiêu | Đổi PIN ACTIVE, now > endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract ACTIVE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now > endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, ACTIVE, now > endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | TBD chỉ cho đổi PIN khi ACTIVE nhưng đã vượt endAt: bảng user ghi ACTIVE theo điều kiện nghiệp vụ hiện hành, chưa mô tả rõ nhánh stale ACTIVE. Không tự mở rộng quyết định từ EXPIRING_SOON. Mở PIN nhánh này đã có oracle từ chối riêng. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Ghi nhận nhánh source hiện cho đổi nếu guards khác hợp lệ; chưa chọn mutation/no-mutation làm acceptance đến khi owner chốt; không chạy. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-PIN-ACTIVE-EXPIRED: chỉ nhánh stale ACTIVE đổi PIN còn TBD. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — stale ACTIVE change-PIN semantics |

### PIN-OPEN-04 — Mở PIN EXPIRING_SOON, now < endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-04 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN EXPIRING_SOON, now < endAt |
| Mục tiêu | Mở PIN EXPIRING_SOON, now < endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now < endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; EXPIRING_SOON, now < endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: cho phép mở. [FACT-SOURCE] HTTP200, authorized=true; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=true ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | Đã chốt quyền EXPIRING_SOON, không còn câu hỏi nghiệp vụ. UNKNOWN chỉ runtime/time precision. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-04 — Đổi PIN EXPIRING_SOON, now < endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-04 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN EXPIRING_SOON, now < endAt |
| Mục tiêu | Đổi PIN EXPIRING_SOON, now < endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now < endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, EXPIRING_SOON, now < endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Cho phép đổi; [FACT-SOURCE] source happy200 envelope. Không dùng đổi PIN thành công để suy mở PIN luôn hợp lệ. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract.pinCode == Unit.pinCode == biến newPin trong RAM; PIN cũ mở bị từ chối, PIN mới mở được trong cùng mốc hợp lệ; UPDATE_PIN audit đúng actor/entity và transaction; không xuất PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-05 — Mở PIN EXPIRING_SOON, now == endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-05 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN EXPIRING_SOON, now == endAt |
| Mục tiêu | Mở PIN EXPIRING_SOON, now == endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now == endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; EXPIRING_SOON, now == endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: cho phép mở. [FACT-SOURCE] HTTP200, authorized=true; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=true ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | Đã chốt quyền EXPIRING_SOON, không còn câu hỏi nghiệp vụ. UNKNOWN chỉ runtime/time precision. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-05 — Đổi PIN EXPIRING_SOON, now == endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-05 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN EXPIRING_SOON, now == endAt |
| Mục tiêu | Đổi PIN EXPIRING_SOON, now == endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now == endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, EXPIRING_SOON, now == endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Cho phép đổi; [FACT-SOURCE] source happy200 envelope. Không dùng đổi PIN thành công để suy mở PIN luôn hợp lệ. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract.pinCode == Unit.pinCode == biến newPin trong RAM; PIN cũ mở bị từ chối, PIN mới mở được trong cùng mốc hợp lệ; UPDATE_PIN audit đúng actor/entity và transaction; không xuất PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-06 — Mở PIN EXPIRING_SOON, now > endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-06 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN EXPIRING_SOON, now > endAt |
| Mục tiêu | Mở PIN EXPIRING_SOON, now > endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now > endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; EXPIRING_SOON, now > endAt. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: từ chối mở. [FACT-SOURCE] HTTP200, authorized=false; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=false ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | Đã chốt quyền EXPIRING_SOON, không còn câu hỏi nghiệp vụ. UNKNOWN chỉ runtime/time precision. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-06 — Đổi PIN EXPIRING_SOON, now > endAt

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-06 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN EXPIRING_SOON, now > endAt |
| Mục tiêu | Đổi PIN EXPIRING_SOON, now > endAt: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source update chọn Contract và ghi PIN mà không kiểm endAt; nếu owner/PIN/Unit hợp lệ dự kiến200 kể cả quá hạn. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract EXPIRING_SOON duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; now > endAt; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, EXPIRING_SOON, now > endAt; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Từ chối đổi. OVERDUE/TERMINATED source dự kiến404 trong fixture duy nhất; EXPIRING_SOON hết hạn exact target HTTP TBD vì source còn cho phép ghi. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract/Unit giữ PIN trước, không UPDATE_PIN audit thành công; với EXPIRING_SOON quá hạn, source có thể cập nhật là INFERENCE từ nhánh không endAt guard, chưa là FAIL runtime. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-PIN-ENDAT: GAP-SOURCE đã xác minh thiếu guard endAt ở update; policy đã chốt, không phải câu hỏi có cho EXPIRING_SOON hay không. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-07 — Mở PIN OVERDUE, bất kỳ thời điểm

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-07 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN OVERDUE, bất kỳ thời điểm |
| Mục tiêu | Mở PIN OVERDUE, bất kỳ thời điểm: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract OVERDUE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; bất kỳ thời điểm; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; OVERDUE, bất kỳ thời điểm. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: từ chối mở. [FACT-SOURCE] HTTP200, authorized=false; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=false ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dữ liệu fixture và clock là tiền điều kiện, không tự chạy scheduler để đổi status. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-07 — Đổi PIN OVERDUE, bất kỳ thời điểm

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-07 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN OVERDUE, bất kỳ thời điểm |
| Mục tiêu | Đổi PIN OVERDUE, bất kỳ thời điểm: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source query loại trạng thái này; fixture duy nhất nên dự kiến404 và không write. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract OVERDUE duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; bất kỳ thời điểm; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, OVERDUE, bất kỳ thời điểm; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Từ chối đổi. OVERDUE/TERMINATED source dự kiến404 trong fixture duy nhất; EXPIRING_SOON hết hạn exact target HTTP TBD vì source còn cho phép ghi. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract/Unit giữ PIN trước, không UPDATE_PIN audit thành công; với EXPIRING_SOON quá hạn, source có thể cập nhật là INFERENCE từ nhánh không endAt guard, chưa là FAIL runtime. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-OPEN-08 — Mở PIN TERMINATED, bất kỳ thời điểm

| Trường | Nội dung |
|---|---|
| Test ID | PIN-OPEN-08 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Mở PIN TERMINATED, bất kỳ thời điểm |
| Mục tiêu | Mở PIN TERMINATED, bất kỳ thời điểm: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:37](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:37) query ACTIVE/EXPIRING_SOON, kiểm endAt nonnull, now không after endAt, scope và PIN. Verify trả200 authorized bool; không write/audit. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract TERMINATED duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; bất kỳ thời điểm; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | POST /api/contracts/verify-pin {unitCode,pin} bằng Customer owner, PIN đúng; TERMINATED, bất kỳ thời điểm. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] P-PIN-20261018: từ chối mở. [FACT-SOURCE] HTTP200, authorized=false; mode SOFTWARE_SIMULATION; không IoT thật. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Assert authorized=false ở biên đã cố định; Contract/Unit/PIN/status/count không đổi; verify không audit; không log PIN. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST; dữ liệu fixture và clock là tiền điều kiện, không tự chạy scheduler để đổi status. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-08 — Đổi PIN TERMINATED, bất kỳ thời điểm

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-08 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / PIN sau handover |
| Step | Đổi PIN TERMINATED, bất kỳ thời điểm |
| Mục tiêu | Đổi PIN TERMINATED, bất kỳ thời điểm: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-006; FR-019; AC-07; BR-002; P-PIN-20261018 (quyết định bổ sung SRS, không sửa SRS) |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): CUSTOMER owner; newPin regex6digits; Source query loại trạng thái này; fixture duy nhất nên dự kiến404 và không write. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | Một Contract TERMINATED duy nhất cho Unit fixture, owner CustomerA, PIN hợp lệ chỉ trong RAM; bất kỳ thời điểm; Clock app được kiểm soát và PostgreSQL precision đã xác minh; không có hợp đồng cũ đủ điều kiện làm nhiễu. |
| Request / thao tác dự kiến | PATCH /api/contracts/{unitCode}/pin {newPin} với PIN6digits khác PIN trước, TERMINATED, bất kỳ thời điểm; verifier theo fixture IDs. |
| Expected behavior theo SRS / quyết định | [FACT-DOC] Từ chối đổi. OVERDUE/TERMINATED source dự kiến404 trong fixture duy nhất; EXPIRING_SOON hết hạn exact target HTTP TBD vì source còn cho phép ghi. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract/Unit giữ PIN trước, không UPDATE_PIN audit thành công; với EXPIRING_SOON quá hạn, source có thể cập nhật là INFERENCE từ nhánh không endAt guard, chưa là FAIL runtime. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: state/time oracle đã rõ; source/runtime chưa thực thi. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-CHANGE-09 — Quyền đổi PIN chỉ thuộc Customer sở hữu

| Trường | Nội dung |
|---|---|
| Test ID | PIN-CHANGE-09 |
| Giai đoạn | G1/G4 |
| Flow | PIN / ownership |
| Step | Quyền đổi PIN chỉ thuộc Customer sở hữu |
| Mục tiêu | Quyền đổi PIN chỉ thuộc Customer sở hữu: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-002; NFR-005; FR-019 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): chỉ CUSTOMER và owner; Staff/Manager mở scope branch được nhưng không có quyền đổi. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Fixture ACTIVE còn hạn; CustomerB đổi PIN UnitA; Staff/Manager thử đổi; rồi CustomerA đổi hợp lệ. |
| Expected behavior theo SRS / quyết định | Source CustomerB404, Staff/Manager403, CustomerA200 khi các guard khác đúng; quyền mở và đổi phải kiểm riêng. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Request từ chối không đổi Contract/Unit/PIN/audit success; owner thành công thì hai PIN cùng giá trị chỉ kiểm trong RAM. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | GAP-TEST: không suy quyền đổi từ quyền verify. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED |

### PIN-ATOMIC-01 — Đổi PIN nguyên tử giữa Contract Unit và Audit

| Trường | Nội dung |
|---|---|
| Test ID | PIN-ATOMIC-01 |
| Giai đoạn | G4 |
| Flow | PIN / transaction |
| Step | Đổi PIN nguyên tử giữa Contract Unit và Audit |
| Mục tiêu | Đổi PIN nguyên tử giữa Contract Unit và Audit: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | BR-008; NFR-008; FR-019 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [AccessCodeService:57](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/rental/service/AccessCodeService.java:57): @Transactional, save Contract trước lock/save Unit, audit cuối. [INFERENCE] rollback cần PostgreSQL rehearsal. |
| Precondition | Chỉ kế hoạch; trước thực thi cần G0/G2/G3 phù hợp, phê duyệt phase riêng và harness/fixture PostgreSQL/browser cô lập. Metadata/clock/RLS/role đủ quan sát; chưa chạy trong task này. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Harness đã duyệt tạo lỗi sau save Contract hoặc khi audit/Unit; các fixture khác ACTIVE/còn hạn/owner hợp lệ; không sửa runtime/source trong task tài liệu. |
| Expected behavior theo SRS / quyết định | Không commit cập nhật một phía. Exact lỗi injected→HTTP TBD; không đánh dấu PASS từ annotation. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract.pinCode và Unit.pinCode đều giữ giá trị trước; không audit success commit lẻ; không reset sequence hoặc tạo dữ liệu giả. |
| Expected authentication / authorization | verify: CUSTOMER/STAFF/FMANAGER theo owner/branch; update: CUSTOMER owner. Các fixture từ chối role/owner được kiểm riêng. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | BLOCKED: chưa chọn fault injection/PG harness; không mở quyền sửa source. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — harness approval required |

## 12. B-SIGNATURE — Tiêu chí bằng chứng xác nhận bàn giao

[FACT-DOC] FR-016/BR-005 đã yêu cầu khách xác nhận. Chỉ thiết kế evidence còn BLOCKED, không tự bắt buộc endpoint Customer riêng. Flag của Staff chỉ được chấp nhận nếu thiết kế đã duyệt chứng minh được người xác nhận, thời điểm, đúng customer và handover/contract.

### SIG-01 — Từ chối bàn giao thiếu bằng chứng khách xác nhận

| Trường | Nội dung |
|---|---|
| Test ID | SIG-01 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / bằng chứng khách xác nhận |
| Step | Từ chối bàn giao thiếu bằng chứng khách xác nhận |
| Mục tiêu | Từ chối bàn giao thiếu bằng chứng khách xác nhận: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-016; BR-005/BR-008; AC-06 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [HandoverWorkflow:60](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:60) chỉ Boolean Staff flag; HandoverRecord lưu staffId/handoverDate/flag/notes, chưa có cơ chế evidence đã phê duyệt. |
| Precondition | Thiết kế bằng chứng consent phải được duyệt trước; G0/G3 và harness cô lập được phép; guard khác đủ để cô lập lỗi. Hiện BLOCKED, không thực thi. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Thiếu bằng chứng hoặc evidence không hợp lệ; các guard payment/Unit đều hợp lệ. |
| Expected behavior theo SRS / quyết định | Không hoàn tất handover, dù Staff gửi flag true. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Không Contract/Handover/Unit/Reservation/audit success commit một phần; exact HTTP TBD. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-SIGNATURE: BLOCKED — cần xác nhận thiết kế bằng chứng; không tự thêm API/field/constraint. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — evidence design required |

### SIG-02 — Cho bàn giao khi bằng chứng hợp lệ và đủ guard

| Trường | Nội dung |
|---|---|
| Test ID | SIG-02 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / bằng chứng khách xác nhận |
| Step | Cho bàn giao khi bằng chứng hợp lệ và đủ guard |
| Mục tiêu | Cho bàn giao khi bằng chứng hợp lệ và đủ guard: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-016; BR-005/BR-008; AC-06 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [HandoverWorkflow:60](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:60) chỉ Boolean Staff flag; HandoverRecord lưu staffId/handoverDate/flag/notes, chưa có cơ chế evidence đã phê duyệt. |
| Precondition | Thiết kế bằng chứng consent phải được duyệt trước; G0/G3 và harness cô lập được phép; guard khác đủ để cô lập lỗi. Hiện BLOCKED, không thực thi. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Bằng chứng hợp lệ theo thiết kế được duyệt, đúng customer/handover và đủ guard khác. |
| Expected behavior theo SRS / quyết định | Cho phép tiếp tục bàn giao nguyên tử. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Contract ACTIVE, Reservation CHECKED_IN, Unit occupied, HandoverRecord liên kết evidence; chữ ký có người xác nhận/thời điểm. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-SIGNATURE: BLOCKED — cần xác nhận thiết kế bằng chứng; không tự thêm API/field/constraint. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — evidence design required |

### SIG-03 — Từ chối bằng chứng sai khách hoặc giao dịch

| Trường | Nội dung |
|---|---|
| Test ID | SIG-03 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / bằng chứng khách xác nhận |
| Step | Từ chối bằng chứng sai khách hoặc giao dịch |
| Mục tiêu | Từ chối bằng chứng sai khách hoặc giao dịch: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-016; BR-005/BR-008; AC-06 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [HandoverWorkflow:60](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:60) chỉ Boolean Staff flag; HandoverRecord lưu staffId/handoverDate/flag/notes, chưa có cơ chế evidence đã phê duyệt. |
| Precondition | Thiết kế bằng chứng consent phải được duyệt trước; G0/G3 và harness cô lập được phép; guard khác đủ để cô lập lỗi. Hiện BLOCKED, không thực thi. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Dùng bằng chứng của customer khác hoặc giao dịch/contract khác. |
| Expected behavior theo SRS / quyết định | Từ chối dùng bằng chứng không đúng chủ thể/giao dịch. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Không đổi trạng thái hoặc dùng lại proof sai; exact uniqueness/replay semantics cần thiết kế phê duyệt. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-SIGNATURE: BLOCKED — cần xác nhận thiết kế bằng chứng; không tự thêm API/field/constraint. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — evidence design required |

### SIG-04 — Không mặc định Staff flag là bằng chứng khách

| Trường | Nội dung |
|---|---|
| Test ID | SIG-04 |
| Giai đoạn | G1/G4 |
| Flow | Flow 2 / bằng chứng khách xác nhận |
| Step | Không mặc định Staff flag là bằng chứng khách |
| Mục tiêu | Không mặc định Staff flag là bằng chứng khách: đối chiếu SOURCE FACT với oracle SRS/quyết định và assertions riêng; chưa thực thi. |
| Yêu cầu SRS / quyết định | FR-016; BR-005/BR-008; AC-06 |
| Nhãn bằng chứng và nguồn | [FACT-DOC] SRS/quyết định đã nêu; [FACT-SOURCE] source tĩnh dưới đây; [INFERENCE]/[UNKNOWN] khi có; [NOT-TESTED] mọi kết quả runtime. |
| Hành vi source hiện tại | [FACT-SOURCE] [HandoverWorkflow:60](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/application/workflow/HandoverWorkflow.java:60) chỉ Boolean Staff flag; HandoverRecord lưu staffId/handoverDate/flag/notes, chưa có cơ chế evidence đã phê duyệt. |
| Precondition | Thiết kế bằng chứng consent phải được duyệt trước; G0/G3 và harness cô lập được phép; guard khác đủ để cô lập lỗi. Hiện BLOCKED, không thực thi. |
| Test data / fixture | F-BASE/F-REG/F-BOOK/F-HAND phù hợp case; tất cả dữ liệu tổng hợp, IDs có namespace riêng; không dữ liệu/credential thật. |
| Request / thao tác dự kiến | Staff tự bật cờ mà không có evidence được chấp nhận; riêng nhánh cơ chế Staff ghi nhận đã được duyệt. |
| Expected behavior theo SRS / quyết định | Cờ đơn lẻ không được mặc định là bằng chứng; nếu thiết kế được duyệt chứng minh được consent qua Staff thì kiểm theo thiết kế đó. |
| Expected HTTP status / response | Chỉ các status source nêu rõ trong case là baseline; target khác source hoặc chưa có handler giữ TBD, không tự chọn mã HTTP. |
| Expected database state | Chỉ fixture scope: assertions state/count/link bên dưới theo nhánh cho phép/từ chối; không đọc dữ liệu live. Nếu case review/UI-only thì không có DB mutation được yêu cầu. |
| Cách xác minh dữ liệu / assertions | Có thể xác minh đúng người, thời điểm, khách và giao dịch; không bắt buộc endpoint Customer riêng, không bịa endpoint/evidence schema. |
| Expected authentication / authorization | Actor/role/owner/branch theo SRS và endpoint của case; không lấy role client thay principal; operator visibility riêng cho verifier. |
| Expected transaction / audit / side effect | Workflow có @Transactional phải kiểm atomicity riêng; auth/history best-effort theo trace; deny không được commit business mutation/audit success. Không gọi provider thật hoặc đưa bí mật vào evidence. |
| Gap tài liệu / source / câu hỏi | B-SIGNATURE: BLOCKED — cần xác nhận thiết kế bằng chứng; không tự thêm API/field/constraint. |
| Cleanup | Kế hoạch G3-CLEANUP cho fixture/browser/memory/file thuộc môi trường đã duyệt; không chạy cleanup/reset trong nhiệm vụ tài liệu. |
| Priority | P0 |
| Trạng thái | NOT-TESTED; BLOCKED — evidence design required |

## 13. Bổ sung ngày 2026-10-19 và giới hạn áp dụng

[FACT-DOC] Hai attachment a078a605-4052-456b-acc7-9e863e4426db và 0bf255bc-00db-4bfe-918f-ecb584db631a được đọc như chỉ dẫn bổ sung. Chúng không thay thế source/SRS và không tự mở quyền thực thi. Chính sách raw đã chốt ở P-PWD-20261018 vẫn áp dụng; giữ AUTH-PWD-01…10 thay vì rút còn06.

[UNKNOWN] Bảng ví dụ bổ sung mục6 có các dòng đăng ký/login hiển thị cùng một chuỗi nhưng một dòng ghi từ chối; định dạng không giữ rõ khoảng trắng. B-INPUT-EXAMPLE ghi sự mơ hồ này. Oracle dùng Pedge/P0 rõ ràng của attachment policy và AUTH-PWD-03/04, không diễn giải các dòng trùng thành quy tắc mới.

[FACT-DOC] Cảnh báo nhẹ whitespace ở UI/nút hiện password chỉ là đề xuất UX tùy chọn, chưa là acceptance bắt buộc. Chuẩn hóa non-password và xử lý credential legacy phải duyệt riêng. Không thử raw+trim như fallback trong policy hiện tại; điều đó có thể làm bản trim được chấp nhận trái AUTH-PWD-04. 72byte UTF-8 và nhận định encoder trong attachment không tự chứng minh behavior của dependency đang dùng; AUTH-PWD-07 còn NOT-TESTED, policy72byte đã được chốt. Username duplicate409 trong ví dụ không thay source precheck400 / raceDB409 có điều kiện.

[NOT-TESTED] Kiểm tra cấu trúc và diff tài liệu là static document QA, không test/build ứng dụng. Không kết nối DB, không SQL/API, không sửa source/SRS/config/seed/dependency/schema, không commit/push. Chỉ bốn tài liệu testing được cập nhật; G0–G4 chưa được đánh dấu đạt.

## 14. Delta sau triển khai auth — chưa chạy

[FACT-DOC] 72byte đã chốt. AUTH-PWD-01…10 giữ NOT-TESTED;07 không còn blocker nghiệp vụ. [FACT-SOURCE] PasswordPolicy, RegistrationValidator/AccountService và AuthService hiện dùng raw credential, verify không JWT, login chỉ ACTIVE/JWT24h; frontend chuyển đúng role. Source tests đã thêm, không phải execution. Các nhánh source trong snapshot cũ (trim, auto-login, map consume không atomic) không còn là oracle regression của code mới. Dùng contract/delta để review lại fixture/clock, SMTP/profile/schema guard trước chạy. Toàn114case vẫn là kế hoạch, không phải114test PASS.
