# Demo Service 6 và 7 với Supabase

Tài liệu này chạy frontend với backend Spring Boot, backend đọc dữ liệu thật từ Supabase qua PostgreSQL. Không dùng profile `local` vì profile này dùng H2 seed.

## 0. Đăng ký và đăng nhập

Từ landing page hiện tại:

1. Bấm **Đăng ký**.
2. Nhập họ tên, email đang nhận được thư, số điện thoại Việt Nam 10 số, CCCD 12 số.
3. Chọn facility nếu cần, nhập username 4–20 ký tự thường/số/gạch dưới và mật khẩu tối thiểu 6 ký tự.
4. Bấm **Đăng ký**. Mở email, lấy OTP 6 số, nhập vào màn hình **Xác minh tài khoản**.
5. Sau khi xác minh thành công, bấm **Đăng nhập** và dùng username hoặc email cùng mật khẩu.

Đăng ký công khai luôn tạo role `CUSTOMER`. Tài khoản này dùng để xem kho, đặt chỗ và request trả kho. Để demo Service 6/7, đăng xuất rồi đăng nhập tài khoản Supabase đã được cấp sẵn với role `STAFF`, `FMANAGER` hoặc `OPS_MGR`; không đổi role bằng form đăng ký.

Nếu email OTP chưa đến, tìm trong Gmail bằng `in:anywhere "Storage Rental"`, kiểm tra Spam/All Mail, rồi xem terminal backend. Nếu Brevo trả lỗi, backend báo lỗi gửi email rõ ràng. Fallback OTP chỉ bật cho demo nội bộ bằng `$env:AUTH_OTP_LOG_FALLBACK='true'`; khi bật, mã 6 số in ở terminal và có hiệu lực 5 phút. Muốn Gmail nhận thật, xác minh sender `AUTH_MAIL_FROM`, cho phép public IP hiện tại trong Brevo, kiểm tra SMTP key còn hoạt động, rồi restart backend.

## Tạo tài khoản Staff/Manager demo trên Supabase

Nếu chưa có password ADMIN, dùng profile `demo-seed` một lần. Profile này tạo `manager_demo_hncg` với role `FMANAGER` và `staff_demo_hncg` với role `STAFF`, cùng facility `HN-CG`. Nó không sửa tài khoản đã tồn tại.

Trong terminal backend, dừng process cũ bằng `Ctrl+C`, rồi chạy:

```powershell
Set-Location C:\SWP391\demo-repository
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:DEMO_SEED_PASSWORD = 'NhapMotMatKhauDemoDai12KyTu!'
$env:APP_SCHEDULING_ENABLED = 'false'
$env:SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE = '2'
$env:SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE = '0'
mvn -f backend/pom.xml spring-boot:run "-Dspring-boot.run.profiles=auth-supabase,demo-seed"
```

Sau khi backend khởi động, đăng nhập bằng username `manager_demo_hncg` hoặc `staff_demo_hncg` và password đã chọn. Sau lần tạo đầu tiên, dừng backend và chạy lại chỉ với profile `auth-supabase`; không bật `demo-seed` thường xuyên trên database thật.

## 1. Chuẩn bị biến môi trường

Secrets nằm trong file Git-ignored `storage-rental-secrets/backend.properties`. File cần có các biến:

```properties
SUPABASE_DB_URL=jdbc:postgresql://...
SUPABASE_DB_USERNAME=...
SUPABASE_DB_PASSWORD=...
JWT_SECRET=...
```

Không ghi giá trị secret vào Git hoặc chat. Schema phải tương thích Entity hiện tại; backend giữ `spring.jpa.hibernate.ddl-auto=validate`.

## 2. Chạy backend và frontend

Mở PowerShell 1 và chuyển vào đúng thư mục project:

```powershell
Set-Location C:\SWP391\demo-repository
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:APP_SCHEDULING_ENABLED = 'false'
java -version
mvn -version
mvn -f backend/pom.xml spring-boot:run "-Dspring-boot.run.profiles=auth-supabase"
```

Mở PowerShell 2 và cũng chuyển vào project:

```powershell
Set-Location C:\SWP391\demo-repository
$env:BACKEND_URL = 'http://127.0.0.1:8080'
npm run dev
```

Mở `http://127.0.0.1:5173`. Vite proxy chuyển `/api` tới backend. Kiểm tra API đọc Supabase:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/facilities
Invoke-RestMethod 'http://127.0.0.1:8080/api/facilities/units?facilityCode=HN-CG'
```

API reports cần JWT nên trả `401` nếu chưa đăng nhập.

## 3. Demo Service 6: vận hành task Staff

Đăng nhập bằng tài khoản Manager có facility hợp lệ.

1. Mở **Staff Assignment**.
2. Chọn facility, ngày làm việc, loại task (`GENERAL`, `CLEANING` hoặc `MAINTENANCE`), nhập tiêu đề/mô tả và tạo task.
3. Chọn Staff cùng facility rồi assign task.
4. Đăng xuất, đăng nhập tài khoản Staff.
5. Mở **Staff Task Board**, lọc ngày và trạng thái. Task vừa assign phải xuất hiện từ API thật.
6. Với task cleaning/general/maintenance, bấm Start rồi Complete.
7. Với reservation check-in, mở task, xác nhận thông tin khách/credential/handover rồi hoàn tất check-in.
8. Với return task, mở **Return Inspection**, nhập số điện/nước, tình trạng unit, phí phát sinh và submit. Backend đóng return task, kết thúc contract, xoá PIN, chuyển unit sang `cleaning`, rồi tạo cleaning task.
9. Mở lại Staff Task Board để xử lý cleaning task mới.

Support ticket liên quan cũng đi qua API thật: Staff xem ticket mở trong board; Manager/Staff cập nhật ticket theo facility và trạng thái hợp lệ.

## 4. Demo Service 7: báo cáo và export

Đăng nhập Manager/Operations Manager.

1. Mở **Reports**.
2. Chọn khoảng ngày rồi bấm tải lại.
3. Kiểm tra tổng branch/unit, occupied/available, occupancy rate, rental receipts, deposit receipts, fee receipts và completed refunds.
4. Kiểm tra bảng breakdown theo facility. FMANAGER chỉ thấy facility của mình; OPS_MGR có thể xem chain hoặc chọn facility.
5. Bấm **Export CSV** hoặc **Export XLSX**. Frontend gửi Bearer token, backend tạo file từ truy vấn SQL Supabase.
6. Mở file tải về và đối chiếu một facility với số liệu trên màn hình.

Payments lọc theo `created_at`; refunds lọc theo `completed_at`; occupancy là trạng thái Unit hiện tại. Vì vậy đổi khoảng ngày không làm occupancy lịch sử giả tạo.

## 5. Kiểm tra trước khi bàn giao

```powershell
npm run check
mvn -B -f backend/pom.xml test
node scripts/check-contract.mjs
git diff --check
```

VNPay, gửi OTP/email và PIN IoT hiện vẫn là integration mô phỏng theo phạm vi project; dữ liệu Service 6/7, task, ticket, facility, unit, payment, refund và report đã đi qua backend/API và Supabase thật.
