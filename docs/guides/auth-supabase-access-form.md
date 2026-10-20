# Form kết nối Supabase cho đăng ký / đăng nhập

> Cập nhật: file riêng đã được cung cấp; Session pooler và migration002/003/004 thành công. Java sinh OTP rồi backend gửi mã qua SMTP; API không trả mã. SMTP hiện bị Brevo chặn IP `525 5.7.1`; cần cho phép IP trước khi xác minh đăng ký end-to-end. [Bằng chứng và giới hạn](D:/SWP/storage-rental/docs/testing/schema-migration-execution-20261019.md). Thông tin blocker schema bên dưới là snapshot trước migration.

Trạng thái 2026-10-19: backend compile +23unit test, frontend type-check +7unit test đạt cô lập. Session pooler đã kết nối và đọc catalog thành công; live thiếu2bảng và37cột trên bảng hiện có so với JPA. Đã thử startup với validate/read-only/tắt SQL init và scheduler: exit1 vì thiếu audit_logs.entity_id. Chưa chạy được ứng dụng/API/SMTP staging. Không điền password, JWT key, SMTP password, access token hoặc URL chứa credential vào file Git theo dõi hoặc chat.

**Form local để nhập secret trên máy bạn:** http://127.0.0.1:8767/ . File tải xuống là private; gửi chỉ đường dẫn sau khi lưu. Không có kết nối DB/API từ form.

## A. Bạn điền và gửi lại — không chứa secret

