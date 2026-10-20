# Đăng ký / đăng nhập — checkpoint implementation 2026-10-19

> Trạng thái staging trước đó: login trực tiếp đạt; OTP email trả503 vì Brevo chặn IP. Thay đổi hiện tại dùng `OtpGenerator` trong Java rồi gửi mã qua SMTP; mã không nằm trong API response. Cần build/restart backend sau thay đổi này; chưa có bằng chứng runtime mới.

Trạng thái hiện tại: backend package đạt (test được skip theo yêu cầu chạy trực tiếp), frontend production build và contract checker đạt. Backend `auth-supabase` đã startup/validate thành công trên schema staging sau migration. Direct HTTP xác nhận login/JWT/profile, mật khẩu raw và trạng thái `LOCKED`/`DISABLED`; fixture đã được khôi phục `ACTIVE`. Đăng ký end-to-end còn BLOCKED duy nhất tại email delivery vì Brevo chưa cho phép IP hiện tại. Kết quả23 backend +7 frontend unit trước đó vẫn là LOCAL-UNIT evidence riêng; không dùng chúng thay cho lượt staging này.

## Delta source

- FR-001: validate/confirm raw; password max72byte UTF-8 đã được người dùng xác nhận; hash raw trước staging OTP, không giữ plaintext password trong pending; whitespace-only bị chặn.
- Pending chỉ một challenge/email; verify consume bằng ConcurrentHashMap.compute, gọi service transaction riêng saveAndFlush rồi mới consume; DB uniqueness vẫn cần để chống race username/phone giữa email/instance khác nhau.
- Verify không trả JWT/không ghi login SUCCESS; frontend về /login. Login mới cấp JWT24h cho ACTIVE, landing đúng năm role, token expiry/cross-tab client chỉ là UX; backend JWT filter vẫn quyết định quyền.
- Phone/user/email precheck; schema-reviewed=false chặn trước query/OTP gửi. Không tin facility từ public registration.
- GET /api/auth/me cho kiểm JWT qua backend thật sau approval. Invalid token/deleted/inactive user được xử lý qua authentication path, không log bearer.
- OTP sinh bằng `OtpGenerator`, gửi qua SMTP, không trả mã qua API; TTL5phút, cooldown30s,5wrong-attempts; resend gửi lại mã hiện tại, không kéo dài expiry.
- Default signing material nhúng source đã bỏ, JWT_SECRET phải cấu hình riêng; không dùng secret tìm thấy trong file.
- CORS mặc định chỉ hai origin Vite local; deployment phải cấu hình origin cụ thể.
- SchedulingConfig cho phép tắt scheduler có điều kiện; profile auth-supabase và test đặt false. Không chạy local seed hoặc job nghiệp vụ khi smoke auth đúng profile; effective config vẫn phải xác minh trước startup.
- OTP/JWT dùng instant. Hai created_at của auth mới được chuyển từ instant sang LocalDateTime UTC trước persist; history time text có Z. Không đổi Entity/column type hoặc cast/backfill lịch sử; JDBC/DB timestamp round-trip vẫn phải được G0/PostgreSQL test xác minh trước bật schema-reviewed.

## Source tests mới — LOCAL-UNIT đã thực thi

PasswordPolicyTest (raw/blank/UTF8/72byte/config), AuthServiceTest (OTP staging/consume/race/expiry/resend, no JWT after registration, ACTIVE/raw BCrypt login, đủ5role và branch Staff), JwtLifetimeTest (24h và biên), RegistrationAccountServiceTest (schema guard/phone duplicate), OtpDeliveryServiceTest (mock/test restriction, disabled SMTP), RegistrationValidatorTest (canonical identity/raw/DTO), frontend auth-validation.test.ts và session.test.ts (payload/raw/bytes/role routes, expiry/minimal profile). Đã thực thi đúng23 backend và7 frontend unit tests mới, tất cả đạt; chưa có browser/DB/API end-to-end PASS.

## Còn thiếu bằng chứng

Người dùng đã cho phép staging test accounts/ghi auth-nghiệp vụ và chỉ định file riêng `D:/SWP/storage-rental/storage-rental-secrets/backend.env`; directory được Git ignore, không xuất secret. OTP chọn email thật và inbox do user chỉ định. Direct thất bại lúc 05:02:25Z vì DNS/IPv6. User sau đó cung cấp Session pooler aws-0-ap-northeast-1.pooler.supabase.com:5432, routing user postgres.xnerbsgbwdpemvnatvuy. Chỉ URL/user trong file riêng được đổi. Capture lúc 2026-10-19T05:05:57.772671400Z xác nhận PostgreSQL17.11/postgres/public/current_user postgres/timezone UTC;19 nhóm catalog OK trong read-only transaction, rollback. Đã đối chiếu216field của16entity sau kiểm hash source. Có37cột thiếu trên6bảng và2bảng chưa có; users thiếu unique phone/canonical-phone. Không đọc dữ liệu nghiệp vụ hoặc chạy DDL/DML/API/Postman/SMTP; startup read-only sau đó đã thực thi và thất bại tại audit_logs.entity_id. Dữ liệu legacy, canonical collisions, timestamps và runtime chưa xác minh; không công bố đồng bộ Supabase hoàn tất.

Mức72byte đã chốt, không còn là câu hỏi nghiệp vụ. Encoder behavior tại runtime vẫn NOT-TESTED, frontend và backend tự chặn trước encode. Các blocker ngoài auth (audit/UTC/billing/refund/signature/PIN stale ACTIVE) không được âm thầm đánh dấu đã xử lý.

## Kiểm tra tĩnh đã thực hiện

Đã parse cú pháp118 file Java và75 file TypeScript/TSX bằng parser có sẵn; parse12 YAML và kiểm cú pháp21 script Postman mà không gọi script body. OpenAPI/route inventory khớp67 controller mapping, schema refs/JSON/XML hợp lệ; git diff --check không có lỗi whitespace. Đây không phải javac/tsc, build, unit test, Postman CLI lint hoặc HTTP execution; không chứng minh type-check/behavior/database tương thích. Không cài thêm parser/dependency để làm các kiểm tra này.

## Postman

Collection v3 trong postman/collections/auth và bản import GUI được sinh từ cùng requests. Secret fixture lấy Vault/private environment; token/OTP runtime chỉ local variables, không export. Guard yêu cầu auth_run_approved=yes và DB auth write scope đã xác nhận; mặc định không cho chạy. Collection/lint/API execution chưa chạy.

## Kết quả local mới nhất

Xem [auth-local-verification.md](D:/SWP/storage-rental/docs/testing/auth-local-verification.md) và [auth-staging-verification.md](D:/SWP/storage-rental/docs/testing/auth-staging-verification.md). Unit evidence không thay thế G0 metadata, PostgreSQL uniqueness/transactions/RLS, SMTP, browser UX hoặc API staging. Local setup form hiện phục vụ tại localhost8767; không nhận giá trị nhập, chỉ tải file riêng trên máy người dùng. File được đọc duy nhất từ đường dẫn người dùng chủ động cung cấp; không tìm credential trong config khác hoặc history. AUTH_SCHEMA_REVIEWED vẫn false, ddl-auto vẫn validate, scheduler tắt trong profile staging auth.
