# Blockers và câu hỏi mở — Phase A/B

> **Checkpoint implementation 2026-10-19:** phần FACT-SOURCE của Phase A/B dưới đây ghi snapshot trước đợt sửa auth, không là bằng chứng source/runtime hiện tại. Xem [delta implementation](D:/SWP/storage-rental/docs/testing/auth-implementation-status.md) và contract mới. Người dùng đã chốt tối đa72 byte UTF-8, giữ nguyên whitespace. Checkpoint mới:23unit backend +7unit frontend và TypeScript check đã đạt LOCAL; chưa chạy ứng dụng/API/Supabase, G0–G4 chưa đạt. Xem auth-local-verification.md.

[NOT-TESTED] Đây là điều tra tĩnh và kế hoạch. Không kết nối DB, không chạy SQL/API/test/startup, không sửa source/config/migration, không bỏ guard. Đợt chuẩn hóa 2026-10-19 chỉ sửa đúng bốn tài liệu docs/testing đã được chỉ định; không tạo file mới.

## 1. Quyết định đã được trả lời trong task

[FACT-DOC] Câu hỏi đã gửi: SRS FR-003 cần client/server revoke nhưng source chỉ xóa client session. Người dùng chọn **“Giữ SRS; ghi gap thu hồi server”**. Vì vậy server logout/revocation là blocker của acceptance, không được coi client-only là hoàn tất. Route/DTO/cơ chế/HTTP status server logout còn TBD; không tự thiết kế implementation.

[FACT-DOC] Flow 1/2 đã xác định chắc từ SRS, không cần hỏi định nghĩa: [SRS-F1](D:/SWP/storage-rental/docs/requirements/srs.md:228) và [SRS-F2](D:/SWP/storage-rental/docs/requirements/srs.md:255). Không hợp nhất hai flow.

[FACT-DOC] P-PWD-20261018: password/confirmPassword giữ raw ở mọi stage, không trim/strip/normalize; so raw, chặn whitespace-only, minimum length trên raw; không log password. Tối đa72 byte UTF-8 đã được người dùng chốt ngày2026-10-19, không cắt/trim. P-PIN-20261018: EXPIRING_SOON được mở/đổi khi now<=endAt và bị từ chối cả hai khi now>endAt; OVERDUE/TERMINATED bị từ chối. Quyết định này đóng câu hỏi B-PIN-STATUS trước đây; không đóng gap source B-PIN-ENDAT.

## 2. Blocker matrix

