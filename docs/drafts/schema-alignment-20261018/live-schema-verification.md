# Live schema verification — G0 CHƯA ĐẠT / BLOCKED

## 1. Kết luận và thời điểm

**Không thực hiện kết nối hoặc truy vấn database.** Chưa có connection read-only được operator chủ động cấu hình/phê duyệt và chưa xác nhận DB/schema/role/visibility. Theo ràng buộc người dùng, phần live dừng tại đây và chuyển cho operator thu thập thủ công.

- Mốc rà soát artifact/source: **2026-10-18T20:06:31+07:00** (UTC: 2026-10-18T13:06:31+00:00).
- Thời điểm truy vấn live: **không có**.
- Database, schema, current_role/session_role, PostgreSQL version đã xác minh: **chưa có**.
- Connection alias/phê duyệt read-only: **chưa được cung cấp**. Không tìm hoặc dùng credential trong .env, application config hoặc lịch sử shell.
- Trạng thái G0: **BLOCKED, không PASS**. Source hợp lệ và SQL draft có guard không thay thế metadata live.

## 2. Đã đọc / phạm vi bằng chứng

Đã đọc đầy đủ schema-diff.md, mapping-inventory.json, new-column-plan.md, constraints-and-dependencies.md, risks-and-decisions.md, tests-and-rollback.md, sql/00_metadata_readonly.sql, sql/01_quality_queries_readonly.sql và validation-report.md. Hash input và source anchors lưu trong [g0-evidence-manifest.json](g0-evidence-manifest.json).

Đã đối chiếu source của 16 Entity với fingerprint inventory: **16/16 khớp baseline**. Đây chỉ chứng minh inventory source còn phù hợp, không phải MATCH với database. Không đọc application config/.env/history, không chạy app, test, Maven, psql hay client DB.

Metadata audit từng do người dùng cung cấp còn là bằng chứng lịch sử: báo thiếu user_id/entity_id/facility_code và cho biết một số thuộc tính audit_logs. Không có capture timestamp, DB/role/version và visibility được xác nhận cho lượt G0 này. Vì vậy không nâng nó thành kết quả live mới, cũng không xóa hoặc sửa nhận định lịch sử trong artifact cũ.

REF vẫn chỉ là file tham chiếu. Các 37 cột bổ sung và 2 bảng mới so với REF không được báo là thiếu live. Quyết định business phải phân biệt với cấu trúc thực tế và với code đang triển khai.

## 3. Kết quả kiểm kê cho G0

| Bảng / Entity | Field source | Field live chấp nhận | Trạng thái |
|---|---|---|---|
| audit_logs / AuditLog | 12 | Chưa thu thập | UNVERIFIED |
| business_policies / BusinessPolicy | 4 | Chưa thu thập | UNVERIFIED |
| contracts / Contract | 23 | Chưa thu thập | UNVERIFIED |
| daily_tasks / DailyTask | 13 | Chưa thu thập | UNVERIFIED |
| facilities / Facility | 9 | Chưa thu thập | UNVERIFIED |
| handover_records / HandoverRecord | 8 | Chưa thu thập | UNVERIFIED |
| inspection_records / InspectionRecord | 9 | Chưa thu thập | UNVERIFIED |
| invoices / Invoice | 12 | Chưa thu thập | UNVERIFIED |
| login_history / LoginHistory | 9 | Chưa thu thập | UNVERIFIED |
| payments / Payment | 15 | Chưa thu thập | UNVERIFIED |
| refund_requests / RefundRequest | 20 | Chưa thu thập | UNVERIFIED |
| refund_transactions / RefundTransaction | 11 | Chưa thu thập | UNVERIFIED |
| reservations / Reservation | 26 | Chưa thu thập | UNVERIFIED |
| support_tickets / SupportTicket | 16 | Chưa thu thập | UNVERIFIED |
| units / Unit | 16 | Chưa thu thập | UNVERIFIED |
| users / User | 13 | Chưa thu thập | UNVERIFIED |

