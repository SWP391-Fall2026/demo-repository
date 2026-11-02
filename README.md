# Storage Rental

Frontend React + Vite + TypeScript; backend Java 21 + Spring Boot; PostgreSQL/Supabase cho môi trường thực. Cấu trúc theo 10 module nghiệp vụ, một ứng dụng cho năm vai trò.

## Bắt đầu

Yêu cầu Node >=22.12, npm, Java 21 và Maven 3.9.

```powershell
npm ci
npm run dev
```

Frontend: http://127.0.0.1:5173. Ở terminal khác, chạy backend với Supabase:

```powershell
npm run start:backend
```

Backend: http://127.0.0.1:8080. Lệnh này chọn profile `auth-supabase`, đọc PostgreSQL qua backend và chỉ validate schema. Cấu hình kết nối nằm trong file riêng bị Git ignore `storage-rental-secrets/backend.properties`, hoặc biến môi trường `SUPABASE_DB_URL`, `SUPABASE_DB_USERNAME`, `SUPABASE_DB_PASSWORD`, `JWT_SECRET`. Máy mới clone cần cấp cấu hình riêng; không đưa mật khẩu vào frontend hoặc Git.

Danh sách cơ sở/kho lấy từ database, không tự sinh đủ kho cho mọi cơ sở. Cơ sở chưa có kho khả dụng cần được nhập dữ liệu vận hành qua tài khoản quản lý đúng cơ sở.

## Demo cục bộ tùy chọn

Chạy `npm run start:local` thay backend Supabase khi cần H2 độc lập. Local reset dữ liệu khi dừng; không dùng tài khoản seed dưới đây cho Supabase. Tất cả tài khoản local có mật khẩu `Demo123!`:

| Vai trò | Tài khoản | Chi nhánh |
| --- | --- | --- |
| Customer | customer, customer2 | Tài khoản khách độc lập |
| Staff | staff, staff_q7, staff_tb | HN-CG, HCM-Q7, HCM-TB |
| Facility Manager | manager, manager_q7, manager_tb | HN-CG, HCM-Q7, HCM-TB |
| Business Operations Manager | business | Toàn chuỗi |
| System Administrator | admin | Tài khoản và audit |

Thanh toán QR/card mô phỏng chỉ bật mặc định trong local/test. Supabase mặc định tắt `app.payments.simulation-enabled`: khách thanh toán qua VNPay đã cấu hình, hoặc Staff ghi nhận thu tại quầy. VNPay hiện dùng sandbox; cần merchant production để thu tiền qua cổng thật. OTP/email phụ thuộc SMTP; PIN mô phỏng khóa vật lý. Hoàn tiền thủ công ghi nhận bằng chứng do Staff cung cấp và Manager xác nhận; ứng dụng không tự chuyển tiền ngân hàng.

## Cấu trúc

```text
api-gateway/          Spring Cloud Gateway (Service 0: Reverse Proxy, Routing, Rate Limit, SSL)
frontend/src/
  app/                  Router, layout và quyền truy cập
  features/             identity, facility, reservation, rental, billing,
                        workforce, support, policy, reporting, audit
    <feature>/api/      HTTP adapter của module
    <feature>/pages/    Trang React của module
  shared/               HTTP, UI, kiểu chung và định dạng
  assets/               Ảnh dùng khi chạy
  styles/               Theme và responsive
backend/src/main/java/com/swp391/selfstorage/
  modules/<feature>/    controller, dto, entity, repository, service
  application/workflow/ Giao dịch đi qua nhiều module
  common/               Response, validation, actor và file storage
  security/             JWT và Spring Security
  config/               Clock và profile local
contracts/openapi/      Hợp đồng REST API
database/               Schema tham chiếu và migration đề xuất
docs/                   Quyết định, kiến trúc, hướng dẫn và bản lưu source
design/                 Figma và prototype tham chiếu
scripts/                Kiểm tra cấu trúc và contract
```

[Kiến trúc thực tế](docs/architecture/implementation-structure.md) · [Trạng thái triển khai](docs/architecture/refactoring-status.md) · [Quyết định nghiệp vụ](docs/requirements/decision-log.md) · [Database](docs/guides/database-migration.md) · [OpenAPI](contracts/openapi/storage-rental.openapi.json)

## Kiểm tra

```powershell
npm run check
mvn -f backend/pom.xml test
```

Profile `auth-supabase` dùng các biến `SUPABASE_DB_*` nói trên; profile mặc định khác dùng `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. Spring Boot không tự đọc file `.env`; phải cấp biến hoặc file cấu hình riêng. Không bật profile local với database thật. Xem hướng dẫn migration trước khi đổi schema.

Khi chạy backend từ thư mục `backend`, Spring Boot tự nạp file cấu hình riêng nếu tồn tại tại `../storage-rental-secrets/backend.properties`. File này bị Git ignore. Nếu file không tồn tại, cấu hình môi trường phải cấp datasource và `JWT_SECRET`; mặc định datasource trỏ localhost.

Trạng thái chức năng, dữ liệu và giới hạn kiểm chứng cập nhật trong [trạng thái triển khai](docs/architecture/refactoring-status.md).