| ID | Nhãn / bằng chứng | Vấn đề / ảnh hưởng | Quyết định hoặc bằng chứng cần có | Phần độc lập vẫn làm được |
|---|---|---|---|---|
| B-G0 | [UNKNOWN] live-schema-verification.md hiện BLOCKED; không có connection read-only/operator evidence accepted | Không xác minh DB/schema/role/version/visibility; 216 field chưa đối chiếu live đúng scope | Operator gửi metadata đã làm sạch + capture time/DB/schema/role/quyền quan sát, hoặc chỉ dẫn phase được phê duyệt sau. Trong task này vẫn cấm mọi kết nối/SQL | Source trace, fixture symbolic, kế hoạch queries tham chiếu |
| B-SCHEMA | [FACT-LIVE] Chỉ snapshot audit do user từng cung cấp, thời điểm/DB-role chưa xác định; [FACT-DOC] schema REF | Snapshot thiếu user_id/entity_id/facility_code; các thiếu khác chỉ so REF. Không thể khẳng định deployment chạy được | Metadata current đầy đủ; không dùng file REF hoặc test H2 để thông qua G0 | Inventory source và current live status UNVERIFIED |
| B-LOGOUT | [FACT-DOC] FR-003 + user confirmation; [FACT-SOURCE] AppShell/session/JWT filter | Chưa có server revoke path; replay token chưa được test | Thiết kế logout/revocation và scope một phiên hay mọi thiết bị cần duyệt riêng trước Phase C | Trace client hiện tại, case target BLOCKED |
| B-ENV | [FACT-SOURCE] profile local URL template bất thường + H2 driver/create-drop, test profile H2/create-drop | Không có PG harness được chứng minh an toàn; Maven/startup/test có thể ghi DB và evidence files | Operator xác nhận ephemeral DB/schema/role, effective profile/datasource/upload path, seed/job isolation; không gửi credential | Đọc test/config nonsecret và thiết kế gate G3 |
| B-TRACE | [FACT-SOURCE + FACT-DOC] SRS mô tả GET /unit-types và POST /payments/deposit; controller hiện dùng /facilities/units và /payments/simulate | Tài liệu route và source khác; endpoint không mapping không tự kết luận 404 vì error/filter chain chưa chạy | Owner cập nhật contract/SRS qua phê duyệt; test source-route và doc-conformance tách riêng | Truy vết route thực có handler |
| B-DATE | [FACT-SOURCE] Clock Asia/Ho_Chi_Minh và các now() JVM; [FACT-LIVE] snapshot audit timestamptz | Temporal mapping/24h/NO_SHOW/PIN validity trên PG chưa được đo | Chốt UTC/instant vs business local và rehearsal riêng; không tự đổi LocalDateTime/timestamp | Boundary cases dựa calculator/source, trạng thái NOT-TESTED |
| B-AUDIT | [FACT-SOURCE] [AUDIT](D:/SWP/storage-rental/backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java:26) lấy actor facility, IP marker và status SUCCESS; SRS audit có yêu cầu khác | Sai khác semantics target vs actor, IP/old/new và metadata cột; lỗi audit có thể rollback workflow | Chốt scope audit theo task đã mở; không sửa schema/code trong A/B | Assert dự kiến đúng source và ghi target yêu cầu TBD |
| B-SIGNATURE | [FACT-DOC] FR-016/BR-005/AC-06 yêu cầu bằng chứng khách xác nhận; [FACT-SOURCE] Staff flag/record chưa chứng minh người xác nhận | BLOCKED — thiết kế bằng chứng chưa được duyệt; không bắt buộc endpoint Customer riêng | Phê duyệt cơ chế evidence, nơi lưu, liên kết đúng customer/handover/contract, identity/time của người xác nhận; Staff flag chỉ đủ nếu cơ chế được duyệt chứng minh được consent | SIG-01…04 NOT-TESTED/BLOCKED; baseline Boolean guard giữ riêng |
| B-TASK-DATE | [FACT-DOC] FR-013/AC-05 đã rõ today/đúng người; [FACT-SOURCE] due_date now, list không lọc ngày | GAP-SOURCE: không đáp ứng daily theo lịch; không còn TBD có cần today-only | Cần timezone/ngày nghiệp vụ, reschedule sync và task completion; không tự yêu cầu auto-complete từ handover | SRS-TASK-TODAY/ASSIGNEE NOT-TESTED |
| B-CANCEL | [FACT-SOURCE] cancel chỉ gate status và scope; [FACT-DOC] SRS nói trước giờ hẹn; quyết định mới dùng rental start để xét cọc | Mốc cho phép cancel khác mốc tính refund; không tự hợp nhất | Nếu chưa check-in nhưng đã qua lịch hẹn/rental start thì còn được cancel không? Chỉ hỏi để target conformance, không đổi source | Current CANCELLED/release guard trace; ≥24h policy là quyết định đã có |
| B-CAPACITY | [FACT-SOURCE] catalog lọc status available, create trừ holds chưa gán; không interval-overlap engine | Kết quả catalog có thể còn Unit nhưng create hết capacity; chưa có calendar availability theo kỳ | Owner chốt semantics hiển thị available và future rental overlap | Test source capacity conflict và concurrent holds |
| B-OTP | [FACT-SOURCE] pending in-memory, resend trả mã cũ không gia hạn; mock code trả/console; không thấy attempt limit | Tên resend/production security khác khả năng thực tế; restart mất pending | Scope mock cho đồ án hay acceptance production? Resend cần mã mới/TTL/rate limit không? Không đọc mã/token thực | Validation/expiry/replay source cases; external provider TBD |
| B-AUTH-ATOMIC | [FACT-SOURCE] không outer auth transaction; recordLogin swallow exception | User/login có thể thành công dù history lỗi; chưa có invariant auth-audit được duyệt | History best-effort có chấp nhận không? Không tự yêu cầu rollback User theo thông lệ | Test current observable behavior dự kiến; target TBD |
| B-LEGACY-DATA | [UNKNOWN] không đọc live rows; dữ liệu active có thể thiếu ownership/timestamp/snapshot/hold | Không đủ xác nhận end-to-end với legacy data | Data checks chỉ sau metadata và scope data được phép; không suy “sạch” từ 0 dưới RLS | Fixture synthetic và assertions planned |
| B-REHEARSAL | [UNKNOWN / NOT-TESTED] không PG/migration/restore test hiện có | Không có G4 PASS, rollback artifact PG chưa chứng minh | Migration độc lập đã duyệt, clone PG an toàn, restore và audit evidence retention | Kế hoạch PASS/FAIL/BLOCKED, không thực hiện |

