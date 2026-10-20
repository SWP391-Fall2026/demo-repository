# Hướng dẫn test API bằng Postman

## 1. Chuẩn bị

1. Khởi động PostgreSQL/Supabase đã cấu hình trong `.env`.
2. Khởi động backend:

```powershell
cd D:\Project\Project\backend
mvn spring-boot:run
```

3. Kiểm tra backend trả dữ liệu:

```powershell
Invoke-RestMethod http://localhost:8080/api/facilities
```

Kết quả đúng có `success: true` và danh sách chi nhánh.

4. Mở Postman.
5. Import hai file:
   - `postman/SelfStorage-Real-API.postman_collection.json`
   - `postman/SelfStorage-Local.postman_environment.json`
6. Chọn environment `SelfStorage Local Environment` ở góc phải Postman.
7. Kiểm tra `baseUrl = http://localhost:8080`.

Không dùng `http://localhost:3000` khi test trực tiếp backend. Port `3000` chỉ dành cho frontend proxy.

## 1.1. Kết quả kiểm tra backend hiện tại

Backend đã được chạy với Supabase và kiểm tra trực tiếp: `5` facilities, inventory HN-CG trả `20` units, quote reservation trả `success: true`, reservation `RSV-8821` đọc được, customer có `1` contract, manager scope trả `2` units, chain stats trả thành công, bank-info trả thành công, customer gọi Admin API nhận `403`.

Nếu một tài khoản actor trả `Thông tin không hợp lệ!`, đó là credential trong database hiện tại khác seed README. Sửa biến credential trong Postman environment; không coi đó là lỗi API.

## 2. Token và biến dùng chung

Folder `00 - Authentication` có 5 request login. Mỗi request tự lưu JWT vào biến:

| Actor | Biến token | Username mặc định | Password mặc định |
|---|---|---|---|
| Customer | `customerToken` | `customer` | `1` |
| Staff | `staffToken` | `staff` | `3` |
| Facility Manager | `managerToken` | `manager` | `4` |
| Operations Manager | `opsToken` | `business` | `5` |
| Admin | `adminToken` | `admin` | `2` |

Nếu tài khoản trong Supabase đã đổi mật khẩu, sửa các biến `...Username` và `...Password` trong environment. Không paste JWT vào source code.

Login trả đúng phải có:

```json
{
  "success": true,
  "data": { "role": "CUSTOMER" },
  "token": "eyJ..."
}
```

Nếu nhận `401` hoặc `Thông tin không hợp lệ!`, kiểm tra username/password trong environment và trạng thái tài khoản.

## 3. Flow 1: Tìm kho, reservation, tiền cọc

Chạy lần lượt trong folder `02 - Flow 1 Customer reservation and deposit`:

1. `Calculate reservation quote`
   - Body chọn `unitType` (`S`, `M`, `L`, `CLIMATE`) và `durationMonths`.
   - Test script tự lưu `depositAmount` và `monthlyRate`.
2. `Create reservation`
   - Backend kiểm tra facility, loại kho, ngày bắt đầu và tồn kho.
   - Test script tự lưu `reservationId`.
3. `Get reservation`
   - Xác nhận reservation thuộc customer đang login.
4. `Pay deposit`
   - Backend kiểm tra số tiền đúng invoice.
   - Kết quả thường `201 Created`.
5. `List my reservations`
   - Xác nhận trạng thái chuyển từ `PENDING_PAYMENT` sang `RESERVED`.

Nếu `No available unit matches...`, đổi `facilityCode` hoặc `unitType`. Nếu đã chạy cùng reservation trước đó, tạo reservation mới hoặc dùng ID hiện có.

## 4. Flow 5: Manager gán Unit và phân công Staff

Chạy folder `03 - Flow 5 Manager assignment and staff dispatch`:

1. `Manager session`.
2. `Managed units`.
   - Chọn một Unit có `status: available`.
   - Ghi `code` vào environment variable `unitCode`.
3. `Facility staff`.
   - Ghi `id` nhân viên ACTIVE vào `staffId`.
4. `Reservations awaiting assignment`.
5. `Assign unit`.
   - Body dùng `{"unitCode":"{{unitCode}}"}`.
   - Reservation phải là `RESERVED` và Unit phải cùng facility với manager.
6. `Dispatch staff task`.
   - Body dùng `staffId`, `reservationId`, `date`.
   - Kết quả tạo `TSK-...`.

Lỗi `Unit belongs to another facility` là đúng RBAC: manager không được gán Unit khác chi nhánh.

## 5. Flow 2: Thanh toán thuê, check-in, bàn giao và cấp PIN

Chạy folder `04 - Flow 2, 3 and checkout` sau khi gán Unit:

1. `Pay first month rent`
   - Cần reservation `RESERVED` và đã có `unitCode`.
   - Amount dùng `{{monthlyRate}}` do quote lưu.
