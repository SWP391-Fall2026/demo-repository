![Auto Assign](https://github.com/SWP391-Fall2026/demo-repository/actions/workflows/auto-assign.yml/badge.svg)
![Proof HTML](https://github.com/SWP391-Fall2026/demo-repository/actions/workflows/proof-html.yml/badge.svg)

# STORAGE - Hệ Thống Quản Lý & Cho Thuê Kho Lưu Trữ Tự Phục Vụ
> **Đồ án môn học SWP391** - Self-Storage Facility Rental & Management System

## 1. Giới thiệu dự án
Hệ thống quản lý và cho thuê kho tự lưu trữ (Self-Storage) phục vụ nhu cầu lưu trữ đồ đạc cá nhân, tài liệu và hàng hóa doanh nghiệp. Hệ thống phân quyền chặt chẽ theo mô hình RBAC với 5 tác nhân (Actors):
1. **Customer (Khách hàng thuê kho):** Tìm kiếm kho, đặt giữ chỗ, thanh toán cọc VietQR, quản lý kho đang thuê, đổi mã PIN điện tử, gửi ticket hỗ trợ.
2. **Facility Staff (Nhân viên cơ sở):** Tiếp đón khách, kiểm tra đơn đặt chỗ, bàn giao kho & mã PIN, cập nhật trạng thái kho mặt bằng, nghiệm thu trả kho, xử lý sự cố tại quầy.
3. **Facility Manager (Quản lý cơ sở):** Giám sát tổng quan chi nhánh, quản lý danh mục phòng kho, gán kho trống cho đơn đặt, phân công ca trực, theo dõi hợp đồng và công nợ.
4. **Business Operations Manager (Quản lý vận hành toàn chuỗi):** Điều hành chuỗi chi nhánh toàn quốc, thiết lập khung giá thuê, biểu phí phụ & chiết khấu, ban hành chính sách và xuất báo cáo tài chính tổng hợp.
5. **System Administrator (Quản trị hệ thống):** Quản trị tài khoản người dùng, phân vai trò (Roles), cấu hình phân quyền truy cập, theo dõi nhật ký hoạt động (Audit Logs) và lịch sử đăng nhập.

## 2. Hướng dẫn chạy dự án

Dự án được phân tách rõ ràng thành 2 thư mục độc lập: **`frontend/`** (Giao diện Web) và **`backend/`** (Máy chủ Spring Boot API).

### Bước 1: Khởi động Backend (Spring Boot 3 + Supabase)
```bash
# Cách 1: Đứng tại thư mục gốc chạy:
npm run start:backend

# Hoặc di chuyển vào thư mục backend:
cd backend
mvn spring-boot:run
```
*Backend Spring Boot API sẽ lắng nghe tại: `http://localhost:8080`*

### Bước 2: Khởi động Frontend Web
```bash
# Cách 1: Đứng tại thư mục gốc chạy:
npm start

# Hoặc di chuyển vào thư mục frontend:
cd frontend
npm start
```
*Giao diện Web Frontend sẽ chạy tại: `http://localhost:3000` (tự động kết nối tới Spring Boot tại `8080`)*

*(Ngoài ra bạn cũng có thể mở trực tiếp file `frontend/index.html` bằng trình duyệt hoặc qua Live Server của VS Code).*

## 3. Tài khoản thử nghiệm (5 Actors)
| Vai trò | Tên đăng nhập | Mật khẩu | Chi nhánh mặc định |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer` | `1` | Hà Nội - Cầu Giấy |
| **System Admin** | `admin` | `2` | Toàn hệ thống (HQ) |
| **Staff** | `staff` | `3` | Hà Nội - Cầu Giấy |
| **Facility Manager** | `manager` | `4` | Hà Nội - Cầu Giấy |
| **Ops Manager** | `business` | `5` | Toàn hệ thống (HQ) |

## 4. Cấu trúc thư mục
- `backend/`: Toàn bộ Backend **Spring Boot 3 (Java 21, Spring Security, JWT, Spring Data JPA)** kết nối Supabase Cloud.
  - `src/main/java/com/swp391/selfstorage/`:
    - `config/`: Cấu hình Security, CORS, DataInitializer nạp dữ liệu mẫu ban đầu.
    - `controller/`: REST Controllers (`/api/auth`, `/api/facilities`, `/api/reservations`, `/api/payments`, `/api/contracts`, `/api/tasks`, `/api/policies`, `/api/audit-logs`).
    - `entity/`: Các thực thể JPA (`User`, `Facility`, `Unit`, `Reservation`, `Contract`, `Payment`, `SupportTicket`, `DailyTask`, `AuditLog`, `LoginHistory`).
    - `repository/`: Spring Data JPA Repositories truy vấn PostgreSQL.
    - `security/`: `JwtUtil`, `JwtAuthenticationFilter`, `CustomUserDetailsService`.
    - `service/`: Nghiệp vụ phân quyền RBAC, kiểm tra CCCD/SĐT/Email, OTP, tính giá chiết khấu, bàn giao kho.
    - `dto/`: Request/Response DTO và chuẩn phản hồi API.
- `frontend/`: Toàn bộ giao diện **Web SPA (HTML5, CSS3, Vanilla JS)** và máy chủ Web phát triển (`server.js`).
- `design/`: Tài liệu thiết kế Figma và bộ ảnh chụp màn hình báo cáo.
- `docs/`: Tài liệu đặc tả yêu cầu (SRS v2.0, Scope Statement, SQL Schema DDL & Seed).


