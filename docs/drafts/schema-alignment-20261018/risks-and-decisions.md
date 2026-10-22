# Rủi ro và quyết định cần chốt trước triển khai

## AuditLog — giữ module mới

Nguồn: `modules/audit/entity/AuditLog.java`, `modules/audit/service/AuditLogService.java:26`, `modules/audit/repository/AuditLogRepository.java`, SRS NFR-010/FR-006 và danh sách AuditLog trong SRS. Module hiện trả entity trực tiếp qua GET `/api/audit-logs`, chỉ Admin đọc.

| Trường | Nghĩa có bằng chứng trong code | Đề xuất trong bản nháp | Còn cần xác nhận |
|---|---|---|---|
| user_id | ActorContext.current().id, actor từ principal/User đang ACTIVE | VARCHAR(255) theo mapping String; nullable lịch sử, không DB default | FK users/retention lịch sử; không đoán ID từ user_name |
| entity_id | ID đối tượng caller truyền; nhiều loại thực thể, cả policy key | VARCHAR(255), nullable lịch sử; không FK đa hình giả | Cần entity_name theo SRS trong phần hoàn thiện audit sau; không tự thêm vào scope schema hiện tại |
| facility_code | `u.getFacilityCode()` của actor, không lấy từ đối tượng nghiệp vụ | VARCHAR(255), nullable; **giữ ngữ nghĩa actor-facility để không mâu thuẫn code đang bị đóng băng** | Nếu yêu cầu báo cáo theo facility của sự kiện, cần future API/service thay đổi được duyệt; không coi column mới đã thỏa yêu cầu đó |
| time_str / time_display | Mapping ghi time_str; time_display là legacy ngoài entity | Giữ cả hai; không rename/drop/cast tự động | Producer/consumer và format lịch sử; không biến “Hôm nay” thành timestamp giả |
| ip / ip_address | Mapping ghi ip với literal SERVER; ip_address không được service ghi | Giữ cả hai; không backfill default loopback thành IP thật | Dùng request IP/proxy tin cậy cần thay code riêng; trigger live có đồng bộ hai cột không? |
| created_at | LocalDateTime.now() trong entity/constructor; DB live timestamptz default now() | Chưa chuyển kiểu Java/SQL trong draft | Chốt timestamp là instant UTC, kiểm tra dữ liệu cũ và round-trip trước migration thời gian |

VARCHAR(255) là cơ sở mapping của ba field mới, không phải đề xuất đổi mọi user ID/cột hiện có thành 255. User.id/Facility.code trong code có hint 50; phải kiểm tra live PK types. FK chuỗi không yêu cầu độ dài hint giống hệt để đọc/ghi, nhưng không tự thu hẹp dữ liệu cho “đẹp”.

Không thêm NOT NULL cho actor-facility: Customer/Ops/Admin có thể không có chi nhánh gán. Nếu đổi sang event-facility, các sự kiện toàn hệ thống vẫn có trường hợp không thuộc một facility. Chưa có bộ lọc backend theo ba cột này, không tự tạo index audit mới chỉ để bỏ lỗi validate.

SRS còn đòi old_value/new_value/entity_name và IP thật. Hiện entity/service chưa đầy đủ, status audit luôn SUCCESS ngay cả action PAYMENT_FAILED. Chỉ sửa schema ba cột không hoàn thành audit nghiệp vụ; các thay đổi đó cần task code/spec riêng sau phê duyệt.

## Timestamp và timezone — blocker

- Mapping LocalDateTime là JDBC TIMESTAMP không mang offset; REF `users.created_at`, `reservations.created_at`, `contracts.created_at`, `payments.created_at`, `support_tickets.created_at` là timestamptz, còn audit.created_at có bằng chứng LIVE timestamptz. Các trường còn lại có DATE hoặc TIMESTAMP without time zone theo từng field trong matrix.
- JDBC config UTC không biến LocalDateTime thành instant. Audit/Policy/Invoice/Auth/Task còn gọi now() theo JVM, nhiều workflow dùng Clock Asia/Ho_Chi_Minh. Phải xác nhận timestamp ý nghĩa/zone của producer cũ và mới.
- Không sửa schema timestamptz thành timestamp chỉ để validate. Không tự chọn `AT TIME ZONE` cho toàn bộ lịch sử. Hướng ưu tiên để duyệt là timestamp sự kiện dùng Instant/OffsetDateTime + timestamptz, còn lịch hẹn giờ địa phương cần timezone business rõ; hướng này có thay Java nên **ngoài phạm vi thay đổi được phép hiện tại**.
- Nếu chưa cho phép sửa Java, cần chứng minh mapping hiện tại tương thích đúng với driver/dialect trên PostgreSQL thử nghiệm; nếu không chứng minh được thì schema-only plan bị BLOCK. Chưa kết luận mismatch TIMESTAMP chắc chắn gây validation error; JDBC type equivalence còn cần kiểm tra thực tế.

