# Storage Rental

Frontend React + Vite + TypeScript; backend Java 21 + Spring Boot; PostgreSQL/Supabase cho môi trường thực. Cấu trúc theo 10 module nghiệp vụ, một ứng dụng cho năm vai trò.

## Bắt đầu

Yêu cầu Node >=22.12, npm, Java 21 và Maven 3.9.

```powershell
npm ci
npm run dev
```

Frontend: http://127.0.0.1:5173. Ở terminal khác, chạy backend local với H2 độc lập:

```powershell
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=local
```

Backend: http://localhost:8080. Local reset dữ liệu khi dừng. Profile local chỉ dùng database H2 cố định, không dùng DB_URL. Tất cả tài khoản local có mật khẩu `Demo123!`:

| Vai trò | Tài khoản | Chi nhánh |
| --- | --- | --- |
| Customer | customer, customer2 | Tài khoản khách độc lập |
| Staff | staff, staff_q7, staff_tb | HN-CG, HCM-Q7, HCM-TB |
| Facility Manager | manager, manager_q7, manager_tb | HN-CG, HCM-Q7, HCM-TB |
| Business Operations Manager | business | Toàn chuỗi |
| System Administrator | admin | Tài khoản và audit |

Thanh toán, OTP và PIN là mô phỏng phần mềm. Giao dịch hoàn thủ công chỉ ghi nhận bằng chứng do Staff cung cấp và Manager xác nhận; ứng dụng không tự chuyển tiền ngân hàng. Không có ví số dư.

## Cấu trúc

```text
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

Môi trường thực dùng DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET và APP_UPLOAD_DIR. Spring Boot không tự đọc file .env; phải export biến hoặc cấu hình trên môi trường chạy. Không bật profile local với database thật. Seed prototype cũ được lưu ngoài runtime trong docs/archive. Xem hướng dẫn migration trước khi dùng schema hiện tại.

Nguồn tái cấu trúc: ZIP đã xác nhận (baseline commit 21cbce8), schema 15 bảng cung cấp riêng và quyết định nghiệp vụ đã chốt. Checkout cũ D:/SWP/demo-repository được giữ nguyên; mã mới ở D:/SWP/storage-rental, branch codex/restructure-storage-rental.

