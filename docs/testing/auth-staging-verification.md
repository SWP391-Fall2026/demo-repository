# Kiểm tra staging auth — kết nối đạt, API còn BLOCKED

> Snapshot **trước migration**. Người dùng sau đó đã chọn bổ sung schema;002/003/004
> đã COMMIT ngày19/10, Hibernate16Entity và startup đạt. Catalog sau migration không còn field thiếu.
> Trạng thái hiện tại: [execution report](D:/SWP/storage-rental/docs/testing/schema-migration-execution-20261019.md).
> SMTP email thật đang từ chối xác thực; không coi các blocker cột dưới đây là trạng thái sau migration.

Capture metadata bắt đầu: **2026-10-19T05:05:57.772671400Z** (12:05:57 giờ Việt Nam).
Có bằng chứng metadata và lỗi startup validate; chưa có PASS đăng ký/đăng nhập/OTP end-to-end.

## Bằng chứng thực tế

| Bước | Kết quả | Giới hạn kết luận |
|---|---|---|
| Kiểm cấu hình riêng, 05:02:05Z | Target khớp host/port/database/user người dùng cung cấp; SSL require; email mode; JWT/SMTP có cấu hình | Không chứng minh credential hợp lệ hoặc SMTP hoạt động |
| JDBC metadata probe, 05:02:25.592725600Z | FAILED_NO_SCHEMA_OR_DATA_WRITE; PSQLException → UnknownHostException; SQLSTATE 08001 | Thất bại trước xác thực; không có PostgreSQL session hoặc metadata |
| DNS của direct endpoint sau lỗi JDBC | Không có A address; có AAAA address | Bằng chứng DNS của lần kiểm tra này, không phải lỗi password |
| Tuyến IPv6 của máy kiểm thử | Không có default route `::/0` | Direct endpoint không sử dụng được trên mạng hiện tại |
| Chuyển Session pooler | User cung cấp host/port/database/user; chỉ URL/username trong file riêng được sửa | Giữ nguyên password/JWT/SMTP, không xuất secret |
| JDBC Session pooler | METADATA_COLLECTED_READONLY, 19 nhóm catalog đều OK | Không đọc hàng nghiệp vụ, không ghi dữ liệu/schema |
| Identity do DB trả về | Database postgres, schema public, role postgres, PostgreSQL17.11; timezone UTC | Routing username khác current_user PostgreSQL |
| Isolation | repeatable read, transaction_read_only=on, kết thúc rollback | Không thay thế review quyền hoặc kiểm thử dữ liệu |
| Visibility | Owner postgres trên 16 relation public; role BYPASSRLS; hai catalog cùng 179 cột | Không chứng minh Supabase anon/authenticated hoặc Spring RBAC cách ly đúng |
| SSL | JDBC yêu cầu sslmode=require; pg_stat_ssl ở backend trả ssl=false | Qua pooler, catalog này không xác minh TLS client→pooler hoặc mã hóa toàn tuyến |
| Spring Boot startup validation | Thực thi, process exit1; Hikari kết nối đạt; SchemaManagementException: missing column entity_id in audit_logs | Backend chưa khởi động hoàn tất; đây là lỗi runtime đã chứng minh, Hibernate chỉ báo lỗi đầu tiên |
| API/Postman/UI đăng ký, OTP, đăng nhập | NOT-TESTED / BLOCKED | Backend startup thất bại; chưa chạy Vite cho lượt live, chưa gửi OTP |

Target mới user cung cấp và đã kết nối: project `xnerbsgbwdpemvnatvuy`, host
`aws-0-ap-northeast-1.pooler.supabase.com`, port5432, database `postgres`, schema `public`,
routing user `postgres.xnerbsgbwdpemvnatvuy`, staging/Session pooler/SSL require.
Database xác nhận current_user `postgres`; chưa thu riêng session_user hoặc toàn role inheritance graph.

File riêng do user chỉ định: `D:/SWP/storage-rental/storage-rental-secrets/backend.env`.
Nội dung là Java Properties; không xuất giá trị secret và không dùng shell để source file.
Đường dẫn nằm trong checkout nhưng `/storage-rental-secrets/` đã được Git ignore;
không được add/commit file này. Địa chỉ nhận OTP đã được user chủ động chỉ định;
không lưu địa chỉ cá nhân vào artifact chia sẻ này.

Evidence JSON cục bộ được Git ignore:

- `artifacts/auth-staging/config-inspection.json`: kiểm cấu hình direct trước khi đổi pooler.
- `artifacts/auth-staging/live-metadata.json`: lỗi direct; không phải schema snapshot.
- `artifacts/auth-staging/session-pooler-metadata.json`: capture catalog thành công; policy expressions/default nhạy cảm được che.
- `artifacts/auth-staging/field-comparison.json`: đối chiếu offline, có hash capture và kiểm fingerprints source.
- `artifacts/auth-staging/backend-startup-evidence.json`: trích xuất lỗi schema và exit code, không secret.
  Log thô `backend-startup.private.log` chỉ cục bộ/Git ignore, không đưa vào báo cáo chia sẻ.