## NOT NULL, default, length và numeric

- Nhiều field JPA để nullable mặc định nhưng REF bắt buộc NOT NULL: audit.user_name/role/action/detail; reservation.start_date/deposit_amount; contract ngày/giá/cọc; payment.invoice_type/amount; ticket.customer_name/category/description; business_policy.policy_value/updated_at; handover/inspection/refund core fields. Matrix ghi từng field. Không nới constraint theo thiếu annotation.
- `@Column(length=...)` không phải @Size và không tự chặn request dài. Audit.detail hint 1000; nhiều String khác 255, ID core 50; REF nhiều VARCHAR không giới hạn và TEXT. Không thu hẹp TEXT/varchar vô hạn hoặc cắt chuỗi, kể cả để matching hint. Cần max length và kiểm tra client payload/user-agent/reason/snapshot/notes/description.
- BigDecimal không khai báo precision/scale. REF NUMERIC không giới hạn; candidate cũ dùng numeric(38,2). Bộ mới để NUMERIC không giới hạn với cột/bảng mới, chưa chọn làm tròn. Chốt tiền VND và diện tích riêng; không ép mọi numeric thành hai chữ số hoặc số nguyên.
- Java init ACTIVE/PENDING/NORMAL/LocalDateTime.now() khác DEFAULT SQL. Các constructor/service có thể ghi NULL hoặc override init. Giữ default hiện có trước khi hiểu consumer ngoài JPA; không dùng default để tạo lịch sử giả.
- users.email_verified, support_tickets.feedback, login_history.login_time/ip_address, audit.time_display/ip_address và toàn bộ staff_tasks nằm ngoài entity. Phải kiểm tra NOT NULL/default/trigger/consumer; tuyệt đối không xóa do code chưa dùng.
- Unit PIN có default nhạy cảm ở REF; chỉ kiểm tra có default qua metadata redacted. Không xuất giá trị, không thay mã đang dùng, không seed hoặc cấp mã truy cập bằng migration.

## ID, sequence và unique

- 15 entity dùng String ID do ứng dụng cấp (prefix + UUID, facility/unit code hoặc policy key); LoginHistory constructor cấp ID chuỗi. Không đổi tất cả thành PostgreSQL UUID hoặc sequence. 1 entity AuditLog dùng Long/IDENTITY.
- Audit metadata user cung cấp có bigint + nextval sequence; chưa biết sequence ownership/grants/last_value/cache/max ID. Legacy SQL SERIAL khác nguồn này. Không reset sequence hoặc gọi nextval trong query kiểm chứng; gaps do cache/rollback không phải bằng chứng mất audit.
- Exact UNIQUE của users.username/email có bằng chứng JPA và REF; LIVE chưa biết. Code lowercases đầu vào nhưng không đồng nghĩa có case-insensitive unique trên database. Kiểm tra casefold/collation và chốt trước bất kỳ chuẩn hóa dữ liệu nào.
- Các unique khác chỉ là candidate theo code Optional/idempotency/cardinality, cần review riêng trong dependency doc. Không tự xóa duplicate, sửa key, gom invoice hoặc chọn bản ghi đầu tiên.

## Transaction, khóa và hậu quả cutover