Tổng **216 field = UNVERIFIED**. Không có live metadata được chấp nhận để gán các nhãn còn lại; điều đó không có nghĩa có 0 mismatch hoặc 0 extra object. staff_tasks và mọi object ngoài mapping chưa thể kiểm kê live.

- [Bảng từng field](g0-field-comparison.md): source value, live value chưa thu thập, nguồn, rủi ro, câu hỏi và bước tiếp theo.
- [Inventory JSON](g0-field-comparison.json): 216 record và historical/reference context, accepted live evidence rỗng.

## 4. Quy tắc phân loại sau khi nhận metadata

| Nhãn | Điều kiện cần trước khi gán |
|---|---|
| MATCH | Đúng target/schema/mapping, đủ visibility và cùng thuộc tính đã kiểm; không dùng để suy ra dữ liệu sạch/round-trip đúng |
| MISSING_LIVE | Catalog xác nhận table/column vắng trong schema mapping đúng, quyền quan sát đầy đủ; information_schema không trả hàng một mình chưa đủ |
| EXTRA_LIVE | Catalog live xác nhận object có nhưng không thuộc mapping/scope đối chiếu; không mặc định là lỗi hoặc đề xuất xóa |
| TYPE_MISMATCH | Type/semantics khác sau chuẩn hóa alias; phân biệt JDBC compatibility với DDL length hint. LocalDateTime/timestamptz khác ngữ nghĩa chưa tự chứng minh validation hỏng |
| NULLABILITY_MISMATCH | Nullability live đã xác minh khác mapping; giữ nguyên DB invariant, kiểm tra đường ghi trước đề xuất |
| DEFAULT_MISMATCH | Có yêu cầu DB generation/default rõ và metadata đủ chứng minh khác; Java initializer không tự là yêu cầu DEFAULT SQL |
| CONSTRAINT_MISMATCH | Definition/scope/validation live đã được review khác invariant đã chốt; 49 logical FK candidates không là 49 FK bắt buộc còn thiếu |
| UNVERIFIED | Thiếu identity/visibility/definition/thời điểm hoặc source drift; không tự đổi thành MISSING |


Một field có thể có nhiều nhãn mismatch theo thuộc tính; quyền bị hạn chế phải được ghi kèm, không dùng nhãn MATCH toàn field nếu mới biết type mà thiếu nullability/default/constraint. Không thu hẹp TEXT/varchar không giới hạn chỉ để khớp length hint 255/50; BigDecimal chưa khai precision/scale. Không đổi dữ liệu hoặc kiểu chỉ bằng so tên type.

## 5. Metadata chưa thu thập và giới hạn quyền

| Nhóm | Trạng thái / điều kiện thiếu |
|---|---|
| Identity / version / capture time | Chưa biết đúng database/schema/role/version và snapshot |
| Read-only / role scope | Chưa có operator approval, privilege proof; read_only flag hoặc tên role không tự là phê duyệt |
| Tables / columns / exact types | Chưa có catalog relation/attribute và thông tin information_schema visibility |
| Length / precision / scale / datetime precision | Chưa thu thập; NULL metadata có thể do quyền/không có dòng chứ không tự là unlimited |
| Nullability / default / identity / generated | Chưa có dữ liệu current; default/generation expression có thể chứa secret, không yêu cầu raw dump |
| PK / unique / FK / CHECK | Chưa có definition hiện hành, trạng thái validated/deferrable và mapping cột |
| Indexes | Chưa có scope, predicate/expression, unique/valid/ready được xác nhận |
| Sequences / ownership | Chưa xác minh association/owner/grants; không gọi nextval/setval |
| Trigger / policy / RLS | Chưa biết enabled/forced, roles, semantics và privileges; không lấy secret-bearing body/argument |
| Observability | Chưa biết USAGE/SELECT/catalog visibility, owner/superuser/bypass RLS hoặc phạm vi được ủy quyền |
| Extra objects / dependencies | Chưa có đủ catalog; không kết luận “không tồn tại” |

Không có lỗi permission live nào được tái hiện vì không kết nối; trạng thái đúng là **quyền chưa xác minh**, không khẳng định bị từ chối hoặc được cấp.

