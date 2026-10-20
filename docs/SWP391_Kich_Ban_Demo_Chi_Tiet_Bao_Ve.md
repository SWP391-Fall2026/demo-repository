# HƯỚNG DẪN & KỊCH BẢN DEMO TOÀN DIỆN DỰ ÁN SWP391
## HỆ THỐNG QUẢN LÝ VÀ CHO THUÊ KHO LƯU TRỮ TỰ PHỤC VỤ (SELF-STORAGE)
**Môn học:** Software Development Project (Kỳ 7 - FPT University)  
**Mục tiêu bảo vệ:** Đạt điểm Xuất sắc (9.0 – 10.0)  
**Thời lượng dự kiến:** 15 – 20 phút (Trình bày + Q&A)

---

## MỤC LỤC
1. [Checklist Chuẩn Bị Kỹ Thuật Trước Giờ G](#1-checklist-chuẩn-bị-kỹ-thuật-trước-giờ-g)
2. [Bảng Tra Cứu Tài Khoản 5 Roles Phân Quyền](#2-bảng-tra-cứu-tài-khoản-5-roles-phân-quyền)
3. [Chi Tiết Kịch Bản Demo 7 Giai Đoạn (Có Lời Thoại & Thao Tác)](#3-chi-tiết-kịch-bản-demo-7-giai-đoạn)
   - [Giai đoạn 1: Khách hàng đăng ký OTP, Tra cứu & Đặt cọc](#giai-đoạn-1-khách-hàng-đăng-ký-otp-tra-cứu--đặt-cọc)
   - [Giai đoạn 2: Quản lý chi nhánh điều phối & Gán phòng kho](#giai-đoạn-2-quản-lý-chi-nhánh-điều-phối--gán-phòng-kho)
   - [Giai đoạn 3: Nhân viên quầy tiếp đón, Check-in & Bàn giao kho](#giai-đoạn-3-nhân-viên-quầy-tiếp-đón-check-in--bàn-giao-kho)
   - [Giai đoạn 4: Khách hàng nhận mã PIN & Mô phỏng mở cửa kho](#giai-đoạn-4-khách-hàng-nhận-mã-pin--mô-phỏng-mở-cửa-kho)
   - [Giai đoạn 5: Khách hàng gửi yêu cầu trả kho, Nghiệm thu & Hoàn cọc](#giai-đoạn-5-khách-hàng-gửi-yêu-cầu-trả-kho-nghiệm-thu--hoàn-cọc)
   - [Giai đoạn 6: Quản lý vận hành toàn chuỗi (Ops Manager)](#giai-đoạn-6-quản-lý-vận-hành-toàn-chuỗi-ops-manager)
   - [Giai đoạn 7: Quản trị viên hệ thống (Admin) & Audit Trail](#giai-đoạn-7-quản-trị-viên-hệ-thống-admin--audit-trail)
4. [Bộ Câu Hỏi Phản Biện Của Hội Đồng & Câu Trả Lời Điểm 10](#4-bộ-câu-hỏi-phản-biện-của-hội-đồng--câu-trả-lời-điểm-10)
5. [Cẩm Nang Xử Lý Sự Cố Khẩn Cấp (Troubleshooting Cheat-Sheet)](#5-cẩm-nang-xử-lý-sự-cố-khẩn-cấp)

---

## 1. CHECKLIST CHUẨN BỊ KỸ THUẬT TRƯỚC GIỜ G

Trước khi bước vào phòng bảo vệ hoặc bật màn hình chia sẻ (Share Screen):

- [ ] **Kiểm tra Backend Spring Boot:**
  * Mở trình duyệt truy cập: `http://localhost:8080/api/auth/login` (nếu không báo lỗi "Unable to connect" là Backend đang chạy tốt).
  * Port đang sử dụng: `8080`.
- [ ] **Kiểm tra Frontend:**
  * Mở trình duyệt truy cập: `http://localhost:3000` (hoặc mở trực tiếp file `frontend/index.html` qua Live Server).
- [ ] **Kết nối CSDL Supabase Cloud:**
  * File `.env` đã được cấu hình trỏ vào Supabase Tokyo Pooler: `aws-0-ap-northeast-1.pooler.supabase.com`.
  * Tài khoản đã đồng bộ vào bảng `users` trên Supabase Dashboard.
- [ ] **Kỹ thuật mở sẵn 2 Cửa sổ Trình duyệt:**
  * **Cửa sổ 1 (Chrome thường):** Dùng để thao tác vai trò **Khách hàng** (`khoa` hoặc `customer`).
  * **Cửa sổ 2 (Tab ẩn danh Incognito hoặc Microsoft Edge):** Dùng để đăng nhập vai trò **Quản lý / Nhân viên** (`manager`, `staff`).
  * *Lợi ích:* Không mất thời gian Logout/Login liên tục, thể hiện dữ liệu thay đổi tức thì giữa 2 bên.

---

## 2. BẢNG TRA CỨU TÀI KHOẢN 5 ROLES PHÂN QUYỀN

| STT | Tên hiển thị | Vai trò (Role) | Tên đăng nhập | Mật khẩu | Phạm vi dữ liệu (Scope) |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Diệp Đưng Khoa** | `CUSTOMER` (Khách hàng) | `khoa` | Mật khẩu lúc tạo | Chỉ xem hợp đồng, kho và PIN của mình |
| **2** | **Trần Văn Bảo** | `CUSTOMER` (Khách mẫu) | `customer` | `1` | Dữ liệu cá nhân mẫu có sẵn hợp đồng |
| **3** | **Nguyễn Văn Tuấn** | `STAFF` (Nhân viên quầy) | `staff` | `3` | Thao tác check-in, nghiệm thu tại **Cầu Giấy** |
| **4** | **Phạm Hải Đăng** | `FMANAGER` (Quản lý chi nhánh) | `manager` | `4` | Toàn quyền quản lý cơ sở **Cầu Giấy (HN-CG)** |
| **5** | **Đặng Hoàng Long** | `OPS_MGR` (GĐ Vận hành chuỗi) | `business` | `5` | Toàn quyền biểu giá, chính sách **5 chi nhánh** |
| **6** | **Quản trị viên** | `ADMIN` (System Admin) | `admin` | `2` | Quản trị tài khoản toàn hệ thống, Audit Log |

---

## 3. CHI TIẾT KỊCH BẢN DEMO 7 GIAI ĐOẠN

### 🎙️ LỜI MỞ ĐẦU (1 PHÚT)
> *"Kính thưa thầy/cô trong Hội đồng bảo vệ, nhóm chúng em xin phép được trình bày sản phẩm: **Hệ thống Quản lý và Cho thuê Kho lưu trữ Tự phục vụ (Self-Storage Facility Management System)**.  
> Mô hình Self-Storage hiện tại ở Việt Nam gặp rào cản lớn do quản lý phân mảnh bằng sổ sách và chìa khóa cơ, dễ thất thoát và khó đối soát cọc. Dự án của chúng em giải quyết triệt để vấn đề này bằng một nền tảng Web tập trung, kiểm soát 100% vòng đời thuê kho, phân quyền nghiêm ngặt 5 vai trò (RBAC) và tích hợp mã PIN điện tử tự phục vụ. Sau đây em xin bắt đầu quy trình nghiệp vụ thực tế của hệ thống."*

---

### Giai đoạn 1: Khách hàng đăng ký OTP, Tra cứu & Đặt cọc
* **Tài khoản:** Khách hàng mới hoặc `khoa` / `customer`
* **Màn hình demo:** `SCR-C00` $\rightarrow$ `SCR-C01` $\rightarrow$ `SCR-C02` $\rightarrow$ `SCR-C03`

#### Bước 1.1: Đăng ký xác thực Email OTP thật
* **Thao tác:** Bấm nút **Đăng ký** ở góc trên bên phải.
* **Lời thoại:** *"Đầu tiên, để đảm bảo an toàn thông tin và định danh khách hàng, hệ thống bắt buộc xác thực số điện thoại, CCCD chuẩn 12 số của Bộ Công An và gửi mã OTP 6 số trực tiếp vào hòm thư Gmail thật của người dùng thông qua giao thức Java Mail SMTP."*
* **Điểm nhấn kỹ thuật:**
  * Thuật toán kiểm tra số CCCD: 3 số đầu là mã tỉnh hợp lệ, số thứ 4 là thế kỷ/giới tính, 2 số tiếp theo khớp đúng năm sinh.
  * Nhập mã OTP 6 số vào giao diện ô vuông tự động nhảy con trỏ.

#### Bước 1.2: Tra cứu danh mục kho & Bảng giá (`SCR-C01`)
* **Thao tác:** Chọn cơ sở **Cơ sở Cầu Giấy (120 Duy Tân)**.
* **Lời thoại:** *"Khách hàng xem danh mục các loại kho: Kho Mini Cỡ S (2m²), Cỡ M (5m²), Cỡ L (10m²) kèm hình ảnh trực quan, kích thước và đơn giá niêm yết minh bạch."*

#### Bước 1.3: Đặt giữ chỗ trực tuyến (`SCR-C02`)
* **Thao tác:** Chọn kho Cỡ M (5.0 m²) $\rightarrow$ Bấm **Đặt giữ chỗ trực tuyến**.
  * Ngày bắt đầu thuê: Hôm nay.
  * Thời hạn thuê: **3 tháng**.
* **Lời thoại:** *"Hệ thống tự động tính toán số tiền cọc (tương đương 1 tháng thuê là 1.450.000 VNĐ) và thời hạn giữ chỗ tối đa 24 giờ để khách hàng kịp đến làm thủ tục nhận kho."*

#### Bước 1.4: Nộp tiền cọc qua VietQR (`SCR-C03`)
* **Thao tác:** Bấm **Tiến hành đặt cọc** $\rightarrow$ Hệ thống hiển thị Modal mã VietQR thanh toán chuẩn NAPAS có kèm mã đơn đặt chỗ (ví dụ: `RSV-8821`). Bấm **Xác nhận đã thanh toán cọc**.
* **Kết quả:** Đơn hàng chuyển sang trạng thái `RESERVED / PENDING_CHECKIN` và phát sinh **Thẻ hẹn Check-in Pass (`SCR-C04`)**.

---

### Giai đoạn 2: Quản lý chi nhánh điều phối & Gán phòng kho
* **Chuyển sang Cửa sổ 2:** Đăng nhập `manager` / pass `4` (Phạm Hải Đăng - Quản lý cơ sở Cầu Giấy)
* **Màn hình demo:** `SCR-M01` (Dashboard chi nhánh) $\rightarrow$ `SCR-M03` (Gán phòng kho)

#### Bước 2.1: Giám sát tình trạng chi nhánh (`SCR-M01`)
* **Thao tác:** Xem các chỉ số: Tổng số phòng (120 kho), Tỉ lệ lấp đầy (82%), Doanh thu tháng.
* **Lời thoại:** *"Tại văn phòng chi nhánh Cầu Giấy, Quản lý cơ sở theo dõi tức thì đơn đặt vừa phát sinh từ khách hàng."*

#### Bước 2.2: Gán phòng kho cụ thể (`SCR-M03`)
* **Thao tác:** Vào tab **Gán phòng kho**, thấy đơn đặt chỗ của khách.
  * Danh sách phòng kho trống cỡ M hiển thị: `A-102`, `A-110`, `A-112`.
  * Chọn kho **A-102** $\rightarrow$ Bấm **Xác nhận gán phòng kho**.
* **Lời thoại:** *"Khách hàng chỉ đặt loại kho cỡ M, quyền quyết định chọn phòng kho cụ thể nào (A-102 tầng 1 hay tầng 2) thuộc về Quản lý cơ sở để tối ưu sơ đồ mặt bằng."*
* **Điểm nhấn RBAC:** *"Tài khoản Manager Cầu Giấy chỉ nhìn thấy danh sách kho thuộc mã `HN-CG`, hoàn toàn không thể xem hoặc gán kho thuộc cơ sở Quận 7 (TP.HCM) hay Đà Nẵng."*

---

### Giai đoạn 3: Nhân viên quầy tiếp đón, Check-in & Bàn giao kho
* **Đăng nhập:** `staff` / pass `3` (Nguyễn Văn Tuấn - Nhân viên trực quầy)
* **Màn hình demo:** `SCR-S01` (Daily Tasks) $\rightarrow$ `SCR-S03` (Bàn giao kho)

#### Bước 3.1: Theo dõi danh sách công việc trong ngày (`SCR-S01`)
* **Thao tác:** Nhân viên mở **Lịch công việc hàng ngày**, thấy task: *"Tiếp đón khách hàng nhận bàn giao kho A-102"*.

#### Bước 3.2: Lập biên bản bàn giao & Cấp mã truy cập (`SCR-S03`)
* **Thao tác:** Bấm **Bắt đầu hỗ trợ bàn giao**:
  * Kiểm tra và đối chiếu số CCCD thực tế của khách hàng.
  * Tích chọn: Đã kiểm tra vệ sinh phòng kho, Đã bàn giao thẻ/ổ khóa.
  * Bấm **Hoàn tất bàn giao kho**.
* **Lời thoại:** *"Sau khi nhân viên bấm hoàn tất, Backend Spring Boot sẽ kích hoạt Hợp đồng thuê (`Contract - ACTIVE`), đồng thời thuật toán bảo mật tự động sinh một **Mã PIN điện tử 6 số ngẫu nhiên** và lưu mã hóa vào hợp đồng của khách."*

---

### Giai đoạn 4: Khách hàng nhận mã PIN & Mô phỏng mở cửa kho
* **Chuyển lại Cửa sổ 1:** Khách hàng
* **Màn hình demo:** `SCR-C05` (Kho đang thuê) $\rightarrow$ `SCR-S07` (Mô phỏng bàn phím)

#### Bước 4.1: Tra cứu mã PIN điện tử cá nhân (`SCR-C05`)
* **Thao tác:** Khách hàng mở mục **Quản lý kho đang thuê**.
  * Thấy kho `A-102` đã chuyển sang trạng thái: **Đang hoạt động (ACTIVE)**.
  * Bấm nút **Xem mã PIN** $\rightarrow$ Hiện mã PIN 6 số (ví dụ: `842916`).

#### Bước 4.2: Trải nghiệm mở cửa kho tự phục vụ (`SCR-S07`)
* **Thao tác:** Bấm sang mục **Mô phỏng Mở khóa kho**:
  * Bấm bàn phím số ảo: `8 - 4 - 2 - 9 - 1 - 6` $\rightarrow$ Bấm nút **MỞ KHÓA (UNLOCK)**.
  * Màn hình sáng đèn xanh: **"Xác thực mã PIN chính xác! Chốt khóa điện tử đã mở. Chào mừng bạn vào kho A-102"**.
* **Thử nghiệm ngoại lệ (Negative Test):**
  * Thử gõ sai mã `1 - 2 - 3 - 4 - 5 - 6` $\rightarrow$ Màn hình chớp đỏ cảnh báo: **"Mã PIN không hợp lệ! Vui lòng kiểm tra lại"**.
* **Lời thoại:** *"Khách hàng hoàn toàn chủ động ra vào kho 24/7 mà không cần nhân viên phải đi theo mở khóa thủ công."*

---

### Giai đoạn 5: Khách hàng gửi yêu cầu trả kho, Nghiệm thu & Hoàn cọc
* **Màn hình demo:** `SCR-C05` (Khách checkout) $\rightarrow$ `SCR-S05` (Staff nghiệm thu) $\rightarrow$ `SCR-M05` (Manager duyệt cọc)

#### Bước 5.1: Khách hàng gửi yêu cầu Check-out
* **Thao tác:** Tại kho `A-102`, khách hàng bấm nút **Gửi yêu cầu trả kho / Kết thúc hợp đồng**.

#### Bước 5.2: Nhân viên kiểm tra phòng kho (`SCR-S05`)
* **Thao tác (Cửa sổ Staff):** Nhân viên mở màn hình **Kiểm tra & Nghiệm thu khi trả kho**:
  * Kiểm tra tình trạng vách kho: Đạt tiêu chuẩn.
  * Tình trạng vệ sinh: Sạch sẽ.
  * Không phát sinh hư hại $\rightarrow$ Phí phạt = `0 VNĐ`.
  * Bấm **Lập biên bản nghiệm thu đạt chuẩn**.

#### Bước 5.3: Quản lý chi nhánh duyệt hoàn trả tiền cọc
* **Thao tác (Cửa sổ Manager):** Quản lý mở đơn nghiệm thu $\rightarrow$ Bấm **Duyệt hoàn trả 1.450.000 VNĐ tiền cọc** cho khách hàng qua tài khoản ngân hàng.
* **Kết quả:** Hợp đồng chuyển sang `TERMINATED`, phòng kho `A-102` tự động cập nhật về trạng thái **Sẵn sàng cho thuê (available)** để đón khách hàng tiếp theo.

---

### Giai đoạn 6: Quản lý vận hành toàn chuỗi (Ops Manager)
* **Đăng nhập:** `business` / pass `5` (Đặng Hoàng Long - GĐ Vận hành)
* **Màn hình demo:** `SCR-O01` (Dashboard chuỗi) $\rightarrow$ `SCR-O03` (Biểu giá) $\rightarrow$ `SCR-O05` (Chính sách)

#### Bước 6.1: So sánh hiệu quả kinh doanh 5 chi nhánh (`SCR-O01`)
* **Lời thoại:** *"Ở cấp độ điều hành chuỗi, GĐ Vận hành theo dõi bức tranh toàn cảnh: Tổng số 560 kho trên cả nước, Doanh thu toàn chuỗi đạt hơn 648 triệu VNĐ/tháng và Tỷ lệ lấp đầy bình quân 78.5%."*
* **Thao tác:** Xem biểu đồ so sánh giữa cơ sở Cầu Giấy (82%), cơ sở Quận 7 (85%), cơ sở Đà Nẵng (66%).

#### Bước 6.2: Ban hành chính sách giá & Chiết khấu (`SCR-O03` & `SCR-O05`)
* **Thao tác:** Điều chỉnh mức chiết khấu cho khách thuê 12 tháng từ 10% lên **15%** $\rightarrow$ Bấm **Cập nhật chính sách toàn chuỗi**. Toàn bộ hệ thống lập tức áp dụng mức giá ưu đãi này khi khách hàng tính tiền ở Giai đoạn 1.

---

### Giai đoạn 7: Quản trị viên hệ thống (Admin) & Audit Trail
* **Đăng nhập:** `admin` / pass `2` (Quản trị viên)
* **Màn hình demo:** `SCR-A02` (Quản trị tài khoản) $\rightarrow$ `SCR-A05` (Audit Logs)

#### Bước 7.1: Quản trị tài khoản & Khóa/Mở khóa tức thì (`SCR-A02`)
* **Thao tác:** Tìm tài khoản `khoa`, chỉ cho thầy cô thấy tài khoản được phân Role `CUSTOMER`, trạng thái `ACTIVE`.
* **Thao tác thử nghiệm:** Bấm nút **Khóa tài khoản (Lock)** $\rightarrow$ Tài khoản bị khóa ngay lập tức và không thể đăng nhập. Bấm **Mở khóa (Unlock)** để phục hồi.

#### Bước 7.2: Bằng chứng kiểm toán an toàn thông tin - Audit Logs (`SCR-A05`)
* **Thao tác:** Mở bảng **Nhật ký hoạt động thời gian thực (Real-time Audit Trail)**.
* **Lời thoại (Điểm chốt hạ ấn tượng nhất):**  
  > *"Kính thưa thầy cô, điểm khác biệt lớn nhất giữa một đồ án trung bình và đồ án xuất sắc là tính năng **Audit Logging**.  
  > Toàn bộ các thao tác chúng em vừa thực hiện từ đầu buổi Demo:
  > - Khách hàng thanh toán cọc (`PAYMENT_CONFIRM`)
  > - Manager gán kho A-102 (`ASSIGN_UNIT`)
  > - Staff hoàn tất bàn giao (`HANDOVER_UNIT`)
  > - Khách mở khóa PIN thành công (`UNLOCK_ATTEMPT`)
  > Tất cả đều được Backend ghi nhận tự động vào bảng Audit Logs với đầy đủ: **Thời gian chính xác tới từng giây, Tên Actor, Địa chỉ IP máy gửi và Trạng thái SUCCESS/FAILED**, hoàn toàn không thể xóa sửa, đảm bảo chuẩn mực bảo mật doanh nghiệp."*

---

## 4. BỘ CÂU HỎI PHẢN BIỆN CỦA HỘI ĐỒNG & CÂU TRẢ LỜI ĐIỂM 10

### Câu 1: "Hệ thống bảo vệ phân quyền RBAC ở Client hay Server?"
* **Trả lời chuẩn:**  
  *"Dạ thưa thầy/cô, hệ thống áp dụng nguyên tắc **Zero Trust** bảo vệ 2 lớp:  
  1. Ở **Frontend**: Giao diện chỉ hiển thị các màn hình và menu tương ứng với Role của người dùng để tối ưu trải nghiệm.  
  2. Ở **Backend**: Toàn bộ các API Controller đều được bảo vệ bằng Spring Security với annotation `@PreAuthorize("hasRole('FMANAGER')")` và giải mã JSON Web Token (JWT). Nếu người dùng cố tình gửi request can thiệp API của quyền khác, Backend sẽ trả về ngay mã lỗi **403 Forbidden**."*

### Câu 2: "Làm thế nào để Manager chi nhánh Cầu Giấy không xem trộm được dữ liệu của chi nhánh Quận 7 (chống lỗi IDOR)?"
* **Trả lời chuẩn:**  
  *"Dạ, trong JWT Token của người dùng luôn được nhúng kèm `facilityCode` (ví dụ `HN-CG`). Khi Manager gửi request lấy danh sách kho hoặc hợp đồng, tầng Service của Backend luôn tự động thêm điều kiện lọc: `WHERE facility_code = user.getFacilityCode()`. Nhờ đó, dữ liệu giữa các chi nhánh được cách ly hoàn toàn ở tầng CSDL."*

### Câu 3: "Dữ liệu của hệ thống đang được lưu trữ ở đâu? Tắt máy có bị mất không?"
* **Trả lời chuẩn:**  
  *"Dạ, hệ thống hiện được kết nối trực tiếp với **Cơ sở dữ liệu đám mây Supabase PostgreSQL** đặt tại Data Center Tokyo qua Connection Pooler IPv4. Đồng thời, cấu hình Backend hỗ trợ chuyển đổi linh hoạt sang cơ chế Persistent File H2 Database. Vì vậy, dữ liệu được lưu trữ vĩnh viễn trên đĩa cứng/cloud, dù tắt máy, khởi động lại Windows hay đổi sang máy tính khác thì toàn bộ tài khoản và hợp đồng vẫn còn nguyên vẹn 100%."*

### Câu 4: "Tại sao nhóm không lắp đặt mạch điều khiển khóa IoT thực tế?"
* **Trả lời chuẩn:**  
  *"Dạ thưa thầy/cô, theo đúng **Tài liệu Đặc tả Phạm vi (Project Scope Baseline)** đã được phê duyệt ở đầu kỳ, dự án định vị là phần mềm doanh nghiệp (Enterprise Management Software). Nhóm tập trung giải quyết trọn vẹn nghiệp vụ chuỗi, quản lý kho trống, tính cọc tự động và kiểm toán tài chính. Việc mua sắm phần cứng cơ khí thuộc phạm vi Out-of-Scope và được mô phỏng hoàn hảo qua bàn phím mã PIN 6 số điện tử."*

---

## 5. CẨM NANG XỬ LÝ SỰ CỐ KHẨN CẤP (TROUBLESHOOTING CHEAT-SHEET)

| Hiện tượng | Nguyên nhân | Cách khắc phục ngay trong 10 giây |
| :--- | :--- | :--- |
| **Bấm Đăng nhập không phản hồi** | Backend Spring Boot chưa bật | Mở Terminal chạy: `java -jar backend/target/selfstorage-backend-1.0.0.jar` |
| **Báo lỗi 400 khi bấm Đăng ký** | Tên đăng nhập hoặc Email bị trùng | Đổi tên đăng nhập khác (ví dụ: `khoa2026`) hoặc chuyển sang tab **Đăng nhập** |
| **Quên mật khẩu tài khoản vừa tạo** | Quên mật khẩu cá nhân | Sử dụng tài khoản mẫu có sẵn: `customer` (pass `1`), `manager` (pass `4`), `admin` (pass `2`) |
| **Mất kết nối Internet phòng thi** | Không vào được Supabase Cloud | Mở `.env`, thêm dấu `#` trước dòng `DATABASE_URL` để hệ thống tự động chuyển sang Database offline lưu sẵn trên máy |

---
*Tài liệu được biên soạn phục vụ bảo vệ đồ án chuyên ngành Kỹ thuật Phần mềm (SWP391) - Chúc nhóm đạt kết quả xuất sắc!*