- Có 7 pessimistic-lock JPQL query cho Facility, Unit, Reservation, Contract, Invoice, Payment và RefundRequest. Không thấy native SQL; không có @Version. PostgreSQL behavior, thời gian chờ và deadlock không được chứng minh bằng H2.
- Create/assign capacity dùng khóa facility; thu tiền khóa invoice; các thao tác refund khóa Payment gốc rồi RefundRequest. Kiểm thử cùng payment/refund/invoice, callback/retry và nhiều request khác key. FK/index mới có thể thay đổi locking/write cost.
- Refund quota là tổng nhiều hàng: pending giữ requested_amount; approved/evidence/completed giữ hoặc tiêu approved_amount. Không dùng row CHECK đơn lẻ để thay invariant tổng. Unique key không thay thế kiểm tra tổng hạn mức.
- Audit save nằm trong transaction của nhiều workflow; lỗi audit có thể rollback nghiệp vụ tiền/kho. Tất cả mapping phải tương thích trước khi writer chạy, không chỉ audit.
- Existing paid rows thiếu user_id/facility_code/invoice_id có thể biến mất khỏi scope Customer/Manager sau khi cột mới thêm NULL. Invoice lịch sử không thể tạo một-một từ Payment: Payment gồm FAILED/retry và nhiều lần thử của cùng receivable. Cần chứng từ/grouping có căn cứ, không tổng hợp từ giá hiện hành.
- Refund legacy thiếu payment/actor/proof không được tạo payment giả hoặc bằng chứng giả. Không tự chuyển APPROVED thành COMPLETED, không đánh dấu giao dịch gốc được hoàn chỉ bằng suy đoán.
- RentalExpiryJob bỏ qua end_at NULL; AccessCodeService kiểm tra end_at; Handover cần monthly_price_snapshot. Active contract/reservation thiếu dữ liệu mới là blocker nghiệp vụ, dù DDL validate đã qua.
- ReservationMonitoringJob có thể EXPIRE đơn và cập nhật Invoice; lịch hẹn chính thức và trạng thái cũ phải được đối soát trước cutover. Chưa có maintenance flag/job-disable đã được chứng minh trong code; không tự giả định một property Spring chung sẽ tắt @EnableScheduling.
- Freeze/suspend tất cả writer liên quan (backend, scheduler, client trực tiếp, operator script), không chỉ một process. RLS có thể làm query chất lượng báo 0 giả; vai trò kiểm toán cần nhìn đầy đủ.

## Privilege/RLS và cấu hình

- Hai bảng mới cần ACL/RLS được review **trong cùng transaction tạo bảng trước commit**, xét default privileges và role backend/API Supabase. Không copy public-access policy từ legacy schema; không tự bật RLS mà thiếu policy/role vận hành, cũng không để mặc định rồi coi Spring RBAC đã đủ.
- Mapping @Table không chỉ rõ schema; M01 phải xác nhận default schema/search_path và đúng Supabase project/pooler database, không chỉ TCP kết nối.
- `application-local.properties` hiện URL chứa tham chiếu biến mật khẩu, driver H2, ddl-auto=create-drop; main vẫn validate. Không chạy profile local để vượt lỗi. Cần được phê duyệt sửa cấu hình/harness trước thử nghiệm. Không ghi giá trị secret vào tài liệu.
- Không có Flyway/Liquibase runtime được cấu hình trong POM; file SQL hiện có không chứng minh đã áp dụng. Mọi promote vào pipeline, quyền deploy và ledger migration phải được duyệt riêng.

## Review candidate 001_scope_extensions.sql hiện có

Không sửa hoặc chạy file này. Nó add thiếu theo REF bằng IF NOT EXISTS nhưng không xác minh shape sẵn có; có vòng quét/xóa CHECK chứa status (có thể loại cả invariant phức tạp), khóa numeric(38,2), áp unique cardinality chưa đối soát, và không cung cấp reconciliation lịch sử/ACL/timezone đầy đủ. Vì vậy không dùng nó làm giải pháp một lệnh cho lỗi audit. Bộ draft mới không nối tiếp/chạy cùng file đó.

## Quyết định phải có trước deploy

1. Live schema/version/role và quyền nhìn dữ liệu của người thu thập metadata.
2. Giữ actor-facility hay chuyển event-facility (thay code riêng) cho audit; retention FK.
3. Mô hình thời gian và nguồn backfill từng field, không giả 00:00/now().
4. Precision/scale tiền/diện tích, giới hạn request và cách giữ chuỗi dài.
5. Invoice cardinality, scope transfer reference và nhiều lần thực hiện/đính chính refund.
6. Bằng chứng đối soát ownership/snapshot/receivable/refund và ngưỡng chấp nhận NULL.
7. Chính sách ACL/RLS cho hai bảng mới, maintenance/cutover và rollback artifact được kiểm chứng.
