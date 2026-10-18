# Blockers và câu hỏi mở — Phase A/B

[NOT-TESTED] Đây là điều tra tĩnh và kế hoạch. Không kết nối DB, không chạy SQL/API/test/startup, không sửa source/config/migration, không bỏ guard. Chỉ tạo bốn tài liệu mới được user cho phép.

## 1. Quyết định đã được trả lời trong task

[FACT-DOC] Câu hỏi đã gửi: SRS FR-003 cần client/server revoke nhưng source chỉ xóa client session. Người dùng chọn **“Giữ SRS; ghi gap thu hồi server”**. Vì vậy server logout/revocation là blocker của acceptance, không được coi client-only là hoàn tất. Route/DTO/cơ chế/HTTP status server logout còn TBD; không tự thiết kế implementation.

[FACT-DOC] Flow 1/2 đã xác định chắc từ SRS, không cần hỏi định nghĩa: [SRS-F1](D:/SWP/storage-rental/docs/requirements/srs.md:228) và [SRS-F2](D:/SWP/storage-rental/docs/requirements/srs.md:255). Không hợp nhất hai flow.

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
| B-SIGNATURE | [FACT-SOURCE] Handover chỉ nhận Staff flag customerSignatureConfirmed; [FACT-DOC] Customer xác nhận | Không có customer-authenticated signature step riêng được tìm thấy | Staff ghi nhận consent có đủ không hay cần xác nhận độc lập? Chưa tự cho checkbox đồng nghĩa chữ ký đã xác thực | Test flag bắt buộc theo source; acceptance xác thực chữ ký BLOCKED/TBD |
| B-TASK-DATE | [FACT-SOURCE] task due_date now, list không lọc ngày; [FACT-DOC] FR-013 daily work | Không chứng minh “trong ngày hẹn”; handover không complete task | Chốt due_date theo lịch hẹn/assignment và rule hoàn thành; không tự thêm expected auto-complete | Trace assigned-task scope hiện tại và kiểm DB dự kiến |
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
- [FACT-SOURCE] Registration trim credential trước encode trong khi login dùng input nguyên; validation và persistence phone/CCCD không hoàn toàn cùng normalization. [UNKNOWN] Target normalization cần owner xác nhận, không tự sửa hoặc tạo dữ liệu thật.
- [FACT-SOURCE] API login lỗi credential là 400 theo IllegalArgumentException, protected unauthenticated là 401. Không “chuẩn hóa” expected code sang 401 cho mọi lỗi auth.

## 4. Thiếu coverage và rủi ro test

[FACT-SOURCE] Existing inventory có 8 backend @Test và 3 frontend it cases, không phải 11 PASS. MockMvc .with(user()) không test toàn bộ JWT bearer chain. H2 create-drop không xác minh PostgreSQL FK/type/sequence/lock/RLS. Không có register/OTP/logout/PG migration suite riêng được tìm thấy.

[FACT-SOURCE] Test lớp lifecycle ghi DB và evidence file, manual initializer trong @BeforeEach; không có cleanup/test-transaction rollback tổng thể. @EnableScheduling và effective environment cần gate G3. Không chạy test chỉ vì tên method là unit/integration.

[NOT-TESTED] Tất cả planned cases chưa được chạy; không có dữ liệu, screenshot, HTTP trace hoặc test result mới trong Phase A/B.

## 5. Phạm vi file và thao tác

[FACT-SOURCE] Bốn path dưới docs/testing đã được kiểm tra resolve nằm trong repository và không tồn tại trước khi tạo. Không ghi đè file cũ; chỉ tạo g0-g4-integrated-test-plan.md, flow-api-database-traceability.md, existing-test-inventory.md, blockers-and-open-questions.md.

[FACT-SOURCE] Các artifact G0 trong docs/drafts/schema-alignment-20261018 đã tồn tại từ công việc trước yêu cầu A/B; task này chỉ đọc, không tạo lại/cập nhật chúng. Không tạo SQL/test/helper script mới ngoài bốn deliverable; không install/format/refactor/configure DB/commit/push/branch/PR.

## 6. Câu hỏi cần người dùng/operator trả lời trước Phase C

1. **Logout:** đã giữ server revoke theo SRS; cần scope một phiên hay mọi thiết bị và artifact thiết kế được duyệt trước implementation?
2. **G0/G3:** operator nào cung cấp metadata đã làm sạch, đúng database/schema/role/capture time/visibility? Môi trường PostgreSQL thử nghiệm cô lập nào sẽ được phê duyệt riêng (không gửi credential)?
3. **Flow 2:** Staff ghi nhận consent có đủ hay Customer phải xác nhận độc lập? Gate early handover/arrived và task due/completion mong muốn là gì?
4. **Flow 1:** chốt late-cancel eligibility tách khỏi refund policy; available theo status/quantity hay lịch thuê tương lai? Những mục chưa chốt giữ TBD/BLOCKED.
5. **Auth:** chốt scope OTP mô phỏng, resend/attempt-limit, history best-effort và lưu DOB/gender/CCCD validation sâu nếu là acceptance requirement?
6. **Ba quyết định schema đã mở:** actor vs event facility, UTC/instant, invoice/refund cardinality/key scope vẫn chưa được tự phê duyệt; cần owner chốt trước tạo constraint/code liên quan. Task A/B hiện không mở rộng thành sửa refund/Flow 3–7.

[NOT-TESTED] Dừng ở Phase A/B, chờ review. Không chuyển Phase C từ việc tài liệu đã được tạo.

