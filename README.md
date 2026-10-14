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
```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi động máy chủ Node.js Express
npm start
```
Truy cập hệ thống tại: `http://localhost:3000`

## 3. Tài khoản thử nghiệm (5 Actors)
| Vai trò | Tên đăng nhập | Mật khẩu | Chi nhánh mặc định |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer` | `1` | Hà Nội - Cầu Giấy |
| **System Admin** | `admin` | `2` | Toàn hệ thống (HQ) |
| **Staff** | `staff` | `3` | Hà Nội - Cầu Giấy |
| **Facility Manager** | `manager` | `4` | Hà Nội - Cầu Giấy |
| **Ops Manager** | `business` | `5` | Toàn hệ thống (HQ) |

## 4. Cấu trúc thư mục
- `index.html`: Giao diện người dùng Web SPA tích hợp 5 phân hệ actor.
- `css/`: Hệ thống định kiểu giao diện hiện đại, responsive.
- `js/`: Xử lý logic phía client (chuyển màn hình, giỏ hàng, thanh toán, RBAC).
- `server/`: Máy chủ Node.js Express & bộ kết nối CSDL Supabase.
- `services/`: Kiến trúc Microservices (Auth, Facility, Reservation, Payment, Contract, Task, Policy, Audit).
- `docs/`: Tài liệu đặc tả yêu cầu (SRS v2.0, Scope Statement, SQL Schema DDL & Seed).