## Blocker đã xác minh từ live

Xem [bảng 216 field](D:/SWP/storage-rental/docs/testing/auth-staging-schema-diff.md).

- Thiếu hai bảng `invoices`, `refund_transactions` (23 field mapping).
- Thiếu 37 cột trên sáu bảng hiện có: audit_logs3, contracts3, payments4,
  refund_requests10, reservations13, units4. Tổng 60 field MISSING_LIVE,
  không phải 60 ALTER COLUMN trên bảng hiện có.
- users có UNIQUE(username), UNIQUE(email) thông thường; không có unique phone/canonical-phone
  hoặc lower(username/email). Precheck service không đủ chống race; collisions legacy chưa kiểm.
- Sáu LocalDateTime map với timestamptz cần chứng minh UTC round-trip. DB timezone UTC chưa đủ.
- Có 35 chênh lệch nullability (DB chặt hơn mapping) và 27 giới hạn chuỗi ngắn hơn hint JPA;
  không tự nới constraint hoặc khẳng định mọi khác biệt gây lỗi Hibernate.
- Hai relation ngoài JPA: notifications, staff_tasks; giữ nguyên cùng các cột legacy.

Không bỏ Entity khỏi persistence unit hoặc đổi ddl-auto để né lỗi. Startup đã xác nhận lỗi đầu tiên:
`Schema-validation: missing column [entity_id] in table [audit_logs]`.
Lượt khởi động dùng auth-supabase, ddl-auto=validate, generate-ddl=false, sql.init.mode=never,
Hikari read-only=true, schema-reviewed=false, scheduler=false, JVM timezone UTC;
không local seed profile. Backend exit1 và chưa khởi động hoàn tất. API/runtime auth vẫn NOT-TESTED.

## Kế hoạch tiếp tục — CHƯA PHÊ DUYỆT / CHƯA ÁP DỤNG

1. Review additive shape theo draft: audit3 cột; rental/inventory20 cột;
   billing14 cột + hai bảng23 field. Không sửa/xóa legacy hoặc backfill lịch sử giả.
   [Các draft SQL hiện có](D:/SWP/storage-rental/docs/drafts/schema-alignment-20261018/validation-report.md).
2. Chốt ACL/RLS hai bảng mới trước tạo: default ACL live của owner postgres cấp quyền bảng
   cho anon/authenticated/service_role. Không mặc định Spring RBAC đủ bảo vệ bảng mới.
   Draft billing chưa là bản triển khai hoàn chỉnh; giữ guard RAISE EXCEPTION và rollback.
3. Review canonical constraint auth, sau approval mới chạy aggregate quality queries không PII
   và chuẩn bị unique thích hợp. Không tự xóa duplicate/chuẩn hóa dữ liệu có sẵn. Quality queries chưa chạy.
4. Rehearsal trên PostgreSQL thử nghiệm: full Hibernate validate; UTC round-trip; NOT NULL/length/default/ID;
   concurrent duplicate username/email/phone; transaction/OTP consume và phạm vi quyền.
5. Duyệt artifact triển khai riêng trước DDL staging. Quyền tạo tài khoản test không tự là quyền migration.
   Draft ngày 18/10 vẫn có guard, chưa chuyển thành script chạy được.
6. Sau schema gate mới khởi chạy profile auth-supabase, không seed/job; chạy fixture tổng hợp
   đăng ký → OTP email được phép → verify → login → me và UI. Tách assertions HTTP/DB/browser.

## Quyết định và bằng chứng còn thiếu

- Audit facility_code: source lấy chi nhánh actor; event-facility là nghĩa khác, không tự đổi bằng DDL.
- Time: UTC intent chưa thay thế rehearsal LocalDateTime/timestamptz; không tự cast lịch sử.
- Billing/refund: invoice cardinality, retry và phạm vi khóa idempotency trước FK/unique.
- ACL/RLS mới, canonical auth unique và dữ liệu legacy/collisions.
- Chưa review đầy đủ CHECK/index/sequence ownership với business, policy expressions đang được che.
- Startup đã thực thi và thất bại vì schema; chưa SMTP/API/Postman/browser hoặc rehearsal PostgreSQL. **G0/G4 chưa đạt**.

Đã có phạm vi cho phép tạo tài khoản thử nghiệm/ghi auth-nghiệp vụ; không cần xin lại phạm vi đó.
Chỉ dùng file user chỉ định, không dò config khác/history. Không chạy migration, DDL/DML,
quality query, thay RLS/privilege, commit hoặc push. Báo cáo G0 ngày 18/10 là snapshot lịch sử;
checkpoint này bổ sung bằng chứng live mới, không tự nâng G0/G4 thành đạt.