## 3. Xung đột được phân loại, không tự sửa hoặc chọn nghĩa

- [FACT-DOC] Quyết định giữ giá 24h chờ cọc mới hơn diễn đạt Scope cũ “giữ phòng 24h sau cọc”; ma trận dùng quyết định đã chốt, ghi tài liệu cũ cần chỉnh qua phê duyệt.
- [FACT-SOURCE + FACT-DOC] SRS dùng một số tên Invoice/Payment status/type khác source. Không đổi nhãn dữ liệu cũ để khớp một sơ đồ.
- [FACT-SOURCE] Quote API có validation nhưng không có role require riêng ngoài security authenticated. List và single-reservation get có khác scope caller. Không suy rule role đồng nhất cho mọi route.
- [FACT-SOURCE] Handover Contract dùng thời điểm thực tế now, không reservation.rentalStartAt; arrived_at không bắt buộc trong method. [UNKNOWN] Early handover/chặn theo lịch cần rule owner, không tự điền expected theo thông lệ.
- [FACT-SOURCE] DTO registration validate dob/gender nhưng User không persist hai field; duplicate phone/CCCD không được precheck trong path, role luôn CUSTOMER. [UNKNOWN] Scope lưu dữ liệu/xác minh CCCD sâu cần business xác nhận; không dùng CCCD fallback literal hoặc dữ liệu cá nhân làm fixture.
- [FACT-SOURCE] Registration trim credential trước encode trong khi login dùng input nguyên; validation và persistence phone/CCCD không hoàn toàn cùng normalization. [FACT-DOC] P-PWD-20261018 đã chốt giữ password/confirm nguyên chuỗi, raw compare, raw length và chặn whitespace-only. Không còn câu hỏi có được trim password; byte cap đã chốt; chỉ runtime encoder/legacy còn mở, confirm hiện bắt buộc theo contract implementation; phone/CCCD có policy riêng.
- [FACT-SOURCE] API login lỗi credential là 400 theo IllegalArgumentException, protected unauthenticated là 401. Không “chuẩn hóa” expected code sang 401 cho mọi lỗi auth.

## 4. Thiếu coverage và rủi ro test

[FACT-SOURCE] Existing inventory có 8 backend @Test và 3 frontend it cases, không phải 11 PASS. MockMvc .with(user()) không test toàn bộ JWT bearer chain. H2 create-drop không xác minh PostgreSQL FK/type/sequence/lock/RLS. Không có register/OTP/logout/PG migration suite riêng được tìm thấy.

[FACT-SOURCE] Test lớp lifecycle ghi DB và evidence file, manual initializer trong @BeforeEach; không có cleanup/test-transaction rollback tổng thể. @EnableScheduling và effective environment cần gate G3. Không chạy test chỉ vì tên method là unit/integration.

[NOT-TESTED] Tất cả planned cases chưa được chạy; không có dữ liệu, screenshot, HTTP trace hoặc test result mới trong Phase A/B.

## 5. Phạm vi file và thao tác

[FACT-SOURCE] Đợt tạo ban đầu đã kiểm tra các path chưa tồn tại. Đợt chuẩn hóa 2026-10-19 chỉ cập nhật bốn file hiện có: g0-g4-integrated-test-plan.md, flow-api-database-traceability.md, existing-test-inventory.md, blockers-and-open-questions.md. Không tạo helper/SQL/test file hoặc sửa file ngoài danh sách.

[FACT-SOURCE] Các artifact G0 trong docs/drafts/schema-alignment-20261018 đã tồn tại từ công việc trước yêu cầu A/B; task này chỉ đọc, không tạo lại/cập nhật chúng. Không tạo SQL/test/helper script mới ngoài bốn deliverable; không install/format/refactor/configure DB/commit/push/branch/PR.

