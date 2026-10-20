# Đồng bộ schema staging, giữ nguyên backend

Người dùng đã chọn bổ sung schema bằng migration và giữ nghiệp vụ/mapping hiện tại.
Đây là nhóm migration manual mới; không bỏ guard hoặc chạy các draft cũ ngày 18/10,
không chạy `001_scope_extensions.sql`, không thêm Flyway hay đổi `ddl-auto=validate`.

## Phạm vi cụ thể

| File | Thay đổi | Giới hạn |
|---|---|---|
| 002_align_backend_mapping.sql | 37 cột nullable trên audit_logs/units/reservations/contracts/payments/refund_requests; hai bảng invoices/refund_transactions với PK | Không default/backfill giả; không đổi kiểu/NOT NULL/cột legacy hoặc sequence |
| 003_auth_identity_uniqueness.sql | Unique lower(username), lower(email), phone sau bỏ ASCII space/dot/hyphen; NULL/blank phone không là số đăng ký hợp lệ | Theo cách source kiểm tra hiện tại; giữ unique cũ; không UPDATE dữ liệu |
| 004_reservation_no_show_status.sql | Thay đúng reservations_status_check đã xác minh để thêm NO_SHOW, giữ mọi trạng thái cũ | Chỉ chạy nếu definition cũ khớp chính xác; không quét/drop CHECK khác |

Hai bảng mới bật RLS và revoke quyền kế thừa mặc định của PUBLIC/anon/authenticated/service_role
trong cùng transaction tạo bảng. Backend dùng owner postgres đã được operator cấu hình,
không cần direct Supabase client truy cập bảng. Không đổi ACL/RLS/policy trên bảng cũ
hoặc default privileges toàn schema. Nếu tương lai dùng app role khác, phải duyệt grants riêng.

Ba cột audit giữ nghĩa source: user_id là actor, entity_id là đối tượng, facility_code
là chi nhánh actor; không biến nó thành chi nhánh đối tượng bằng schema. Các cột thời gian
mới theo LocalDateTime hiện tại là timestamp without time zone; existing timestamptz giữ nguyên.
Không tạo FK/cardinality/unique billing suy diễn từ scalar IDs. Những quyết định đó cần review riêng.

## Preflight và diễn tập đã thực hiện

- DB staging: PostgreSQL17.11, postgres/public, routing user postgres.xnerbsgbwdpemvnatvuy
  qua Session pooler operator cung cấp; effective current_user/session_user postgres.
- SELECT aggregate: 9 user; không có nhóm trùng lower(username), lower(email), normalized phone;
  không phone null/blank hoặc ASCII whitespace ngoài space trong capture này. Không xuất giá trị hàng/PII/hash.
- SHA-256 16 Entity source khớp inventory baseline. Mọi Entity/Service/Repository/Controller được giữ nguyên trong bước migration.
- Rehearsal **trên chính staging trong transaction rồi ROLLBACK**, không phải database clone:
  2026-10-19T05:31:24Z–05:31:48Z (12:31 giờ Việt Nam), 48 statement migration.
- Hibernate thật của backend validate đủ16 Entity thành công trên schema chưa commit.
- ORM User.created_at/LocalDateTime → timestamptz: write/read và kiểm epoch UTC đạt tại DB timezone UTC
  và Asia/Ho_Chi_Minh, JVM UTC + JDBC UTC. Chỉ fixture tổng hợp, rollback về savepoint;
  không tạo tài khoản lịch sử thật hoặc gửi OTP. Chưa suy rộng sang mọi luồng/time producer.
- Cả ba unique index từ chối đúng fixture trùng, SQLSTATE23505 và đúng index name.
  Chưa chạy race API giữa nhiều process; không đánh dấu concurrent registration PASS.
- RLS hai bảng mới bật; SELECT/INSERT/UPDATE/DELETE của anon/authenticated/service_role đều không có quyền.
- Row counts trước/sau fixture và migration: audit7, contracts1, payments2, refund_requests0,
  reservations1, units18, users9; không thay đổi. Không đọc/export bản sao dữ liệu cá nhân.
- Rollback khôi phục chính xác179 cột public trước đó; hai bảng và ba index mới không còn sau rehearsal.
  Trong rehearsal, 239 cột public sau bổ sung; mọi kiểu/nullability/identity cột cũ giữ nguyên.

Evidence nằm trong Git-ignored `artifacts/auth-staging/auth-uniqueness-preflight.json`
và `migration-rehearsal.json`. Đây không phải full data backup hoặc kiểm thử toàn hệ thống.

## Cơ chế thực thi

`scripts/db-verification/SchemaAlignmentRunner.java` chỉ chạy khi operator gọi explicit.
Config chỉ đọc từ file riêng user đã cung cấp, không xuất credential. Target được pin đúng
project/host/port/user/database. Dùng source checks + catalog baseline để dừng nếu schema drift.

Nhóm 002→003→004 chạy trong một transaction có advisory lock, lock_timeout5s,
statement_timeout45s; khóa ghi các bảng liên quan theo thứ tự cố định. Không retry mù khi timeout.
Với staging chỉ9 user, unique index chạy transaction thông thường; không dùng cách này như
khuyến nghị index build trên production lớn cần online/concurrent migration được thiết kế riêng.

Mode rehearsal luôn rollback sau kiểm tra. Mode apply yêu cầu một rehearsal thành công và
hash cả ba SQL file không đổi; kiểm lại pre-state và source, chạy lại assertions trước COMMIT.
Hibernate dùng borrowed Connection adapter chặn commit outer transaction; test ORM chỉ rollback
savepoint fixture. Không tự khởi chạy business scheduler/seed trong runner.

Sau COMMIT phải đọc lại metadata và thử startup Spring Boot thực tế. Chỉ sau review auth gate mới
bật AUTH_SCHEMA_REVIEWED trong private runtime config để tiếp tục OTP/đăng ký/đăng nhập.
Migration không tự bật flag, không gửi email, không sửa config/source và không tự chạy khi app start.

## Rollback và giới hạn cutover

Trước COMMIT: bất kỳ assertion/DDL/unique/lock failure đều rollback toàn nhóm; không có backfill/DML lịch sử.
Sau COMMIT: không drop cột/bảng/index để rollback. Dừng writer/đặt schema-reviewed=false nếu cần,
giữ scheduler tắt, quay về app tương thích schema mở rộng, điều tra và sửa tiến bằng migration mới.
Không xóa invoice/refund/evidence hoặc dữ liệu mới. Destructive down migration không được cung cấp.

Legacy hợp đồng/reservation/payment vẫn thiếu lịch hẹn/ownership/snapshot đã xác minh; NULL được giữ.
Không bật scheduler hoặc tuyên bố Flow1/2/billing/refund sẵn sàng chỉ vì Hibernate validate đạt.
Chưa nghiệm thu policy expressions của bảng cũ, production least privilege, toàn bộ time producers,
billing idempotency/FK/cardinality, hoặc audit event-facility reporting. Giữ các hạng mục đó riêng.

Trạng thái COMMIT thực tế và startup/API được ghi tiếp trong
`docs/testing/schema-migration-execution-20261019.md`; tài liệu này mô tả phạm vi và proof rehearsal.
