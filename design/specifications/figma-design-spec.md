# BỘ ĐẶC TẢ THIẾT KẾ GIAO DIỆN FIGMA (FIGMA UI/UX DESIGN SPECIFICATION)
## HỆ THỐNG QUẢN LÝ VÀ CHO THUÊ KHO LƯU TRỮ TỰ PHỤC VỤ (SELF-STORAGE)

**Mã đồ án:** SWP-PROJECT-SELF-STORAGE  
**Phiên bản tài liệu:** 1.0 (Figma Design Baseline for 2 Core Actors)  
**Phạm vi thiết kế:** Phân hệ Khách hàng thuê kho (**Storage Customer**) & Nhân viên quản lý cơ sở (**Facility Staff**)  
**Chuẩn thiết kế:** Desktop Canvas `1440 x 900 px` (Grid 12 cột) & Mobile Canvas `390 x 844 px` (Grid 4 cột)  

---

## MỤC LỤC
1. [Cấu trúc tổ chức File Figma (Figma Project Organization)](#1-cấu-trúc-tổ-chức-file-figma-figma-project-organization)
2. [Hệ thống Thiết kế & Design Tokens (Design System)](#2-hệ-thống-thiết-kế--design-tokens-design-system)
   - 2.1. Bảng màu (Color Palette & Tokens)
   - 2.2. Hệ thống kiểu chữ (Typography Scale)
   - 2.3. Bán kính góc & Đổ bóng (Border Radius & Elevations)
   - 2.4. Thư viện Component chính (Master Components)
3. [Đặc tả Màn hình: Storage Customer Portal (SCR-C01 đến SCR-C06)](#3-đặc-tả-màn-hình-storage-customer-portal)
   - SCR-C01: Catalog & Facility Explorer (Xem danh mục cơ sở, kích thước kho, bảng giá & kho trống)
   - SCR-C02: Unit Reservation & Booking (Đặt giữ chỗ kho trực tuyến)
   - SCR-C03: Multi-purpose Payment & Invoices (Thanh toán cọc, tiền thuê, gia hạn & phụ phí)
   - SCR-C04: Scheduled Check-in Pass (Thẻ check-in nhận kho theo lịch hẹn)
   - SCR-C05: My Rented Units Dashboard (Quản lý các kho đang thuê & Mã PIN điện tử)
   - SCR-C06: Customer Support Ticket Desk (Gửi yêu cầu hỗ trợ sự cố đa danh mục)
4. [Đặc tả Màn hình: Facility Staff Portal (SCR-S01 đến SCR-S06)](#4-đặc-tả-màn-hình-facility-staff-portal)
   - SCR-S01: Daily Task Board & Shift Overview (Theo dõi lịch công việc trong ca trực)
   - SCR-S02: Reservation Lookup & Verification (Kiểm tra đơn đặt chỗ khi khách đến)
   - SCR-S03: Check-in & Handover Protocol (Hỗ trợ check-in & biên bản bàn giao kho, khóa, thẻ, PIN)
   - SCR-S04: Unit Inventory & Status Matrix (Cập nhật trạng thái phòng kho thời gian thực)
   - SCR-S05: Return Inspection & Check-out Protocol (Nghiệm thu kho trả, tính khấu trừ & duyệt cọc)
   - SCR-S06: On-site Incident & Problem Desk (Xử lý sự cố tại quầy: mất chìa, mã PIN, hư hỏng)
5. [Sơ đồ Luồng Tương tác Prototype (Interactive Prototyping Wires & Triggers)](#5-sơ-đồ-luồng-tương-tác-prototype)
6. [Hướng dẫn Copy-Paste & Dựng Khung trên Figma](#6-hướng-dẫn-copy-paste--dựng-khung-trên-figma)

---

## 1. Cấu trúc tổ chức File Figma (Figma Project Organization)

Khi tạo dự án trên Figma (`Self-Storage System - SWP391 UI/UX`), cấu trúc trang (Pages) chuẩn được chia như sau:

```
📁 Self-Storage Facility Rental and Management System (Figma File)
│
├── 📄 01. 🎨 Cover & Project Guidelines (Ảnh bìa đồ án, tác giả, metadata, quy chuẩn)
├── 📄 02. 🧩 Design System & Master Components (Màu sắc, Typography, Buttons, Inputs, Cards, Modals)
├── 📄 03. 🗺️ Information Architecture & User Flows (Sơ đồ luồng đi của Customer & Staff)
├── 📄 04. 👤 Storage Customer - Desktop (1440x900) (6 màn hình chính + các trạng thái modal)
├── 📄 05. 📱 Storage Customer - Mobile (390x844) (Phiên bản mobile responsive phục vụ demo)
├── 📄 06. 👷 Facility Staff - Desktop/Tablet (1440x900) (6 màn hình điều hành ca trực)
└── 📄 07. ⚡ Interactive Prototype (Nối dây tương tác hoàn chỉnh cho bài thuyết trình)
```

---

## 2. Hệ thống Thiết kế & Design Tokens (Design System)

### 2.1. Bảng màu (Color Palette & Design Tokens)

Hệ thống màu sắc sử dụng phong cách **Modern Enterprise Blue & Clean Industrial Slate**, tạo cảm giác an ninh, tin cậy, sạch sẽ và chuyên nghiệp:

| Tên Token | Mã màu HEX | Mô tả & Mục đích sử dụng |
| :--- | :---: | :--- |
| `primary-900` | `#0f172a` | Nền thanh tiêu đề đậm, text tiêu đề chính |
| `primary-700` | `#1e40af` | **Màu thương hiệu chính** (Brand Primary Blue), nút chính CTA, active link |
| `primary-500` | `#3b82f6` | Hover state nút bấm, icon nổi bật, border focus |
| `primary-100` | `#dbeafe` | Nền badge nhẹ, hover dòng bảng biểu, tag thông tin |
| `secondary-teal` | `#0d9488` | Tiện ích nâng cao (kho mát điều hòa), thẻ dịch vụ cộng thêm |
| `success-600` | `#10b981` | Trạng thái **AVAILABLE (Kho trống)**, Đã thanh toán, Check-in thành công |
| `warning-500` | `#f59e0b` | Trạng thái **RESERVED (Đang giữ chỗ)**, Chờ thanh toán, Đang bảo trì |
| `danger-600` | `#ef4444` | Trạng thái **OCCUPIED (Đang thuê)**, Quá hạn cước, Báo cáo sự cố khẩn |
| `neutral-50` | `#f8fafc` | Nền ứng dụng chính (App Background) |
| `neutral-100` | `#f1f5f9` | Nền card phụ, nền ô input disabled, thanh tìm kiếm |
| `neutral-200` | `#e2e8f0` | Màu viền phân cách card, đường kẻ bảng (Border Lines) |
| `neutral-500` | `#64748b` | Chữ phụ, placeholder, nhãn ghi chú mờ (Muted Text) |
| `neutral-900` | `#0f172a` | Màu văn bản chính đọc nội dung (Main Body Text) |

### 2.2. Hệ thống kiểu chữ (Typography Scale)
- **Font Family chính:** `Plus Jakarta Sans` hoặc `Inter` (Sans-serif hiện đại, độ dễ đọc cao).
- **Font số liệu / Mã PIN:** `JetBrains Mono` hoặc `Roboto Mono` (Hiển thị mã kho `A-102`, mã PIN `894 210`, số tiền VNĐ).

| Tên Style | Kích cỡ (Font Size) | Line Height | Độ đậm (Font Weight) | Sử dụng cho |
| :--- | :---: | :---: | :---: | :--- |
| `Display 1` | 32 px | 40 px | Bold (700) | Tiêu đề lớn trang chủ, tổng doanh thu |
| `Heading 1` | 24 px | 32 px | SemiBold (600) | Tiêu đề các phân hệ màn hình (H1) |
| `Heading 2` | 20 px | 28 px | SemiBold (600) | Tiêu đề Section, Header bảng, Tên Card |
| `Heading 3` | 16 px | 24 px | Medium (500) | Tiêu đề nhóm bộ lọc, nhãn trường quan trọng |
| `Body Regular` | 14 px | 20 px | Regular (400) | Văn bản thông thường, mô tả kho, nội dung bảng |
| `Body Medium` | 14 px | 20 px | Medium (500) | Nút bấm, nhãn input, tiêu đề cột bảng |
| `Caption` | 12 px | 16 px | Regular (400) | Ghi chú ngày tháng, tooltip, phụ đề |
| `Code Display` | 28 px | 36 px | Bold (700) | Hiển thị mã PIN 6 số lớn trên màn hình |

### 2.3. Bán kính góc & Đổ bóng (Border Radius & Elevations)
- **Border Radius:**
  - `radius-sm`: `6px` (Nút phụ, input trường nhập, badge)
  - `radius-md`: `10px` (Nút CTA chính, card phòng kho, modal nhỏ)
  - `radius-lg`: `16px` (Bảng điều khiển, popup tiếp đón, thẻ pass check-in)
  - `radius-full`: `9999px` (Pill status badges, avatar)
- **Drop Shadow (Hiệu ứng nổi):**
  - `shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.05)` (Card thông thường)
  - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` (Dropdown, hover card)
  - `shadow-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` (Modal form đặt chỗ, bàn giao)

---

## 3. Đặc tả Màn hình: Storage Customer Portal

### SCR-C01: Catalog & Facility Explorer (Khám phá cơ sở & Bảng giá kho)
- **Kích thước Frame:** `1440 x 1080 px` (Desktop) & `390 x 920 px` (Mobile)
- **Mục tiêu:** Cho phép khách hàng tìm kiếm cơ sở, chọn loại kho (S/M/L), so sánh kích thước, xem đơn giá minh bạch và số lượng kho đang còn trống (`Available Units`).
- **Bố cục các vùng (Layout Zones):**
  1. **Top Navigation Bar (H: 72px):** Logo "SelfStorage PRO", Menu ("Tìm kho", "Bảng giá", "Kho của tôi", "Hỗ trợ"), Nút đổi chi nhánh cơ sở, Icon chuông thông báo, Avatar profile.
  2. **Hero Search & Filter Banner (H: 140px):**
     - Dropdown chọn Cơ sở: *Hà Nội - Chi nhánh Cầu Giấy (120 Duy Tân)* / *TP.HCM - Chi nhánh Q7 (Nguyễn Thị Thập)*.
     - Bộ nút chọn loại kho (Segmented Control): `Tất cả` | `Kho nhỏ (1 - 3m²)` | `Kho vừa (4 - 8m²)` | `Kho lớn (> 9m²)` | `Kho lạnh/Kho mát`.
     - Slider khoảng giá: `500.000đ - 5.000.000đ / tháng`.
     - Checkbox "Chỉ hiện phòng kho còn trống (`Available`)".
  3. **Grid thẻ phòng kho (Unit Types Grid - 3 Cột Desktop, 1 Cột Mobile):**
     - Mỗi Card gồm:
       - Ảnh 3D minh họa thể tích chứa (ví dụ: chứa vừa 10 thùng carton + 1 xe máy).
       - Badge trạng thái: `🟢 Còn 4 kho trống` hoặc `🟡 Sắp hết` hoặc `🔴 Tạm hết`.
       - Tên loại kho: **Kho Tiêu Chuẩn Medium (5.0 m² - 12.5 m³)**.
       - Kích thước chi tiết: `Dài 2.5m x Rộng 2.0m x Cao 2.5m`.
       - Tiện ích đi kèm: Icon Bảo vệ 24/7, Camera an ninh cá nhân, Mã PIN điện tử riêng, Kiểm soát nhiệt độ & độ ẩm.
       - Đơn giá niêm yết: **1.500.000 VNĐ / tháng** (Có ghi chú: *Cọc 1 tháng, hoàn trả 100% khi kết thúc hợp đồng*).
       - Nút CTA chính: **"Đặt giữ chỗ ngay"** (Màu xanh `primary-700`, khi click mở modal SCR-C02).

---

### SCR-C02: Unit Reservation & Booking (Đặt giữ chỗ kho trực tuyến)
- **Kích thước Frame:** `1440 x 900 px` (Hiển thị dạng Modal nổi hoặc Màn hình quy trình đặt kho 2 cột).
- **Mục tiêu:** Khách hàng cấu hình thông số đặt kho: cơ sở, loại kho, ngày bắt đầu thuê, thời hạn thuê, khung giờ hẹn đến nhận kho và xem tính toán chi phí minh bạch.
- **Bố cục các vùng:**
  1. **Cột trái (Form nhập thông tin thuê - W: 60%):**
     - **Bước 1: Thông tin cơ sở & phòng kho:**
       - Tên cơ sở: *Chi nhánh Cầu Giấy - Tầng 2*.
       - Loại kho đã chọn: *Kho Tiêu Chuẩn Medium (5.0 m²)*.
     - **Bước 2: Thời gian thuê & Lịch hẹn tiếp đón:**
       - Ngày bắt đầu dự kiến (`Start Date`): Date picker (mặc định hôm nay hoặc ngày khách chọn).
       - Thời hạn thuê (`Rental Period`): Radio chips `1 tháng` | `3 tháng (Giảm 5%)` | `6 tháng (Giảm 10%)` | `12 tháng (Giảm 15%)`.
       - Khung giờ hẹn đến check-in nhận kho: Dropdown (`08:30 - 09:30`, `10:00 - 11:00`, `14:00 - 15:00`, `16:30 - 17:30`).
     - **Bước 3: Thông tin người nhận kho:**
       - Họ và tên, Số điện thoại, Số CCCD/Hộ chiếu, Email nhận hóa đơn.
  2. **Cột phải (Tóm tắt thanh toán & Chính sách cọc - W: 40% Card Sticky):**
     - Đơn giá thuê hàng tháng: `1.500.000 đ`.
     - Tiền đặt cọc cam kết (Deposit - tương đương 1 tháng): `1.500.000 đ`.
     - Chiết khấu thời hạn dài: `- 225.000 đ` (Nếu chọn 3 tháng).
     - **Tổng tiền cọc cần thanh toán giữ chỗ:** **`1.500.000 đ`** (Chỉ cần cọc trước để giữ phòng, tiền thuê tháng đầu có thể trả lúc nhận kho).
     - Hộp lưu ý: *"Phòng kho sẽ được giữ chỗ trong 24 giờ. Quản lý cơ sở sẽ gán số phòng cụ thể và gửi thẻ hẹn Check-in."*
     - Nút CTA: **"Xác nhận đặt giữ chỗ & Thanh toán cọc"** -> Kích hoạt chuyển sang SCR-C03.

---

### SCR-C03: Multi-purpose Payment & Invoices (Thanh toán đa loại phí)
- **Kích thước Frame:** `1440 x 900 px`
- **Mục tiêu:** Hỗ trợ thanh toán toàn diện mọi loại cước phát sinh: **Tiền đặt cọc (Deposit)**, **Cước thuê định kỳ (Rental Fee)**, **Phí gia hạn hợp đồng (Renewal Fee)**, hoặc **Phụ phí bồi thường/vật tư (Extra Charges)**.
- **Bố cục các vùng:**
  1. **Thanh chọn loại khoản thanh toán (Payment Tabs):**
     - Tab 1: `Tiền cọc giữ chỗ (Mã đơn: RSV-8821)` - 1.500.000 đ
     - Tab 2: `Tiền thuê kỳ đầu (Tháng 10/2026)` - 1.500.000 đ
     - Tab 3: `Gia hạn hợp đồng (Kho A-102)` - 1.500.000 đ
     - Tab 4: `Phụ phí phát sinh (Vệ sinh / Ổ khóa mới)` - 200.000 đ
  2. **Chi tiết hóa đơn điện tử (Invoice Breakdown Panel - Bên trái):**
     - Mã hóa đơn: `INV-2026-0924-01`, Ngày lập, Hạn thanh toán.
     - Bảng kê chi tiết từng dòng mặt hàng, thuế GTGT (nếu có), tổng số tiền thanh toán bằng chữ và số.
  3. **Cổng thanh toán mô phỏng (Payment Gateway Panel - Bên phải):**
     - Tùy chọn 1: **Quét mã VietQR chuyển khoản nhanh 24/7:**
       - Hiển thị QR Code động kèm logo Napas247, Ngân hàng Quân Đội (MBBank), Số tài khoản, Tên thụ hưởng: `CONG TY CO PHAN SELF STORAGE VIET NAM`, Nội dung chuyển khoản: `TT COC RSV 8821`.
       - Đồng hồ đếm ngược giao dịch: `14:59`.
       - Nút mô phỏng: *"Giả lập đã chuyển khoản thành công"*.
     - Tùy chọn 2: **Thẻ ATM nội địa / Visa / Mastercard:**
       - Form nhập số thẻ, tên chủ thẻ, ngày hết hạn, mã CVV.
     - Trạng thái phản hồi tức thì: Modal thông báo **"Thanh toán thành công! Mã giao dịch: TXN-998124"** kèm nút tải biên lai E-Receipt PDF và nút *"Xem thẻ hẹn Check-in"*.

---

### SCR-C04: Scheduled Check-in Pass (Thẻ Check-in nhận kho hẹn giờ)
- **Kích thước Frame:** `1440 x 900 px` & Thẻ Mobile Pass `390 x 844 px`
- **Mục tiêu:** Cung cấp cho khách hàng thẻ thông hành điện tử đến nhận kho theo lịch hẹn đã đăng ký, đối chiếu số phòng kho được gán và thực hiện nhận bàn giao trực tuyến.
- **Bố cục các vùng:**
  1. **Thẻ Boarding Pass nhận kho (Digital Check-in Pass - Card nổi bật viền bo tròn):**
     - Tiêu đề: **THẺ HẸN CHECK-IN NHẬN PHÒNG KHO**.
     - Mã đặt chỗ: `RSV-8821` | Trạng thái: `🟢 ĐÃ THANH TOÁN CỌC - ĐÃ GÁN PHÒNG`.
     - Mã số phòng kho chính thức: **`UNIT A-102`** (Tầng 1 - Khu A - Gần thang máy hàng).
     - Chi nhánh: *Cơ sở Cầu Giấy (120 Duy Tân, P. Dịch Vọng Hậu, Cầu Giấy, Hà Nội)*.
     - Thời gian hẹn đón tiếp: **Hôm nay, 14:00 - 15:00 (24/09/2026)**.
     - Tên nhân viên phụ trách ca: *Nguyễn Văn Tuấn (Facility Staff - SĐT: 0912.345.678)*.
     - **Mã QR Check-in cá nhân:** Khách xuất trình cho Staff quét tại quầy lễ tân để kích hoạt thủ tục nhanh chóng.
  2. **Sơ đồ mặt bằng & Chỉ dẫn đường đi (Floor Guide):**
     - Bản đồ nhỏ chỉ dẫn từ cửa ra vào, khu bốc dỡ hàng, vị trí thang máy và kho A-102.
  3. **Biên bản bàn giao điện tử (Digital Handover Preview):**
     - Hiển thị danh mục bàn giao: Ổ khóa vật lý + 02 chìa / Thẻ từ RFID / Mã PIN điện tử 6 số.
     - Khung ký xác nhận điện tử (E-Signature pad) hoặc nút bấm *"Tôi đồng ý nhận bàn giao phòng kho trong tình trạng hoàn hảo"*.

---

### SCR-C05: My Rented Units Dashboard (Quản lý các kho đang thuê & Mã PIN)
- **Kích thước Frame:** `1440 x 960 px`
- **Mục tiêu:** Quản lý một hoặc nhiều kho đang thuê đồng thời, tra cứu mã PIN mở khóa cửa, theo dõi ngày hết hạn hợp đồng, yêu cầu gia hạn hoặc trả kho.
- **Bố cục các vùng:**
  1. **Header thống kê nhanh:**
     - Tổng số kho đang hoạt động: `02 Kho` (Kho A-102 & Kho B-205).
     - Tổng diện tích sử dụng: `13.0 m²`.
     - Ngày đến hạn cước tiếp theo: `24/10/2026 (Còn 30 ngày)`.
  2. **Thẻ điều khiển từng phòng kho (Unit Control Cards):**
     - **Kho 1: UNIT A-102 (Kho Medium - 5.0m²)**
       - Chi nhánh: Cơ sở Cầu Giấy | Hợp đồng: `CTR-2026-001` (Trạng thái: `🟢 ACTIVE`).
       - Thời hạn thuê: `24/09/2026 - 24/12/2026` (Thời hạn 3 tháng).
       - **Bàn phím điện tử mã PIN (Access PIN Keypad):**
         - Hiển thị: `● ● ● ● ● ●` kèm nút toggle mắt xem `[ 8 9 4 2 1 0 ]`.
         - Nút "Sao chép mã PIN" & Nút "Đổi mã PIN mới".
         - Trạng thái khóa: `🔒 Đang khóa an toàn` / `🔓 Đã kích hoạt quyền mở`.
       - Bộ nút hành động nhanh:
         - Nút 1: `Gia hạn hợp đồng (Renew)` -> Mở modal chọn thêm 1-12 tháng.
         - Nút 2: `Yêu cầu trả kho (Check-out)` -> Mở form chọn ngày hẹn trả kho.
         - Nút 3: `Báo cáo sự cố (Report Issue)` -> Chuyển sang SCR-C06.
     - **Kho 2: UNIT B-205 (Kho Large - 8.0m²)**
       - Chi nhánh: Cơ sở Quận 7 | Hợp đồng: `CTR-2026-089` (Trạng thái: `🟢 ACTIVE`).
       - Tương tự hiển thị đầy đủ thông tin mã truy cập và nút chức năng.

---

### SCR-C06: Customer Support Ticket Desk (Gửi yêu cầu hỗ trợ sự cố)
- **Kích thước Frame:** `1440 x 900 px`
- **Mục tiêu:** Gửi yêu cầu hỗ trợ khẩn cấp hoặc kỹ thuật liên quan đến: phòng kho, ổ khóa, mã PIN truy cập, thanh toán, hoặc hàng hóa lưu trữ.
- **Bố cục các vùng:**
  1. **Cột trái (Form gửi Ticket mới - W: 50%):**
     - Chọn kho bị ảnh hưởng: Dropdown (`Unit A-102 - Chi nhánh Cầu Giấy`).
     - Phân loại vấn đề (Category):
       - `🔐 Sự cố Ổ khóa / Thẻ từ bị kẹt`
       - `🔢 Quên hoặc Lỗi mã PIN truy cập`
       - `💧 Vấn đề phòng kho (Thấm ẩm, đèn hỏng, cửa cuốn rít)`
       - `💳 Thắc mắc cước phí & Hóa đơn`
       - `📦 Yêu cầu kiểm tra hàng hóa bảo quản`
     - Mức độ ưu tiên: `Bình thường` | `Khẩn cấp (Cần mở kho gấp)`.
     - Tiêu đề sự cố: Ví dụ *"Cửa cuốn Unit A-102 bị kẹt chốt, không mở được"*.
     - Mô tả chi tiết vấn đề.
     - Tải ảnh/video hiện trường (Dropzone upload ảnh).
     - Nút CTA: **"Gửi yêu cầu hỗ trợ ngay"**.
  2. **Cột phải (Lịch sử yêu cầu & Tiến độ xử lý - W: 50%):**
     - Danh sách các Ticket đã gửi:
       - Ticket #TK-108: *"Quên mã PIN kho B-205"* - `🟢 Đã giải quyết (Cấp lại mã PIN mới lúc 10:15)`.
       - Ticket #TK-115: *"Cửa cuốn A-102 kẹt chốt"* - `🟡 Đang xử lý (Staff Nguyễn Văn Tuấn đang đến kiểm tra)`.
     - Timeline chi tiết khi click vào Ticket: Thời gian tạo -> Staff tiếp nhận -> Hành động thực tế -> Đóng ticket kèm đánh giá hài lòng (1 - 5 sao).

---

## 4. Đặc tả Màn hình: Facility Staff Portal

### SCR-S01: Daily Task Board & Shift Overview (Bàn làm việc ca trực hàng ngày)
- **Kích thước Frame:** `1440 x 900 px` (Desktop / Tablet ngang)
- **Mục tiêu:** Cung cấp cái nhìn toàn diện về lịch công việc trong ca của nhân viên cơ sở: khách hẹn nhận kho, khách hẹn trả kho, và các sự cố cần xử lý tại chỗ.
- **Bố cục các vùng:**
  1. **Top Metric Cards (4 Thẻ chỉ số tổng quan):**
     - Thẻ 1: **05 Khách hẹn nhận kho hôm nay** (02 Đã nhận | 03 Đang đợi).
     - Thẻ 2: **02 Lịch hẹn trả kho & Nghiệm thu** (Cần kiểm tra hoàn cọc).
     - Thẻ 3: **03 Sự cố cần xử lý tại chỗ** (01 khẩn cấp kẹt khóa).
     - Thẻ 4: **Tỉ lệ kho trống cơ sở: 18 / 120 Kho (15%)**.
  2. **Bộ Tab lọc danh sách công việc chính:**
     - **Tab 1: Lịch hẹn Check-in nhận kho hôm nay (Check-in Queue):**
       - Bảng danh sách: Giờ hẹn (`14:00`), Khách hàng (`Trần Văn Bảo`), SĐT, Mã đặt chỗ (`RSV-8821`), Kho gán (`A-102`), Tình trạng cọc (`Đã nộp 1.500.000đ`), Nút thao tác: **"Tiến hành Check-in"**.
     - **Tab 2: Lịch hẹn trả kho & Nghiệm thu (Check-out Queue):**
       - Bảng danh sách: Giờ trả (`16:30`), Khách hàng (`Lê Thị Mai`), Kho (`B-108`), Tiền cọc đang giữ (`2.000.000đ`), Nút thao tác: **"Bắt đầu nghiệm thu"**.
     - **Tab 3: Sự cố hỗ trợ tại chỗ (Support Queue):**
       - Vấn đề: `Kẹt khóa Unit A-102`, Mức độ: `Ưu tiên cao`, Nút: **"Xử lý ngay"**.

---

### SCR-S02: Reservation Lookup & Verification (Tra cứu & Xác thực đơn đặt chỗ)
- **Kích thước Frame:** `1440 x 900 px`
- **Mục tiêu:** Tra cứu nhanh chóng đơn đặt chỗ khi khách hàng đến cơ sở nhận kho bằng Mã đơn, CCCD hoặc Số điện thoại; xác thực tính hợp lệ của đơn.
- **Bố cục các vùng:**
  1. **Thanh tìm kiếm thông minh đa năng:**
     - Ô input lớn: Nhập `Mã đặt chỗ (VD: RSV-8821)` hoặc `Số CCCD` hoặc `Số điện thoại khách hàng`.
     - Nút quét mã QR từ camera quầy hoặc đầu đọc mã vạch.
  2. **Bảng đối chiếu thông tin xác thực (Verification Dossier):**
     - **Thông tin khách hàng:** Ảnh đại diện, Họ tên (`Trần Văn Bảo`), CCCD (`001202019988`), SĐT (`0987.654.321`).
     - **Tình trạng pháp lý đơn đặt chỗ:**
       - Trạng thái đơn: `RESERVED (Hợp lệ - Còn trong hạn check-in)`.
       - Tiền cọc đã ghi nhận: `1.500.000 VNĐ (Đã thanh toán qua VietQR - TxID: 998124)`.
       - Phòng kho đã được Manager gán: `UNIT A-102 (Tầng 1, Kho Medium 5m²)`.
       - Tình trạng phòng kho thực tế: `🟢 SẴN SÀNG BÀN GIAO (Đã dọn dẹp vệ sinh)`.
     - **Tình trạng thanh toán cước tháng đầu:**
       - Nếu chưa thanh toán: Hiển thị nút *"Thu tiền thuê kỳ đầu tại quầy (Tiền mặt / Thẻ / QR)"*.
       - Nếu đã thanh toán: Hiển thị badge xanh `ĐÃ NỘP ĐỦ`.
  3. **Bộ nút hành động điều hướng:**
     - Nút phụ: `In phiếu tiếp đón` | `Hủy đơn theo yêu cầu`.
     - Nút chính nổi bật: **"Xác nhận thông tin & Bắt đầu thủ tục Bàn giao kho"** -> Chuyển sang SCR-S03.

---

### SCR-S03: Check-in & Handover Protocol (Hỗ trợ check-in & Biên bản bàn giao kho)
- **Kích thước Frame:** `1440 x 960 px`
- **Mục tiêu:** Thực hiện quy trình bàn giao thực tế tại phòng kho: kiểm tra hiện trạng vật lý, cấp phát khóa/thẻ từ/kích hoạt mã PIN, ký xác nhận biên bản và kích hoạt hợp đồng.
- **Bố cục các vùng:**
  1. **Header biên bản:**
     - Mã biên bản: `HD-2026-0924-01` | Phòng kho: `UNIT A-102` | Khách nhận: `Trần Văn Bảo`.
  2. **Checklist kiểm tra hiện trạng phòng kho (Inspection Checklist):**
     - Switch 1: `Sàn kho sạch sẽ, không có rác tồn đọng` -> `[ Đạt ]`
     - Switch 2: `Cửa cuốn vận hành trơn tru, chốt khóa an toàn` -> `[ Đạt ]`
     - Switch 3: `Đèn chiếu sáng cảm biến hoạt động tốt` -> `[ Đạt ]`
     - Switch 4: `Vách ngăn nguyên vẹn, không móp méo/thấm dột` -> `[ Đạt ]`
     - Switch 5: `Cảm biến báo khói/PCCC hoạt động bình thường` -> `[ Đạt ]`
  3. **Bàn giao phương thức truy cập & Mã bảo mật (Access Handover):**
     - Cấp 01 Ổ khóa an toàn chịu lực + 02 Chìa khóa cơ (Mã khóa: `LOC-8812`).
     - Cấp 01 Thẻ từ RFID vào cổng tòa nhà 24/7 (Mã thẻ: `CRD-0419`).
     - Kích hoạt **Mã PIN điện tử 6 số:** Tạo tự động `894 210` (Đã đồng bộ lên app khách hàng).
  4. **Ký duyệt biên bản bàn giao (Sign-off):**
     - Chữ ký nhân viên thực hiện: `Nguyễn Văn Tuấn`.
     - Chữ ký xác nhận của khách hàng: Khách ký tay trên tablet hoặc xác nhận mã OTP trên điện thoại.
  5. **Hành động hoàn tất (Submit Handover):**
     - Nút CTA: **"Hoàn tất Bàn giao & Kích hoạt Hợp đồng"**.
     - Hệ thống tự động: Đổi trạng thái Reservation -> `CHECKED_IN`, Contract -> `ACTIVE`, Storage Unit -> `OCCUPIED`.

---

### SCR-S04: Unit Inventory & Status Matrix (Sơ đồ phòng kho & Cập nhật trạng thái)
- **Kích thước Frame:** `1440 x 900 px`
- **Mục tiêu:** Cung cấp ma trận mặt bằng phòng kho chi nhánh theo tầng, hỗ trợ nhân viên cập nhật tức thì trạng thái kho sau bàn giao, trả kho, bảo trì hoặc dọn dẹp.
- **Bố cục các vùng:**
  1. **Thanh điều khiển tầng & Bộ lọc trạng thái:**
     - Chọn tầng: `Tầng 1 (Khu A)` | `Tầng 2 (Khu B)` | `Tầng 3 (Khu C)`.
     - Bộ đếm màu:
       - `🟢 AVAILABLE (Trống): 18 kho`
       - `🟡 RESERVED (Đã giữ chỗ): 06 kho`
       - `🔴 OCCUPIED (Đang thuê): 92 kho`
       - `🟠 MAINTENANCE (Bảo trì/Sửa chữa): 02 kho`
       - `⚪ CLEANING (Đang vệ sinh): 02 kho`
  2. **Ma trận ô phòng kho tương tác (Interactive Floor Grid Map):**
     - Hiển thị lưới trực quan các ô phòng kho: `A-101`, `A-102`, `A-103`...
     - Mỗi ô kho hiển thị: Mã số, Loại kho (S/M/L), Diện tích, Màu viền trạng thái.
     - Khi rê chuột (Hover) hoặc Click vào 1 ô: Mở Drawer / Modal chi tiết ô kho.
  3. **Drawer cập nhật trạng thái kho nhanh (Quick Status Switcher Drawer):**
     - Thông tin kho đang chọn: `Phòng A-105 (Kho Medium - 5.0m²)`.
     - Trạng thái hiện tại: `OCCUPIED (Hợp đồng CTR-2026-004 - Khách: Hoàng Minh)`.
     - Dropdown chuyển trạng thái: `AVAILABLE` | `MAINTENANCE` | `CLEANING`.
     - Ô nhập lý do / Ghi chú kiểm tra bảo trì: Ví dụ *"Cần thay gioăng cao su cửa cuốn và thay bóng đèn cảm ứng"*.
     - Nút **"Lưu cập nhật trạng thái"** -> Đồng bộ tức thời trên hệ thống.

---

### SCR-S05: Return Inspection & Check-out Protocol (Nghiệm thu trả kho & Duyệt cọc)
- **Kích thước Frame:** `1440 x 960 px`
- **Mục tiêu:** Kiểm tra và xác nhận tình trạng thực tế của phòng kho khi khách hàng đến làm thủ tục trả kho, lập biên bản nghiệm thu, tính toán phụ phí vi phạm và hoàn trả tiền cọc.
- **Bố cục các vùng:**
  1. **Thông tin hợp đồng trả kho:**
     - Mã hợp đồng: `CTR-2026-001` | Phòng kho: `UNIT A-102` | Khách trả: `Trần Văn Bảo`.
     - Tiền cọc bảo đảm đang tạm giữ: **`1.500.000 VNĐ`**.
  2. **Biên bản kiểm tra thực địa khi trả (Return Inspection Audit):**
     - Tiêu chí 1: `Đã dọn sạch toàn bộ đồ đạc và hàng hóa cá nhân` -> `[ Có ]`
     - Tiêu chí 2: `Vệ sinh sàn kho sạch sẽ, không vấy bẩn dầu mỡ/hóa chất` -> `[ Đạt ]`
     - Tiêu chí 3: `Tình trạng tường, vách ngăn và cửa cuốn nguyên vẹn` -> `[ Đạt / Bị xước móp ]`
     - Tiêu chí 4: `Thu hồi đầy đủ 02 chìa khóa cơ và 01 thẻ từ ra vào` -> `[ Đã thu hồi ]`
     - Ghi nhận hư hại & Ảnh chụp hiện trường (nếu có vi phạm).
  3. **Bảng tính toán quyết toán tài chính & Hoàn cọc tự động:**
     - Tiền cọc ban đầu: `+ 1.500.000 đ`.
     - Phí vệ sinh bổ sung (nếu khách để lại rác): `- 0 đ`.
     - Phí bồi thường hư hại vách/ổ khóa: `- 0 đ`.
     - Phí phạt quá hạn trả kho (nếu trễ hẹn): `- 0 đ`.
     - **Số tiền cọc thực tế hoàn trả cho khách:** **`1.500.000 VNĐ`**.
     - Phương thức hoàn tiền: *Chuyển khoản về tài khoản ngân hàng của khách (MBBank - 0987654321)*.
  4. **Nút phê duyệt & Kết thúc:**
     - Khách hàng ký xác nhận biên bản thanh lý.
     - Staff nhấn nút: **"Xác nhận Nghiệm thu & Hoàn tất Check-out"**.
     - Hệ thống tự động: Vô hiệu hóa mã PIN, chuyển hợp đồng sang `TERMINATED`, đổi kho sang `CLEANING` để dọn dẹp trước khi cho thuê tiếp.

---

### SCR-S06: On-site Incident & Problem Desk (Xử lý sự cố tại quầy & Thực địa)
- **Kích thước Frame:** `1440 x 900 px`
- **Mục tiêu:** Tiếp nhận và xử lý nhanh chóng các sự cố phát sinh tại chỗ: khách mất chìa khóa, kẹt/quên mã PIN, hỏng hóc phòng kho đột xuất, hoặc xử lý các ticket yêu cầu hỗ trợ.
- **Bố cục các vùng:**
  1. **Bảng điều khiển công cụ khẩn cấp (Emergency Quick Actions):**
     - Nút 1: `🔑 Cấp lại / Phá khóa vật lý (Lost Key Protocol)`
     - Nút 2: `🔢 Reset & Cấp mã PIN điện tử tạm thời (60 phút)`
     - Nút 3: `🛠️ Báo bảo trì kỹ thuật khẩn cấp (Emergency Maintenance)`
     - Nút 4: `📝 Ghi nhận sự cố phát sinh tại quầy`
  2. **Hàng đợi xử lý sự cố tại chi nhánh (On-site Problem Queue):**
     - **Sự cố 1: Khách quên mã PIN kho A-102 (Khẩn cấp)**
       - Khách hàng xuất trình CCCD tại quầy đối chiếu.
       - Staff xác thực thông tin chính chủ -> Nhấn nút **"Tạo mã PIN mới"** -> Hệ thống sinh mã `451 902` và gửi SMS/App cho khách. Trạng thái: `ĐÃ GIẢI QUYẾT`.
     - **Sự cố 2: Khách báo mất chìa khóa kho B-205**
       - Staff lập biên bản mất chìa, thu phụ phí thay ổ khóa mới `150.000 đ`.
       - Tiến hành hỗ trợ cắt khóa cũ, thay ổ khóa mới và bàn giao bộ chìa mới cho khách.
     - **Sự cố 3: Đèn hành lang kho dãy A chập chờn**
       - Staff chuyển trạng thái sang `Đang sửa chữa`, phân công nhân viên kỹ thuật thay bóng đèn LED.
  3. **Nhật ký giải quyết sự cố (Resolution Audit Log):**
     - Ghi nhận chi tiết: Giờ xảy ra, Nhân viên xử lý, Biện pháp khắc phục, Chi phí phát sinh (nếu có).

---

## 5. Sơ đồ Luồng Tương tác Prototype (Interactive Prototyping Wires & Triggers)

Dưới đây là sơ đồ luồng kết nối dây (Interactive Wire Connections) khi trình diễn trên Figma Prototype:

### Luồng Customer (Hành trình Khách hàng từ Đặt kho đến Quản lý):
```
[SCR-C01: Catalog] 
    │ (Click nút "Đặt giữ chỗ" trên thẻ Kho Medium)
    ▼
[SCR-C02: Booking Modal]
    │ (Chọn ngày, thời hạn 3 tháng -> Click "Xác nhận & Thanh toán cọc")
    ▼
[SCR-C03: Payment & Invoices]
    │ (Chọn quét mã VietQR -> Click "Giả lập Thanh toán Thành công")
    ▼
[SCR-C04: Scheduled Check-in Pass]
    │ (Xuất trình mã QR tại quầy -> Staff hoàn tất bàn giao)
    ▼
[SCR-C05: My Rented Units Dashboard]
    ├── (Click icon con mắt -> Xem mã PIN: 894 210)
    ├── (Click "Gia hạn" -> Mở modal thanh toán tháng tiếp theo)
    ├── (Click "Trả kho" -> Gửi lịch hẹn Checkout)
    └── (Click "Báo cáo sự cố" -> Điều hướng sang SCR-C06)
    ▼
[SCR-C06: Customer Support Ticket]
    (Điền form -> Bấm gửi -> Ticket xuất hiện trên hàng đợi của Staff)
```

### Luồng Facility Staff (Hành trình Điều hành ca trực):
```
[SCR-S01: Daily Task Board]
    ├── (Click "Tiến hành Check-in" trên dòng đơn RSV-8821)
    │       ▼
    ├── [SCR-S02: Reservation Lookup]
    │       │ (Đối chiếu thông tin khách & tiền cọc -> Bấm "Bắt đầu Bàn giao")
    │       ▼
    ├── [SCR-S03: Check-in & Handover Protocol]
    │       │ (Tick 5 mục kiểm tra -> Cấp chìa & mã PIN -> Ký nhận -> Bấm "Hoàn tất")
    │       ▼
    ├── [SCR-S04: Unit Status Matrix] (Ô A-102 tự động chuyển từ Vàng sang Đỏ OCCUPIED)
    │
    ├── (Click "Nghiệm thu trả kho" trên dòng đơn trả)
    │       ▼
    ├── [SCR-S05: Return Inspection & Check-out]
    │       │ (Kiểm tra kho sạch -> Duyệt hoàn cọc 1.500.000đ -> Kết thúc hợp đồng)
    │       ▼
    └── [SCR-S06: On-site Incident Desk] (Tiếp nhận ticket sự cố, reset mã PIN, giải quyết mất chìa)
```

---

## 6. Hướng dẫn Copy-Paste & Dựng Khung trên Figma

Khi bạn mở Figma để vẽ các Frame:
1. **Tạo Frame:** Nhấn phím `F`, chọn kích thước **Desktop (1440 x 900)**.
2. **Cài đặt Grid Layout:**
   - Chọn Frame -> Bên phải mục *Layout Grid* bấm dấu `+`.
   - Chọn chuyển sang `Columns`: Count = `12`, Margin = `80px`, Gutter = `24px`.
3. **Màu sắc Styles (Color Styles):**
   - Tạo các Local Styles theo bảng token ở Mục 2.1 (`Primary/700`, `Success/600`, `Warning/500`, `Danger/600`, `Slate/50`...).
4. **Cài đặt Prototype Interactions:**
   - Chuyển sang tab **Prototype** trên thanh bên phải Figma.
   - Kéo mũi tên từ Nút "Đặt giữ chỗ" ở SCR-C01 sang Frame SCR-C02.
   - Chọn Action: `On click` -> `Navigate to` hoặc `Open overlay` -> Animation: `Smart Animate` (Ease Out, 300ms).
   - Tương tự kéo các nút theo đúng bản đồ tương tác ở Mục 5.

---

*(Bản đặc tả thiết kế này là cơ sở trực tiếp để dựng ứng dụng Prototype tương tác trực quan `Self_Storage_Figma_Prototype.html`).*