## 6. Câu hỏi cần người dùng/operator trả lời trước Phase C

1. **Logout:** đã giữ server revoke theo SRS; cần scope một phiên hay mọi thiết bị và artifact thiết kế được duyệt trước implementation?
2. **G0/G3:** operator nào cung cấp metadata đã làm sạch, đúng database/schema/role/capture time/visibility? Môi trường PostgreSQL thử nghiệm cô lập nào sẽ được phê duyệt riêng (không gửi credential)?
3. **Flow 2:** cơ chế evidence nào được chấp nhận, lưu ở đâu và chứng minh người/thời điểm/customer/handover/contract thế nào? Không bắt buộc Customer endpoint. Early handover/arrived, timezone/reschedule, task completion và dispatch→Reservation linkage còn cần thiết kế; yêu cầu today/đúng người đã rõ.
4. **Flow 1:** chốt late-cancel eligibility tách khỏi refund policy; available theo status/quantity hay lịch thuê tương lai? Những mục chưa chốt giữ TBD/BLOCKED.
5. **Auth:** chốt scope OTP mô phỏng, resend/attempt-limit, history best-effort và lưu DOB/gender/CCCD validation sâu nếu là acceptance requirement?
6. **Ba quyết định schema đã mở:** actor vs event facility, UTC/instant, invoice/refund cardinality/key scope vẫn chưa được tự phê duyệt; cần owner chốt trước tạo constraint/code liên quan. Task A/B hiện không mở rộng thành sửa refund/Flow 3–7.

[NOT-TESTED] Dừng ở Phase A/B, chờ review. Không chuyển Phase C hoặc đánh dấu gate hoàn thành từ việc tài liệu đã được cập nhật.


## 7. Chuẩn hóa theo SRS và quyết định mới — trạng thái chưa thực thi

