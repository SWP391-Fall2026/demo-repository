# Thực thi đồng bộ schema staging — 2026-10-19

Trạng thái: **APPLIED_COMMITTED; Hibernate validate và Spring Boot startup đạt**.

Người dùng chọn giữ nghiệp vụ/mapping backend và bổ sung schema bằng migration.
Phạm vi, SHA/proof rehearsal, cơ chế transaction và rollback nằm trong
[hướng dẫn](D:/SWP/storage-rental/docs/guides/schema-alignment-20261019.md).

Rehearsal trên staging 05:31:24Z–05:31:48Z đã thực thi48 statement rồi rollback;
validate16 Entity, unique rejection3 case, ORM timestamp UTC/hai DB timezone đạt.
Mọi fixture tổng hợp được rollback; không gửi OTP. Đây không phải PASS API hoặc database clone test.

## Thực thi đã xác minh

Apply bắt đầu 2026-10-19T05:33:22.797481800Z, hoàn tất/COMMIT 05:33:44.822586800Z
(12:33:44 giờ Việt Nam). 48 statement của002→003→004 chạy trong một transaction.
Runner kiểm lại target, source fingerprint, catalog179cột, definition CHECK cũ và hash
SQL khớp rehearsal trước khi ghi; kiểm lại Hibernate/fixtures/quyền/row counts trước COMMIT.

| File | SHA-256 đã rehearsal và apply |
|---|---|
| 002_align_backend_mapping.sql | 3700c90cfc20aa34acdd0f1379ee40c2442d69a791eb0333226b98f897630d6c |
| 003_auth_identity_uniqueness.sql | 1c2a6a37c77f19ac75d1384293886f73d000e42367d9deed0299d0f14d9ec513 |
| 004_reservation_no_show_status.sql | 7196228bb85bf4d085bb138313e5287d7321ec1d2a52ec4ea5181bddb202c3e4 |

Đọc lại catalog độc lập bắt đầu 05:34:24.987263100Z:19 nhóm OK,18 relation/239cột public;
đủ216field của16Entity, **0 field mapping thiếu**. Hai bảng mới và ba unique index đã tồn tại;
CHECK reservation giữ các trạng thái cũ và thêmNO_SHOW. ACL/RLS mới được kiểm tra trực tiếp
trong runner, không có quyền data cho anon/authenticated/service_role trên hai bảng mới.

Số dòng bảy bảng bị khóa trước/sau: audit7, contracts1, payments2, refund_requests0,
reservations1, units18, users9. Fixture ORM/unique được rollback toàn bộ. Kiểu/nullability/
identity của179cột cũ giữ nguyên. Không thực thi backfill hoặc sửa giá trị lịch sử.

Spring Boot sau đó khởi động thành công trên port8080 với `auth-supabase`, JVM UTC,
ddl-auto=validate, generate-ddl=false, SQL init=never, scheduler=false, không profilelocal.
Chỉ phiên runtime đã review này bật app.auth.schema-reviewed=true qua CLI;
file riêng vẫn AUTH_SCHEMA_REVIEWED=false, source/config mặc định không bị nới.
Backend có quyền ghi fixture auth theo scope người dùng; RLS bằng owner không chứng minh RBAC/API đúng.

## Kiểm tra auth sau migration

React/Vite chạy tại127.0.0.1:5173, proxy đến127.0.0.1:8080. HTTP smoke dùng URL/request
từ Postman collection có sẵn nhưng được thực thi bằng Node HTTP, **không phải Postman runner**.

Đã đạt5assertion: anonymous /me401; trang /register được Vite phục vụ;
Vite proxy /api/auth/me401; password74byte UTF-8 bị chặn400 với thông tin72byte;
confirmPassword bị trim khác raw password bị chặn400.

OTP email thật trả503: kiểm tra SMTP connection/auth riêng không gửi thêm email xác nhận
AuthenticationFailedException, status525/5.7.1. Không suy ra chỉ password sai; có thể cần
operator sửa credential hoặc cấu hình phía provider. Chưa tuyên bố SMTP/email OTP đạt.
Kiểm tra DB riêng chỉ trả aggregates: fixture chưa có tài khoản hoặc login_history
(count0), không lưu account khi gửi OTP thất bại. OTP verify/raw login/JWT/profile thực tế
của fixture email này còn BLOCKED chờ SMTP hợp lệ; không hạ tiêu chí xuống mock/email giả.

### Direct recheck 17:09–17:15 giờ Việt Nam

- Build backend hiện tại đạt với test bị skip; frontend production build và contract checker đạt.
- Backend `auth-supabase` khởi động trên127.0.0.1:8080, Hibernate validate đạt với
  PostgreSQL staging, schema gate chỉ bật bằng CLI cho phiên chạy, scheduler/DDL/SQL init tắt.
- Request trực tiếp, không H2/OTP mock: anonymous `/me`401; synthetic staging login200;
  JWT đúng86400giây; `/me`200 và đúng user/role CUSTOMER; biến thể mật khẩu bị trim trả401.
- Trên cùng fixture staging, `LOCKED` và `DISABLED` đều làm login401 và token cũ gọi
  `/me`401; `finally` khôi phục `ACTIVE`, login sau khôi phục trả200.
- `send-otp` email thật trả503. Probe SMTP ngoài sandbox đi tới Brevo và nhận
  `525 5.7.1 Unauthorized IP address`; không phải lỗi DNS hay lỗi mapping API.
- Read-only aggregate sau lỗi xác nhận fixture_account_count=0,
  matching_customer_profile_count=0 và login-history count=0. Không có user dở dang.
- Evidence cục bộ Git-ignore: `smtp-direct-recheck.json` và
  `auth-direct-email-db-check.json`. Không xuất credential, OTP hoặc JWT.

Evidence Git ignore: migration-rehearsal.json, migration-applied.json,
post-migration-metadata.json, backend-runtime.private.log, auth-http-smoke.json,
smtp-connection-evidence.json, auth-before-otp-db.json trong artifacts/auth-staging.
Không chia sẻ log/private fixture vì có thể chứa PII; báo cáo này chỉ chứa số đếm và trạng thái.

## Phạm vi chưa được nghiệm thu

G0 kiểm kê cột và startup đã có bằng chứng, nhưng không tự đánh dấu toàn bộ G0–G4 đạt.
Race API, browser E2E, toàn bộ role/status, dữ liệu legacy, scheduler/Flow1/2,
billing/refund cardinality và toàn bộ timestamp producer chưa được chứng minh bằng lượt này.
Giữ scheduler tắt, không tự bịa dữ liệu NULL, không drop cột/bảng/index sau COMMIT.

Không đổi Entity/Service/Repository/Controller, ddl-auto, mapping thời gian hiện có hoặc dữ liệu lịch sử.
Không chạy001 hoặc bỏ guard các draft cũ. Không commit/push Git.