2. `Staff daily tasks`.
3. `Staff lookup reservation`.
4. `Complete handover and issue PIN`.
   - Cần deposit PAID, rent PAID và `customerSignatureConfirmed: true`.
   - Test script lưu `contractId` và `unitCode`.
   - Contract trả về PIN trong `pinCode`.
5. Customer chạy `Customer contracts after handover`.
6. Ghi `pinCode` từ response vào environment.
7. Chạy `Verify PIN`.
8. Chạy `Change personal PIN` nếu cần đổi PIN.

Lỗi `First month rent is not paid` nghĩa là phải chạy payment rent trước handover. Lỗi `Deposit is not paid` nghĩa là phải chạy deposit trước.

## 6. Flow 3: Quản lý kho và trả kho

Sau khi có `contractId` và `unitCode`:

1. Customer chạy `Customer checkout request`.
2. Staff chạy `Staff return inspection`.
   - `cleanlinessStatus: CLEAN` không trừ phí vệ sinh.
   - `cleanlinessStatus: NEEDS_CLEANING` tính phí theo policy backend.
   - `lockDamaged: true` tính phí thay khóa theo policy backend.
3. Manager chạy `Manager approve refund`.
4. Kiểm tra lại:
   - Contract chuyển `TERMINATED`.
   - Unit chuyển `available` hoặc `cleaning`.
   - Payment refund được tạo với `paymentMethod: REFUND`.

Đây là flow ghi dữ liệu thật vào Supabase. Không chạy lặp trên dữ liệu quan trọng nếu chưa muốn thay đổi trạng thái.

## 7. Flow 7: Support ticket và sự cố

Chạy folder `05 - Flow 7 Support ticket and incidents` sau khi có contract ACTIVE:

1. Customer `Customer create ticket`.
   - Test script lưu `ticketId`.
2. Staff `Staff list tickets`.
3. Staff `Staff accept ticket` với status `IN_PROGRESS`.
4. Staff `Staff resolve ticket` với status `RESOLVED`.
5. Customer `Customer rate and close ticket` với rating 1-5.
6. Staff `Staff emergency PIN` để cấp PIN tạm theo Unit cùng chi nhánh.
7. Staff `Staff incident task` để tạo task mất chìa/bảo trì.

Trạng thái hợp lệ: `OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED`.

## 8. Flow 4: Chính sách, doanh thu và lấp đầy

Chạy folder `06 - Flow 4 Operations and reports`:

1. `Get pricing policies`.
2. `Chain stats` với `reportMonth = YYYY-MM`.
3. `Facilities list`.
4. Manager dùng `Facility report` để xem riêng chi nhánh.
5. `Update pricing policies` chỉ chạy khi muốn thay đổi dữ liệu policy thật.

Response report có tổng Unit, available, reserved, occupied, occupancy rate, monthly revenue và held deposits.

## 9. Admin, RBAC, audit

Chạy folder `07 - Flow 1 Admin RBAC and audit` bằng `adminToken`:

1. `Admin users`.
2. `Login history`.
3. `Audit logs`.
4. `RBAC matrix`.
5. `Create user` chỉ dùng username/email mới.
6. `Toggle lock user` dùng `userId` thật.

Không khóa tài khoản admin cuối cùng. Nếu chạy `Create user`, request tạo dữ liệu thật; xóa hoặc disable sau khi kiểm tra.

## 10. Test RBAC lỗi phải có

Dùng token sai actor để xác nhận bảo mật:

| Request | Token sai | Kết quả mong đợi |
|---|---|---|
| `GET /api/auth/users` | `customerToken` | `403` |
| `PATCH /api/policies` | `customerToken` | `403` |
| `POST /api/reservations` | `staffToken` | `403` |
| `POST /api/tasks/tickets` | `staffToken` | `403` |
| `GET /api/facilities/units/manage` | `customerToken` | `403` |
| `GET /api/tasks/tickets` | `customerToken` | `200`, chỉ ticket của customer |

## 11. Chạy toàn bộ collection

Dùng Postman Runner:

1. Chọn collection `SelfStorage Pro - Real API Flows`.
2. Chọn environment `SelfStorage Local Environment`.
3. Chạy folder theo thứ tự `00` đến `07`.
4. Không chạy tất cả request một lần nếu chưa chọn `reservationId`, `unitCode`, `staffId`, `contractId` thực tế.
5. Xem tab **Test Results**. Request xanh là pass; request đỏ đọc phần `message` trong response.

Newman nếu đã cài:

```powershell
newman run postman/SelfStorage-Real-API.postman_collection.json `
  -e postman/SelfStorage-Local.postman_environment.json
```

## 12. Dừng backend

Sau khi test xong, quay lại cửa sổ đang chạy Maven và nhấn `Ctrl+C`.