## 6. Hướng dẫn operator để tiếp tục G0

Xem [g0-operator-handoff.md](g0-operator-handoff.md). Operator xác nhận target và kết nối read-only có sẵn, chạy SELECT nhận diện trước; sau khi đúng scope mới thu catalog đã được duyệt. Không gửi credential/DSN/token. Trả batch đã làm sạch, thời điểm và mục chạy/lỗi/bị hạn chế.

Các snippet tối thiểu không xuất default/expression literal, trigger argument hoặc function body; vì vậy một số mục sẽ còn UNVERIFIED đến khi operator cung cấp mô tả/definition an toàn. Không chạy/export nguyên sql/00_metadata_readonly.sql chưa review: redaction theo tên cột không bảo đảm mọi literal không chứa secret.

Chưa có dữ liệu chất lượng được phép kiểm tra. **Không chạy sql/01_quality_queries_readonly.sql và không tạo/chạy query aggregate trên bảng/cột chưa xác minh.** Sau metadata và phê duyệt scope dữ liệu riêng, chỉ tạo SELECT có điều kiện tồn tại/type; không kết luận sạch từ 0 nếu RLS có thể che hàng.

## 7. Ba quyết định — đề xuất để duyệt, không tự chốt

Phân tích chi tiết source + SRS + phần chứng cứ còn thiếu ở [g0-business-decisions.md](g0-business-decisions.md).

| Chủ đề | Hiện trạng source | Hướng đề xuất | Điều kiện còn thiếu |
|---|---|---|---|
| Audit facility | record() lấy facility của actor | Ưu tiên event/target facility cho truy vết cơ sở; snapshot actor facility riêng nếu cần | User chọn semantics; lịch sử/producer/consumer chưa xác minh; đổi nghĩa cần task code riêng |
| Thời gian | LocalDateTime và nhiều nguồn now()/Clock; snapshot audit có timestamptz | Thời điểm theo instant UTC, lịch hẹn có zone cơ sở rõ, giữ nghĩa LocalDate | Metadata types/precision/session + rehearsal driver/Hibernate/round-trip và nguồn lịch sử |
| Billing/refund | Invoice → nhiều attempt; refund request theo payment; execution hiện chỉ một bằng chứng được xử lý | Invoice theo nghĩa vụ/kỳ; retry execution 1:N nếu được chốt; key theo đúng operation scope | Cardinality lịch sử, split payout hay một completed, namespace reference, payload replay, UNIQUE/FK live |

Không đủ dữ liệu thực tế hoặc hành vi PostgreSQL để xác nhận ba quyết định cuối cùng. Source review thấy replay khác payload chưa được backend kiểm fingerprint đầy đủ, client key chỉ lưu trong RAM và chưa có workflow retry refund thực sự; không coi việc thêm unique/FK là giải pháp thay các hành vi đó.

## 8. Bằng chứng source có thể kiểm tra lại