| ID | Yêu cầu / phân loại | Source / target | Phần còn TBD/BLOCKED; test dự kiến |
|---|---|---|---|
| B-BILLING-MAP | FR-010/FR-015, BR-010, SRS §7; GAP-DOC | Đề xuất FIRST_MONTH_RENT↔RENT, Invoice UNPAID↔PENDING, Payment SUCCESS↔PAID; phải so Invoice.status và Payment.status độc lập | BLOCKED: ngữ nghĩa kỳ thuê, amount, state lifecycle/partial/retry/refund/cardinality/key scope; SRS §7 dùng Payment SUCCESS nhưng BR-010 viết PAID. BILL-TYPE/STATUS-01 |
| B-REG-PHONE | FR-001; GAP-SOURCE/GAP-TEST | SRS chặn trùng SĐT; precheck source chỉ username/email | Rule chặn trùng đã rõ; DB live/canonical phone/legacy handling/error contract chưa rõ. SRS-REG-PHONE NOT-TESTED |
| B-AUTH-NAV | FR-001/FR-002/AC-01; GAP-SOURCE/UI | Source verify auto-session, cả login/verify navigate /; SRS register→login và login→giao diện role | Exact role-route map/auto-session design TBD; không hạ oracle SRS thành /. SRS-REG-NAV/LOGIN-NAV |
| B-AUTH-STATUS-TTL | BR-001; GAP-SOURCE/TEST | Chỉ ACTIVE và JWT24h đã rõ; source loại LOCKED/DISABLED; JwtUtil default24h không proof runtime override | Harness/time tolerance/precision và statuses fixture/schema cần kiểm. SRS-LOGIN-ACTIVE/JWT-24H; không hỏi lại policy ACTIVE |
| B-RES-OPS | BR-002/RBAC; GAP-SOURCE | Ops xem toàn chuỗi theo SRS; source list403/get có thể200 | Chốt contract route/response, không cấp quyền ghi từ quyền đọc. SRS-RES-OPS |
| B-RES-ADMIN | BR-002/RBAC; GAP-DOC/SRS nội bộ | BR-002 cho Admin xem aggregate, RBAC Reservation —; source single visible global | BLOCKED cần phân biệt raw/detail/aggregate; không tự cho phép raw chỉ từ quyền aggregate. SRS-RES-ADMIN |
| B-TASK-LINK | FR-013/FR-030/AC-05; GAP-TEST/thiết kế | dispatch chọn đúng Staff nhưng gọi system reservation/contract null; auto assign-unit chọn Staff đầu | Cần cơ chế task gắn đúng Reservation cho lookup; không thêm field/API chưa duyệt. SRS-TASK-ASSIGNEE |
| B-LOOKUP | FR-014; GAP-SOURCE/UI/TEST | List local search có id/phone; chưa CCCD; chưa tiêu chí đơn hợp lệ chuyên biệt | Yêu cầu ba khóa tìm đã rõ; route/DTO/error contract, normalization và privacy của lookup cần thiết kế. SRS-LOOKUP-ID/CCCD/PHONE |
| B-FILTER | FR-008/AC-02; GAP-SOURCE/UI | Yêu cầu vị trí/diện tích/khoảng giá/available đã rõ; source generic substring | Chỉ inclusive bounds/empty semantics UI và lịch khả dụng tương lai còn TBD, không hỏi lại có cần filter. SRS-CATALOG-FILTERS |
| B-PWD-PRESERVE | FR-001/002, NFR-004/006 + P-PWD-20261018; GAP-SOURCE | Policy raw đã chốt; encode(trim(password)) sai policy, matches nhận raw | Không cần chốt lại trim; AUTH-PWD-01…10 NOT-TESTED. Không tự migrate/reset credential cũ |
| B-PWD-BYTES | DECIDED72 / NOT-TESTED | Người dùng đã chốt tối đa72byte UTF-8, không cắt/trim; source guard frontend/backend đã viết | Không còn chờ policy; test multibyte/boundary và encoder runtime còn NOT-TESTED, không chạy dependency/build |
| B-PWD-CONFIRM | FR-001 + quyết định raw compare; UNKNOWN | Source optional confirm khi null; policy đã chốt cách so khi có confirm, chưa nói rõ bỏ field server | Có bắt buộc confirm ở API/server không, Unicode whitespace/length units ngoài raw Java length, xử lý account legacy đã trim? Không tự tạo rule mới |
| B-PIN-ENDAT | BR-006/FR-019 + P-PIN-20261018; GAP-SOURCE | EXPIRING_SOON còn hạn/đúng hạn cho cả hai, quá hạn từ chối cả hai; update thiếu endAt guard | Policy đã chốt; thiếu implementation chưa sửa. PIN-CHANGE-06 và nhóm OPEN/CHANGE NOT-TESTED; không giữ câu hỏi quyền EXPIRING_SOON |
| B-PIN-ACTIVE-EXPIRED | BR-006 + P-PIN-20261018; UNKNOWN hẹp | verify từ chối ACTIVE quá endAt; update không time gate; bảng user ghi ACTIVE theo điều kiện nghiệp vụ hiện hành | TBD chỉ cho đổi PIN của stale ACTIVE quá endAt và endAt NULL; PIN-CHANGE-03 BLOCKED. Không mở lại quyết định EXPIRING_SOON |
| B-OTP-RACE | FR-001/NFR-008; GAP-TEST | Một pending/email, send lần sau ghi đè; consume verify chưa atomic | Phân biệt account race different emails/same username với verify cùng pending; loser400/409/khác theo guard/DB. G4-AUTH-RACE/OTP-RACE-01 NOT-TESTED/BLOCKED |

[FACT-SOURCE] Đã kiểm tĩnh Frontend FormData→JSON, Register/Login DTO setters, User.setPassword, AuthService validate→encode→matches; không tìm thấy custom StringTrimmerEditor/@InitBinder/Jackson deserializer trong backend/src/main/java. Seed path encode literal trực tiếp, literal đã kiểm không whitespace ở hai đầu và không xuất giá trị. [UNKNOWN] Runtime interceptors/library version/seed rows/legacy hashes không được suy từ static inspection.

[FACT-DOC] B-SIGNATURE vẫn BLOCKED: owner cần duyệt cơ chế lưu/prove consent, liên kết đúng khách/handover/contract, người/thời điểm xác nhận. Không coi Staff flag tự bật là bằng chứng, trừ khi thiết kế đã duyệt chứng minh được; SIG-01…04 đều NOT-TESTED/BLOCKED. Không yêu cầu endpoint Customer riêng.