| Trường | Giá trị bạn điền |
|---|---|
| Môi trường (test/staging/production) | staging — người dùng đã xác nhận |
| Supabase project reference | xnerbsgbwdpemvnatvuy (URL người dùng: https://xnerbsgbwdpemvnatvuy.supabase.co) |
| DB host (không kèm user/password) | aws-0-ap-northeast-1.pooler.supabase.com — user cung cấp sau lỗi direct IPv6 |
| Port | 5432 |
| Database | postgres |
| Schema (source hiện nhắm public; schema khác cần đối chiếu trước) | public |
| Role/user cho đọc metadata | Routing user postgres.xnerbsgbwdpemvnatvuy; current_user DB đã xác minh postgres |
| Role/user chạy ứng dụng (có thể khác role metadata) | postgres.xnerbsgbwdpemvnatvuy — đã thử startup, kết nối đạt nhưng validate schema thất bại |
| Kiểu kết nối: direct hoặc session pooler | Session pooler port5432 — đã xác minh kết nối/catalog |
| SSL mode / đường dẫn CA nếu dùng verify-full | require |
| Frontend origin, ví dụ http://localhost:5173 | |
| Backend URL local, ví dụ http://localhost:8080 | |
| Cách giữ secret: biến môi trường hoặc file riêng ngoài Git | File riêng ngoài Git — người dùng đã chọn |
| Đường dẫn file riêng, nếu chọn file (chỉ gửi đường dẫn) | D:/SWP/storage-rental/storage-rental-secrets/backend.env — user cung cấp; Java Properties; directory được Git ignore |
| Xác thực: giữ Spring Boot JWT + public.users hay yêu cầu đổi Supabase Auth | |
| OTP: email thật hoặc mock chỉ cho test | Email thật — cấu hình đã chọn; user chỉ định inbox kiểm thử, chưa gửi OTP |
| SMTP host/port/from (không gửi password) nếu email thật | |
| Số instance backend dự định chạy | |
| Cho phép kết nối chỉ đọc catalog/metadata đúng DB/schema/role trên? có/không | Đã thực hiện19nhóm catalog qua pooler user cung cấp; read-only, rollback, không hàng nghiệp vụ |
| Cho phép đọc dữ liệu auth để đối chiếu? phạm vi/cột được phép, không lấy password/hash/CCCD thật | |
| Cho phép chạy thử API tạo tài khoản tổng hợp trên DB thử nghiệm sau G0? có/không | Có — user cho phép tài khoản thử nghiệm và ghi auth/nghiệp vụ; chưa thực thi |
| Cho phép ghi login_history và gửi email đến hộp thư thử nghiệm đã đồng ý? có/không | Có — trong phạm vi test auth đã được yêu cầu; hộp thư do user chủ động chỉ định; chưa thực hiện |
| Cho phép build/unit test cô lập trước smoke test? có/không | Đã thực hiện kiểm tra local không Spring context/DB; kết quả ở auth-local-verification.md |
| Xóa/cleanup tài khoản thử nghiệm sau test? chỉ nêu yêu cầu; chưa tự xóa | |

Quyết định đã xác nhận: tối đa72 byte UTF-8, giữ nguyên password/confirmPassword, từ chối vượt ngưỡng, không cắt hoặc trim. Không cần chốt lại mục này.

## B. Secret chỉ cấu hình trên máy của bạn

Không cần Supabase service_role key hoặc anon key khi dùng kiến trúc JDBC hiện tại. React gọi REST API Spring Boot; chỉ backend truy cập PostgreSQL và giữ secret. Không đặt DB password/JWT_SECRET/SMTP password vào biến VITE_*.

| Biến cho backend | Cách điền riêng |
|---|---|
| SUPABASE_DB_URL | jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require ; không nhét username/password vào URL. Chỉ public schema hiện được hỗ trợ/review |
| SUPABASE_DB_USERNAME | User/role đã khai báo ở form |
| SUPABASE_DB_PASSWORD | Bạn nhập riêng; không gửi chat hoặc lưu Git |
| JWT_SECRET | Khóa ngẫu nhiên riêng cho môi trường này, ít nhất32 byte; khuyến nghị64 byte ngẫu nhiên. Không dùng khóa mặc định cũ trong source |
| AUTH_OTP_DELIVERY | `email` |
| AUTH_MAIL_FROM | Địa chỉ gửi được SMTP provider cho phép |
| AUTH_SMTP_HOST / AUTH_SMTP_PORT | Theo provider |
| AUTH_SMTP_USERNAME / AUTH_SMTP_PASSWORD | Bạn nhập riêng |
| AUTH_SCHEMA_REVIEWED | false đến khi review metadata/uniqueness được chấp thuận; không tự bật trước G0 |
| SPRING_PROFILES_ACTIVE | auth-supabase |
| FRONTEND_ORIGIN | Chuyển thành app.cors.allowed-origins trong file riêng hoặc APP_CORS_ALLOWED_ORIGINS môi trường |
| BACKEND_URL (Vite dev proxy) | Chỉ URL backend, không secret; ví dụ http://localhost:8080 |

Có thể dùng biến môi trường hoặc cấu hình Spring riêng ngoài checkout qua SPRING_CONFIG_ADDITIONAL_LOCATION. Spring Boot không tự đọc một file .env chỉ vì nó tồn tại. File .properties có quy tắc escape riêng, nên phải kiểm tra ký tự đặc biệt trong secret; không gửi file có secret vào chat. Agent không tự điền secret. Form local chỉ tạo bản tải xuống khi bạn bấm; không upload file/nội dung secret vào chat.

Theo [hướng dẫn Spring Boot của Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot), session pooler/direct là hai lựa chọn cho ứng dụng này; đối chiếu đúng host/user/port/SSL từ Connect panel. Không tự dùng transaction pooler hoặc đổi thông số kết nối dựa trên phỏng đoán.

## C. Trình tự chạy sau khi bạn trả form

1. Xác nhận đúng project/database/schema/role và quyền đọc metadata, không dùng credential tìm thấy trong repo.
2. Thu thập catalog trước. Đối chiếu16 entity vì Hibernate validate kiểm toàn persistence unit, không chỉ users. Audit/billing mismatch có thể chặn startup; không đổi ddl-auto để né lỗi.
3. Đối chiếu users/login_history: columns/type/length/nullability/default/PK/unique/index/check/RLS/privileges/timezone; kiểm phone/email/username collisions chỉ khi được phép đọc dữ liệu và với counts không PII.
4. Chỉ sau khi có bằng chứng/được review mới xử lý constraint/schema. Không chạy migration tự động; draft guard giữ nguyên.
5. Chỉ bật AUTH_SCHEMA_REVIEWED sau review. Compile/unit local và kết nối/catalog pooler đã đạt; API staging còn chờ xử lý schema/constraint/time blockers có bằng chứng, chưa cấp quyền DDL từ quyền tạo test account.
6. Chạy Postman vào backend local đã cấu hình DB được duyệt; asserts response và JWT độc lập, đối chiếu DB counts/state riêng nếu được phép.
7. Kiểm UI đăng ký→OTP→trang login; đăng nhập→landing đúng role; raw password và bản trim cho kết quả khác đúng policy. Postman không chứng minh browser UX.
8. Ghi kết quả local/mocked/live tách biệt. Không coi implementation hoặc schema reference là bằng chứng Supabase đã đồng bộ.

## D. Giới hạn hiện tại cần review

- Đây là public.users do Spring Boot quản lý, không phải Supabase Auth auth.users. Không chuyển kiến trúc giữa chừng khi chưa được bạn chọn.
- OTP TTL5phút, hợp lệ khi now < expiresAt và hết hạn ngay tại expiresAt; resend lại cùng mã và không kéo dài hạn ban đầu. Cooldown30giây và tối đa5 lần nhập sai là thông số kỹ thuật hiện được viết, chưa kiểm runtime. Challenge OTP và hash password chỉ ở memory một instance; restart mất challenge, nhiều instance cần persistent/shared store được thiết kế trước production. Không log OTP; chỉ mock test trả mã trong response.
- Profile auth-supabase đặt app.scheduling.enabled=false; SchedulingConfig có điều kiện bật scheduler. Không thêm profile local vì profile đó chạy seed. Việc cô lập được đọc từ source, vẫn cần xác minh effective profiles/config trước startup; chưa chạy scheduler hoặc seed.
- Bắt buộc DB unique bảo vệ username/email/phone khi nhiều request/instance cùng ghi; precheck không thay unique. Live đã xác nhận username/email unique thông thường, chưa có unique phone/canonical-phone. JPQL phone precheck bỏ dấu cách ASCII, dấu chấm/gạch ngang; legacy tabs/Unicode spaces và collisions chưa được kiểm trước constraint.
- DOB/gender legacy trong DTO chỉ validate nếu được gửi, chưa được User entity lưu; form mới chỉ thu các trường FR-001. Không tự thêm cột hoặc dữ liệu giả. Facility từ request không cấp quyền/không gán mặc định cho Customer.
- LoginHistory vẫn best-effort; cần operator xác nhận schema và visibility trước khi kết luận có history đầy đủ.
- Logout server/revocation theo FR-003 chưa triển khai trong đợt chỉ đăng ký/đăng nhập này; không coi clear client session là hoàn tất yêu cầu đó.
- Không reset/migrate hash legacy bị trim; tài khoản test mới dùng raw policy. Không thử raw+trim fallback.