| ID | Source | Dòng | Loại bằng chứng |
|---|---|---|---|
| AUDIT_ACTOR_FACILITY | `backend/src/main/java/com/swp391/selfstorage/modules/audit/service/AuditLogService.java` | 39 | Source/SRS/decision log, không phải live |
| RESERVATION_EVENT_FACILITY | `backend/src/main/java/com/swp391/selfstorage/application/workflow/CreateReservationWorkflow.java` | 98 | Source/SRS/decision log, không phải live |
| SCOPE_BY_ACTOR | `backend/src/main/java/com/swp391/selfstorage/common/security/ActorContext.java` | 60 | Source/SRS/decision log, không phải live |
| BUSINESS_CLOCK | `backend/src/main/java/com/swp391/selfstorage/config/ClockConfig.java` | 11 | Source/SRS/decision log, không phải live |
| INVOICE_OPTIONAL_KIND | `backend/src/main/java/com/swp391/selfstorage/modules/billing/repository/InvoiceRepository.java` | 18 | Source/SRS/decision log, không phải live |
| INVOICE_RENEWAL_PENDING | `backend/src/main/java/com/swp391/selfstorage/modules/billing/service/InvoiceService.java` | 18 | Source/SRS/decision log, không phải live |
| RENEWAL_MULTI_PERIOD | `backend/src/main/java/com/swp391/selfstorage/modules/rental/service/RenewalService.java` | 84 | Source/SRS/decision log, không phải live |
| PAYMENT_KEY_GLOBAL | `backend/src/main/java/com/swp391/selfstorage/application/workflow/PayInvoiceWorkflow.java` | 58 | Source/SRS/decision log, không phải live |
| REFUND_KEY_PAYMENT_SCOPE | `backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundRequestService.java` | 83 | Source/SRS/decision log, không phải live |
| REFUND_QUOTA | `backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundRequestService.java` | 136 | Source/SRS/decision log, không phải live |
| REFUND_SINGLE_EVIDENCE | `backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundExecutionService.java` | 60 | Source/SRS/decision log, không phải live |
| REFUND_SINGLE_CONFIRM | `backend/src/main/java/com/swp391/selfstorage/modules/billing/service/RefundExecutionService.java` | 114 | Source/SRS/decision log, không phải live |
| CLIENT_VOLATILE_KEY | `frontend/src/shared/api/idempotent-request.ts` | 5 | Source/SRS/decision log, không phải live |
| SRS_AUDIT | `docs/requirements/srs.md` | 405 | Source/SRS/decision log, không phải live |
| SRS_INVOICE | `docs/requirements/srs.md` | 400 | Source/SRS/decision log, không phải live |
| SRS_ACCOUNTING | `docs/requirements/srs.md` | 367 | Source/SRS/decision log, không phải live |
| APPROVED_INVOICE_PAYMENT | `docs/requirements/decision-log.md` | 129 | Source/SRS/decision log, không phải live |
| APPROVED_REFUND_QUOTA | `docs/requirements/decision-log.md` | 168 | Source/SRS/decision log, không phải live |

Các khoảng source không có thông tin đăng nhập được đọc để phân tích. Không lấy dữ liệu khách, chi tiết chuyển tiền hoặc credential runtime. Các kết quả test logic/H2 trước đây chỉ là lịch sử, không được ghi như test G0 mới hoặc chứng minh PostgreSQL hiện tại.

## 9. Phạm vi thay đổi trong lượt này

Chỉ tạo tài liệu G0: báo cáo này, handoff operator, phân tích quyết định, field comparison JSON/Markdown và evidence manifest. Không sửa source, application config, ddl-auto, runtime SQL, migration/candidate SQL hoặc guard. Không kết nối DB, không chạy SQL/data quality/test app, không thay RLS/privilege/trigger/sequence/constraint, không commit/push. Input/source fingerprints được kiểm lại sau khi tạo báo cáo; kiểm tra này không truy vấn DB.

## 10. Câu hỏi cần operator/người dùng quyết định

1. **Kết nối G0:** operator sẽ gửi metadata đã làm sạch hay cung cấp connection handle read-only được phê duyệt sẵn? DB/schema/role mục tiêu, người phê duyệt, thời điểm và scope quan sát là gì (không gửi credential)?
2. **Audit facility:** chọn event/target facility và lưu actor facility riêng khi cần, hay tiếp tục actor-facility? Scope toàn chuỗi và chuyển nhân sự được biểu diễn thế nào?
3. **Thời gian:** chốt instant UTC + timezone cơ sở cho lịch hẹn không? Ai xác nhận timezone lịch sử và phạm vi rehearsal PostgreSQL riêng trước khi thay mapping?
4. **Billing/refund:** Invoice theo nghĩa vụ/kỳ, nhiều Payment attempt; refund execution cho retry 1:N với tối đa một completed hay được chia nhiều đợt chi? Chốt scope key/reference và replay khác payload trả 409 trước khi duyệt constraint.
5. **Dữ liệu thực tế:** sau metadata, có cho phép một scope aggregate kiểm tra lịch sử/duplicate/quota riêng không? Role đó có quan sát đầy đủ hay bị RLS giới hạn?