[NOT-TESTED] Đợt cập nhật bổ sung51 case tài liệu (tổng114), không51 test implementation. G0 metadata, PostgreSQL harness, UTC/instant, audit actor-vs-target facility, billing/refund cardinality/key scope, logout scope và signature evidence vẫn cần bằng chứng/quyết định. Không PASS/FAIL runtime, không G0–G4 complete.

## 8. Tiếp nhận bổ sung 2026-10-19

| ID | Phân loại | Nội dung / quyết định còn cần |
|---|---|---|
| B-INPUT-EXAMPLE | GAP-DOC minh họa, không phải policy mới | Attachment 0bf255bc… mục6 hiển thị các cặp đăng ký/login cùng chuỗi nhưng outcome khác, do khoảng trắng không rõ. Không thể dùng làm oracle literal. Chính sách raw trong attachment c46bc6ff… đã rõ; dùng Pedge/P0 của AUTH-PWD-02…04; nếu thay ví dụ minh họa cần giữ dấu phân biệt whitespace |
| B-PWD-TRANSITION | UNKNOWN / chưa duyệt triển khai | Đề xuất tương lai thử raw+trim rồi rehash credential legacy chưa được chấp thuận và có thể trái raw-only/AUTH-PWD-04. Cần quyết định migration/account recovery riêng trước mọi thay đổi; task này không chạm hash/seed/source/DB |
| B-PWD-UX | Đề xuất tùy chọn | Warning whitespace / nút hiện password chưa bắt buộc, không thêm feature/source hoặc gate mới; chỉ đảm bảo không tự sửa credential |
| B-PWD-EXTERNAL | UNKNOWN evidence | Lập luận NIST và hành vi BCrypt truncate/throw trong attachment chưa được kiểm chứng theo standard/dependency version trong task; không đưa thành FACT-SOURCE hoặc kết quả runtime. Byte cap72 đã được người dùng chốt; runtime/standard evidence vẫn UNKNOWN, không cần viện dẫn NIST để xác nhận quyết định |

[FACT-SOURCE] Ví dụ username trùng trả409 không khớp mọi path: send-otp precheck đang400, DB unique collision có thể409, pending/OTP errors có thể400. Tách SOURCE/EXPECTED/NOT-TESTED; không tự sửa mã HTTP hoặc SRS.

[FACT-DOC] Phạm vi vẫn đúng bốn tài liệu. Câu hỏi đã chốt (raw password, EXPIRING_SOON hợp lệ, today-only, server logout requirement) không được mở lại; các câu hỏi hẹp/thiết kế/metadata còn mở được liệt kê ở mục2/7/8.

## 9. Blocker sau đợt implementation auth 2026-10-19

[FACT-SOURCE] Gap trim trước encode, login chưa ACTIVE-only, auto-login sau verify và landing chung đã sửa trong code; compile/runtime chưa xác nhận. ConfirmPassword nay bắt buộc theo contract mới. Phone precheck đã có nhưng unique/collision/RLS/metadata Supabase vẫn UNVERIFIED; schema-reviewed mặc địnhfalse chặn đăng ký trước query/OTP.

[FACT-DOC] Quyết định72byte đã chốt; không hỏi lại. Chưa có form kết nối đầy đủ/approval metadata và auth writes, mode OTP/SMTP, private credential location nên không kết nối/startup/test. B-G0/B-ENV vẫn BLOCKED. OTP memory một process, shared store/multi-instance và legacy handling chưa được xác minh. Scheduler có conditional config mới, auth-supabase/test tắt; effective config chưa chạy để xác nhận. Logout server vẫn chưa làm trong đợt auth này.

## 10. Target staging được người dùng xác nhận, chưa live

Người dùng đã cung cấp project xnerbsgbwdpemvnatvuy, direct db.xnerbsgbwdpemvnatvuy.supabase.co:5432/postgres, public, role postgres, SSL require và quyền test accounts/auth-nghiệp vụ writes. Chọn file secret ngoài Git nhưng chưa gửi đường dẫn; OTP mode còn chờ. Không còn thiếu target metadata do user khai báo, nhưng B-G0 vẫn thiếu metadata live/constraints. Form local http://127.0.0.1:8767/ không nhận secret lên server; lưu file rồi chỉ gửi đường dẫn. Compile/unit local đã đạt không đồng nghĩa G0 hoặc API staging đạt.
