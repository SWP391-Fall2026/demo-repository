# Demo project Storage Rental từ đầu đến cuối

Đối chiếu với route và code hiện tại ngày 29/10/2026. Dùng dữ liệu local H2, tài khoản seed và API thanh toán mô phỏng có sẵn để chạy đầy đủ nghiệp vụ mà không cần merchant VNPay. Các lệnh thanh toán dưới đây không chuyển tiền thật.

## 1. Khởi động

Yêu cầu: Node.js >= 22.12, npm, JDK 21, Maven 3.9. Mở PowerShell trong project.

Chỉ lần đầu hoặc sau khi thay package-lock:

```powershell
Set-Location C:\SWP391\demo-repository
npm ci
```

Terminal 1 — backend:

```powershell
Set-Location C:\SWP391\demo-repository
npm run start:local
```

Terminal 2 — frontend:

```powershell
Set-Location C:\SWP391\demo-repository
npm run dev
```

Giữ hai terminal chạy. Chờ backend báo `Started SelfStorageApplication` và Vite hiện cổng 5173.

| Thành phần | URL |
|---|---|
| Giao diện | http://127.0.0.1:5173 |
| API cơ sở | http://127.0.0.1:8080/api/facilities |
| API kho công khai | http://127.0.0.1:8080/api/facilities/units |

Nếu hai dịch vụ đã chạy thì mở URL, không bật thêm instance. Vite có thể chuyển sang 5174 khi 5173 đang bận; dùng URL thực tế mà Vite in ra.

Local dùng H2 trong bộ nhớ. Dừng/restart backend sẽ mất nghiệp vụ vừa demo và seed lại. Không dùng `npm run start:backend` thay `start:local`: lệnh đó chọn profile Supabase. Lệnh Maven trần trong README không cung cấp đủ H2/JWT như script local hiện tại.

## 2. Tài khoản, phiên và dữ liệu

Mật khẩu chung: `Demo123!`.

| Vai trò | HN-CG | HCM-Q7 | HCM-TB |
|---|---|---|---|
| Customer | `customer`, `customer2` — tài khoản khách độc lập | | |
| Staff | `staff` | `staff_q7` | `staff_tb` |
| Facility Manager | `manager` | `manager_q7` | `manager_tb` |
| Business Operations | `business` — toàn chuỗi | | |
| System Admin | `admin` — tài khoản và audit | | |

Mỗi cơ sở có 8 kho: 001–002 loại S, 2 m², 800.000đ/tháng; 003–005 loại M, 5 m², 1.450.000đ/tháng; 006–007 loại L, 10 m², 2.800.000đ/tháng; 008 loại CLIMATE, 8 m², 2.200.000đ/tháng. Ví dụ mã `HN-CG-001`. Không seed sẵn hợp đồng hoặc giao dịch; cần tạo theo luồng.

Chọn HN-CG xuyên suốt lần demo đầu. Staff/Manager khác chi nhánh không xử lý được hồ sơ HN-CG.

Các tab cùng browser profile dùng chung phiên đăng nhập. Dùng các browser/profile riêng cho Customer, Staff, Manager hoặc đăng xuất/đăng nhập lần lượt. Nhiều cửa sổ ẩn danh cùng phiên vẫn có thể chia sẻ session. Không cần tách browser cho terminal API vì token API độc lập phiên UI.

Ghi lại mã Reservation `RSV-...`, Invoice `INV-...`, Contract `CTR-...`, Task và Refund `REF-...`. Các chỗ `{id}` dưới đây phải thay bằng mã thật; không gõ dấu ngoặc nhọn.

## 3. Công cụ thanh toán mô phỏng local

UI hỗ trợ VNPay và chuyển khoản QR mô phỏng. Thanh toán tại quầy chỉ Staff được ghi nhận. Backend vẫn có `/api/payments/simulate` để kiểm thử lặp lại. Mở PowerShell thứ ba, dán khối này một lần. Không cần cài Postman.

```powershell
$script:demoApi = 'http://127.0.0.1:8080/api'

function Connect-Demo {
    param([string]$Username = 'customer')
    $body = @{ username = $Username; password = 'Demo123!' } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$script:demoApi/auth/login" `
        -Method Post -ContentType 'application/json' -Body $body
    $script:demoHeaders = @{ Authorization = "Bearer $($login.token)" }
    $login.data | Select-Object username, role, facilityCode
}

function Invoke-DemoApi {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [ValidateSet('GET','POST','PUT','PATCH')][string]$Method = 'GET',
        [object]$Body
    )
    if (-not $script:demoHeaders) { throw 'Chay Connect-Demo truoc.' }
    $requestHeaders = $script:demoHeaders.Clone()
    if ($Method -ne 'GET') {
        $requestHeaders['Idempotency-Key'] = [guid]::NewGuid().ToString()
    }
    $requestArgs = @{
        Uri = "$script:demoApi$Path"
        Method = $Method
        Headers = $requestHeaders
    }
    if ($PSBoundParameters.ContainsKey('Body')) {
        $json = $Body | ConvertTo-Json -Depth 10
        $requestArgs.ContentType = 'application/json; charset=utf-8'
        $requestArgs.Body = [Text.Encoding]::UTF8.GetBytes($json)
    }
    $response = Invoke-RestMethod @requestArgs
    if (-not $response.success) { throw $response.message }
    $response.data
}

Connect-Demo customer
```

Mỗi lần giao diện tạo hóa đơn DEPOSIT/RENT/RENEW, liệt kê và chọn đúng mã:

```powershell
Invoke-DemoApi -Path '/invoices' |
    Format-Table id, invoiceType, amount, status, reservationId, contractId

Invoke-DemoApi -Path '/payments/simulate' -Method POST -Body @{
    invoiceId = 'THAY_BANG_MA_INV_THUC_TE'
    paymentMethod = 'BANK_TRANSFER_QR'
    confirmedAmount = $true
}
```

Sau kết quả `PAID`, làm mới trang hóa đơn/đơn đặt. Dùng đúng tài khoản sở hữu hóa đơn; `customer2` không thanh toán hóa đơn của `customer`. Nếu đăng nhập terminal bằng Staff, chỉ dùng `CASH_AT_COUNTER` và hồ sơ đúng cơ sở. Nút VNPay trên UI là luồng gateway riêng; không cần bấm khi đang dùng giả lập.

Nhánh thanh toán lỗi: thêm `simulateFailure = $true` vào body. Payment thành FAILED, invoice vẫn PENDING. Thử lại bằng body không có cờ này; helper tạo Idempotency-Key mới. Không tái dùng key của lần FAILED nếu muốn tạo một lần thanh toán khác. Sau thử lỗi DEPOSIT vẫn phải thanh toán thành công trong hạn 5 phút.

## 4. Chuẩn bị Manager

Đăng nhập `manager` tại `/login`, mở `/facility/overview`.

1. Kiểm tra HN-CG có 8 kho.
2. Bấm **Tạo PIN hiển thị / Cấp PIN cơ sở** nếu chưa có PIN cơ sở.
3. Ghi PIN hiện tại nếu cần trình diễn. PIN cơ sở khác PIN kho. Không mặc định PIN seed `246810` là PIN đang hiển thị; seed chỉ có hash, chưa có bản hiển thị và PIN có thể được cấp lại.

Không bấm cấp lại trong lúc đang trình diễn cùng một PIN đã ghi.

## 5. Luồng chính: chọn kho đến nhận kho

| Bước | Người thao tác | Trang/thao tác | Kết quả phải thấy |
|---|---|---|---|
| 1 | Khách | Mở `/`, xem landing; `/storage`, lọc HN-CG, giá/diện tích; mở một kho loại S | Thông tin kho, giá, cơ sở |
| 2 | `customer` | Bấm **Đặt giữ chỗ**. Chọn ngày hẹn ở tương lai, ngày bắt đầu không trước ngày hẹn, thời hạn 1 tháng; xác nhận | `PENDING_PAYMENT`, invoice `DEPOSIT/PENDING` |
| 3 | Terminal Customer | Thanh toán mô phỏng đúng invoice DEPOSIT theo mục 3, trong 5 phút | Invoice `PAID`, Reservation `RESERVED` |
| 4 | `customer` | `/reservations/{reservationId}/appointment`, bấm **Gửi yêu cầu check-in tới Manager** | Tự gán kho đúng cơ sở/loại; Unit `reserved`; task CHECKIN được tạo |
| 5 | `manager` | `/facility/tasks/assign`, tìm task theo mã đơn, phân công cho `staff` | Task có Staff được giao |
| 6 | `staff` | `/facility/tasks/my`, mở hồ sơ check-in `/facility/handovers/{reservationId}`. Mã thẻ hẹn là Reservation ID; đối chiếu giấy tờ/thẻ, tick 2 xác nhận, **Xác nhận Check-in** | Đã xác minh khách; Contract `PENDING_PAYMENT` |
| 7 | `customer` | `/reservations/{reservationId}/contract-offer`, đọc điều khoản, tick đồng ý, xác nhận | Tạo hóa đơn `RENT/PENDING` |
| 8 | Terminal Customer | Thanh toán invoice RENT theo mục 3; làm mới UI | RENT `PAID`, Contract `PENDING_HANDOVER` |
| 9 | `staff` | Mở lại trang bàn giao, kiểm tra điều kiện, chọn hiện trạng sạch/bình thường, nhập ghi chú, ảnh nếu cần, tick các mục bắt buộc, **Lập biên bản bàn giao** | Biên bản chờ khách xác nhận |
| 10 | `customer` | `/reservations/{reservationId}/pass`, đọc biên bản, tick đủ 3 xác nhận và xác nhận nhận kho | Contract `ACTIVE`, Reservation `CHECKED_IN`, Unit `occupied`, task CHECKIN `COMPLETED` |
| 11 | `customer` | `/rentals`, mở chi tiết hợp đồng, xem mã kho/PIN; `/rentals/access`, nhập mã kho và PIN | Xác thực hợp lệ |

Để tránh bước nhập ngày vào quá khứ, có thể chọn hôm nay và giờ hẹn sau hiện tại 15–30 phút, bắt đầu thuê cùng ngày. Backend hiện kiểm tra thời gian khi tạo đơn; không có thao tác đổi đồng hồ demo. Nếu bật scheduler, hoàn thành xác minh trước hết hạn chờ NO_SHOW.

Sau thanh toán RENT, PIN có thể đã được cấp nhưng hợp đồng vẫn chờ bàn giao; phải hoàn tất bước 10 mới demo quyền truy cập thành công. Đây là mô phỏng quyền truy cập, chưa điều khiển khóa vật lý.

API đổi PIN có sẵn nhưng trang chi tiết hiện chỉ có nút ẩn/hiện PIN. Để demo đổi PIN khi hợp đồng còn ACTIVE:

```powershell
Connect-Demo customer
Invoke-DemoApi -Path '/contracts/THAY_MA_KHO/pin' -Method PATCH -Body @{
    newPin = '654321'
}
```

Làm mới chi tiết hợp đồng; thử PIN cũ bị từ chối và PIN mới hợp lệ tại `/rentals/access`. Dùng mã kho, không dùng Contract ID trong endpoint đổi PIN.

Lỗi UI đang biết: form xác minh check-in có thể biến mất nếu reload/quay lại sau khi task chuyển `IN_PROGRESS` nhưng chưa xác minh danh tính. Lần đầu mở task nên hoàn tất xác minh ngay. Nếu gặp, có thể tiếp tục qua API nghiệp vụ đúng Staff được giao:

```powershell
Connect-Demo staff
Invoke-DemoApi -Path '/tasks/THAY_MA_TASK/checkin/credentials'
Invoke-DemoApi -Path '/tasks/THAY_MA_TASK/checkin/verify' -Method POST -Body @{
    appointmentCardCode = 'THAY_MA_RSV'
    identityDocumentsConfirmed = $true
    appointmentCardConfirmed = $true
}
Connect-Demo customer
```

Chỉ đánh dấu hai xác nhận khi đã thực hiện đối chiếu trong kịch bản demo.

## 6. Gia hạn trước khi gửi trả kho

1. `customer`: `/rentals/renew?contractId={contractId}`.
2. Chọn hợp đồng, chọn 1/3/6/12 tháng, lấy báo giá.
3. Xác nhận đơn giá, tạo invoice RENEW.
4. Terminal đang đăng nhập `customer`: thanh toán invoice RENEW bằng mục 3.
5. Làm mới `/rentals/{contractId}`: ngày hết hạn tăng, chu kỳ/giá được cập nhật sau thanh toán.

Không gửi yêu cầu trả kho trước bước này. Khi đã có `checkoutRequestedAt` hoặc hợp đồng TERMINATED, không tiếp tục gia hạn. Nếu đang có invoice RENEW PENDING, xử lý invoice đó trước, không tạo thêm invoice song song.

## 7. Hỗ trợ và xử lý sự cố

1. `customer`: `/support?view=new`, chọn kho đang thuê, loại vấn đề, tiêu đề, mô tả ít nhất 10 ký tự; ảnh JPG/PNG tùy chọn. Gửi để tạo ticket `OPEN`.
2. `staff`: `/facility/incidents`, chọn ticket cùng cơ sở, đổi `IN_PROGRESS`, nhập ghi chú và lưu.
3. Staff xử lý, nhập phản hồi, đổi `RESOLVED`, lưu. Không chuyển OPEN thẳng RESOLVED.
4. `customer`: `/support?ticket={ticketId}`, đọc phản hồi, đánh giá 1–5 và xác nhận đóng; ticket `CLOSED`.

Thực hiện trước khi trả kho vì form tạo ticket chỉ liệt kê các hợp đồng ACTIVE/EXPIRING_SOON/OVERDUE.

## 8. Trả kho, nghiệm thu và cho thuê lại

1. `customer`: `/rentals/return?contractId={contractId}`, chọn ngày trả, tick xác nhận dọn tài sản, gửi.
2. Kiểm tra đã tạo RETURN task. Gửi yêu cầu chưa kết thúc hợp đồng, chưa dừng phí hoặc thu hồi PIN.
3. `manager`: `/facility/tasks/assign`, phân công RETURN cho `staff`.
4. `staff`: `/facility/tasks/my?type=RETURN`, mở `/facility/inspections/{contractId}`.
5. Tick đủ 4 tiêu chí, chọn `CLEAN` cho kịch bản không hư hại, không tick khóa hỏng; ghi hiện trạng và **Xác nhận trả kho**.
6. Kiểm tra Contract `TERMINATED`, PIN bị thu hồi, Unit `cleaning`; kết quả có `deductions` và `refundableDeposit`. Chưa chuyển tiền và chưa tự tạo yêu cầu hoàn cọc.
7. `manager`: phân công CLEANING task vừa sinh.
8. `staff`: bắt đầu/hoàn tất vệ sinh ở bảng công việc; `/facility/units/status?unit={unitCode}`, nhập ghi chú và **Gửi yêu cầu kho sẵn sàng**.
9. `manager`: `/facility/units/ready`, nhập mã kho và lý do, duyệt. Unit trở lại `available` và xuất hiện lại trong catalog.
10. `customer`: thử PIN cũ tại `/rentals/access`; quyền truy cập phải bị từ chối.

Để demo khấu trừ, dùng hợp đồng khác và chọn NEEDS_CLEANING hoặc khóa hỏng. Theo mặc định, cleaningFee 200.000đ, newLockFee 150.000đ; số tiền thực tế lấy từ chính sách đang áp dụng.

## 9. Hoàn cọc sau nghiệm thu

Trang `/refunds` của khách hiện chỉ theo dõi, chưa có form tạo yêu cầu. Sau mục 8, dùng API đã có:

```powershell
Connect-Demo customer
Invoke-DemoApi -Path '/payments/transactions' |
    Format-Table id, invoiceType, amount, status, reservationId, contractId

Invoke-DemoApi -Path '/refunds' -Method POST -Body @{
    paymentId = 'THAY_BANG_PAYMENT_DEPOSIT_PAID_CUA_DON'
    amount = 800000
    reason = 'Hoàn cọc sau nghiệm thu trả kho'
}
```

800.000đ chỉ là ví dụ kho S một tháng cọc, sạch, không có khấu trừ/chính sách thay đổi. Lấy đúng `refundableDeposit` của kết quả nghiệm thu và không vượt phần còn được hoàn của Payment gốc. Nếu số tiền có thể hoàn bằng 0, không tạo yêu cầu hoàn dương.

1. Ghi mã REF được trả về, trạng thái `PENDING`.
2. `manager`: `/facility/refunds/approve`, nhập mã REF, chọn APPROVE, số tiền duyệt không vượt số tiền yêu cầu, ghi lý do.
3. `staff`: `/facility/refunds/evidence`, chọn yêu cầu APPROVED, nhập mã giao dịch demo chưa dùng, tải PNG/JPEG/PDF không quá 10 MB; trạng thái `EVIDENCE_SUBMITTED`.
4. `manager`: `/facility/refunds/confirm`, mở bằng chứng, ghi chú đối chiếu, **Xác nhận đã hoàn tiền**; trạng thái `COMPLETED`.
5. `customer`: `/refunds`, xem trạng thái và bằng chứng.

Trong demo, dùng chứng từ được ghi rõ là mẫu/demo. Quy trình này ghi nhận bằng chứng, không thực hiện chuyển khoản ngân hàng.

Nhánh từ chối: Manager chọn REJECT và nhập lý do; khách thấy REJECTED. Yêu cầu chỉ có thể hủy khi còn PENDING bằng API Customer `POST /refunds/{refundId}/cancel`; trang khách hiện không có nút hủy. Yêu cầu đã được duyệt/gửi bằng chứng không hủy theo cách này.

## 10. Các nhánh hủy và bàn giao có vấn đề

Dùng các Reservation khác nhau; một hồ sơ đã hủy/kết thúc không thể tiếp tục happy path.

### 10.1. Hủy đơn chưa nhận kho

1. Tạo đơn thứ hai; có thể hủy ngay khi PENDING_PAYMENT hoặc sau cọc nhưng trước giai đoạn PENDING_HANDOVER.
2. `customer`: `/reservations`, mở đơn, **Hủy**, nhập lý do.
3. Kiểm tra Reservation CANCELLED; invoice PENDING bị CANCELLED; kho giữ đúng đơn được giải phóng.
4. Nếu đã trả cọc, việc hủy không tự chuyển tiền hoàn. Tạo RefundRequest bằng mục 9, Payment đúng khoản đã trả. Hủy trước thời điểm bắt đầu thuê ít nhất 24 giờ mới đủ điều kiện hoàn cọc thường; dưới 24 giờ cần yêu cầu ngoại lệ có lý do và Manager xét duyệt.

Để gửi ngoại lệ, thêm `exceptionRequested = $true` vào body tạo `/refunds`, ghi lý do cụ thể; cờ này không đồng nghĩa được duyệt.

### 10.2. Từ chối nhận kho sau khi đã trả RENT

1. Tạo đơn riêng; đi đến bước RENT PAID/Contract PENDING_HANDOVER và Staff đã gửi biên bản, nhưng khách chưa xác nhận nhận kho.
2. `customer`: `/reservations/{reservationId}/pass`, **Báo kho có vấn đề**, ghi lý do, thêm bằng chứng nếu cần.
3. `staff`: `/handover-reviews`, chọn hợp đồng, lập hồ sơ hủy thay khách, ghi căn cứ/lý do và chứng từ.
4. `manager`: `/handover-reviews`, mở hồ sơ PENDING.
5. Nhánh từ chối: nhập đủ lý do, điều kiện, hướng xử lý; khách được cấp lại 24 giờ. Staff có thể sửa/gửi lại biên bản, khách phản hồi/xác nhận.
6. Nhánh duyệt: xác nhận chính sách hoàn 50% RENT thực thu, giữ toàn bộ DEPOSIT. Reservation CANCELLED, Contract TERMINATED, kho được giải phóng đúng quan hệ giữ chỗ; RefundRequest APPROVED tự sinh.
7. Tiếp tục Staff tải bằng chứng và Manager xác nhận theo mục 9, từ bước 3. Không tạo thêm yêu cầu hoàn DEPOSIT hoặc khoản hoàn bổ sung cho cùng hủy bàn giao đã được duyệt.

## 11. Task thủ công, kho và vận hành cơ sở

`manager` có thể demo các màn hình ngoài happy path:

| Route | Nội dung trình diễn |
|---|---|
| `/facility/overview` | Dashboard cơ sở, kho và PIN cơ sở |
| `/facility/units` | Thêm/cập nhật kho, diện tích, tầng, giá, ảnh |
| `/facility/storage-types` | Xem nhóm loại kho và số liệu từ kho thực |
| `/facility/reservations/assign` | Gán/tự động gán kho phù hợp cho đơn còn đủ điều kiện; happy path yêu cầu check-in đã tự gán nên không bắt buộc bước này |
| `/facility/tasks/assign` | Tạo GENERAL/CLEANING/MAINTENANCE; phân công Staff cùng cơ sở |
| `/facility/contracts` | Theo dõi đơn/hợp đồng trong cơ sở |
| `/facility/invoices` | Trạng thái DEPOSIT/RENT/RENEW/EXTRA |
| `/facility/reports` | Lọc báo cáo cơ sở, doanh thu và lấp đầy |
| `/facility/overdue-cap` | Cấu hình trần phí quá hạn 0–100% |

Demo task thủ công: Manager tạo GENERAL tiêu đề “Kiểm tra lối đi kho”, chọn hôm nay và Staff; Staff mở `/facility/tasks/my`, Bắt đầu rồi Hoàn tất. Không tạo tay CHECKIN/RETURN để thay task do workflow tự sinh.

Để thêm kho mới với giá khác giá chuẩn, Business phải mở khung giá trước (mục 12). Chưa cấu hình khung thì giá min=max=giá chuẩn và backend sẽ từ chối giá ngoài khung.

## 12. Business Operations — tài khoản business

| Thứ tự | Route | Thao tác |
|---|---|---|
| 1 | `/operations/overview` | Xem tổng quan chuỗi; chọn kỳ, đối chiếu tiền thuê/cọc/phí/hoàn và cơ sở |
| 2 | `/operations/facilities` | Thêm cơ sở `DEMO-CS`, tên/địa chỉ/thành phố/hotline. Trang hiện chưa có sửa/xóa cơ sở |
| 3 | `/operations/pricing` | Demo lần lượt `price.max.S=900000`, `price.min.S=700000`; Manager sau đó có thể đặt giá kho S 850000 |
| 4 | `/operations/policies` | Demo `depositMonths=1`, `gracePeriodDays=3`; hoặc cleaningFee/newLockFee. Key phải thuộc danh mục backend |
| 5 | `/operations/reports` | Xem/lọc báo cáo chuỗi, chi tiết cơ sở |
| 6 | `/operations/settlement` | Đối soát số cơ sở, số kho, thu/hoàn theo kỳ |

`discount.3/6/12` là tỷ lệ, ví dụ 0.05 nghĩa là 5%, phải nhỏ hơn 1. Cập nhật giá/chính sách sau luồng chính để không làm thay đổi số tiền minh họa trước đó. Không hiểu báo cáo occupancy là lịch sử theo ngày: chỉ số này phản ánh kho hiện tại; bộ lọc ngày áp dụng dòng tiền.

Trang settlement mới là báo cáo đối soát, chưa có phê duyệt/kết chuyển kế toán. Nút tải trực tiếp hiện có thể gặp 401 vì không gắn JWT. API xuất đã có; dùng terminal với tài khoản Business:

```powershell
Connect-Demo business
Invoke-WebRequest -Uri "$script:demoApi/reports/export?format=xlsx" `
    -Headers $script:demoHeaders -OutFile '.\demo-chain-report.xlsx'
```

Chạy ở thư mục muốn lưu file; có thể dùng `format=csv`. Không cần bấm nút xuất đang lỗi trên UI để hoàn thành demo báo cáo.

## 13. System Admin — tài khoản admin

1. `/admin/overview`: xem người dùng, vai trò, cơ sở và audit.
2. `/admin/users`: tìm/lọc/xem tài khoản; thêm một STAFF mới, ví dụ username `staff_demo`, role STAFF, facility HN-CG, mật khẩu `Demo123!`, dữ liệu liên hệ/CCCD demo hợp lệ và chưa trùng. Form nội bộ yêu cầu mật khẩu 8–72 byte UTF-8.
3. Demo khóa `customer2`: đổi status LOCKED, thử đăng nhập tài khoản này bị từ chối; quay lại Admin đổi ACTIVE. Dùng tài khoản phụ để không gián đoạn Customer của luồng chính.
4. `/admin/staff-assignments`: dùng **User ID** như `LOCAL-staff`, không nhập username `staff`; gán role/cơ sở hợp lệ. Đăng nhập lại tài khoản bị chỉnh để UI nhận scope mới. Làm sau khi hoàn tất task cũ hoặc dùng Staff mới để không bỏ dở task.
5. `/admin/roles`: xem ma trận 5 vai trò. Trang này không tạo role tùy ý hoặc sửa permission.
6. `/admin/activity`: lọc/xem audit tạo cơ sở, sửa chính sách, tài khoản, thanh toán và nghiệp vụ vừa demo. Audit không có thao tác sửa/xóa.

Code giới hạn một ADMIN, một OPS_MGR và một FMANAGER mỗi cơ sở. Seed đã có đủ tại ba cơ sở gốc. Muốn demo tạo Manager mới, dùng cơ sở DEMO-CS vừa tạo; không thêm Manager thứ hai cho HN-CG.

## 14. Đăng ký và OTP — chuẩn bị riêng

Seed Customer đủ để chạy luồng nghiệp vụ ở trên. Để demo đăng ký mới:

1. Bật gửi mail thực: `app.auth.otp-delivery=email`, `app.auth.mail-from` và cấu hình `spring.mail.*`/SMTP hợp lệ.
2. Bật `app.auth.schema-reviewed=true` sau khi đã kiểm tra schema dùng cho đăng ký. Bản local mặc định chưa bật cờ này.
3. `/register`: họ tên hợp lệ, email nhận được thư, số điện thoại Việt Nam 10 số chưa trùng, CCCD 12 số có mã tỉnh hợp lệ, username 4–20 ký tự bắt đầu bằng chữ/gạch dưới, mật khẩu ít nhất 6 ký tự và không quá 72 byte UTF-8; mật khẩu xác nhận khớp hoàn toàn.
4. `/verify-otp`: nhập OTP 6 số từ email trong 5 phút. Gửi lại sau 30 giây; gửi lại không kéo dài hạn gốc. Không có OTP cố định mặc định.
5. Thành công về `/registration-success`, đăng nhập bằng tài khoản vừa tạo. Đăng ký công khai chỉ tạo CUSTOMER.

Để có phiên H2 demo OTP với SMTP: trước lệnh khởi động mở rộng ở mục 15, đặt biến `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` theo nhà cung cấp. Bổ sung các dòng sau **bên trong mảng `$localArgs` trước `) -join ' '`**, dùng địa chỉ gửi đã được nhà cung cấp xác minh:

```text
'--app.auth.schema-reviewed=true'
'--app.auth.otp-delivery=email'
'--app.auth.mail-from=THAY_EMAIL_GUI_DA_XAC_MINH'
'--spring.mail.properties.mail.smtp.auth=true'
'--spring.mail.properties.mail.smtp.starttls.enable=true'
'--spring.mail.properties.mail.smtp.starttls.required=true'
'--spring.mail.properties.mail.smtp.connectiontimeout=5000'
'--spring.mail.properties.mail.smtp.timeout=5000'
'--spring.mail.properties.mail.smtp.writetimeout=5000'
```

Đây là cấu hình SMTP STARTTLS; host/cổng/TLS phải khớp nhà cung cấp. Restart tạo lại H2 nên chuẩn bị từ đầu buổi demo. Không cần bật mail nếu chỉ dùng các tài khoản seed.

Với local, fallback phải cấu hình property `app.auth.otp-log-fallback=true`, ví dụ tham số `--app.auth.otp-log-fallback=true` trong khối `spring-boot.run.arguments`. Alias `AUTH_OTP_LOG_FALLBACK` chỉ được map trong profile auth-supabase. Fallback không tự tạo mail sender và không thay thế thiếu SMTP/mail-from; nó chỉ in mã khi đã có sender/from và thao tác SMTP gửi bị lỗi. Không hứa lấy OTP trong log ở cấu hình local mặc định.

## 15. EXPIRED, NO_SHOW, hạn bàn giao và quá hạn thuê

`npm run start:local` hiện ép `app.scheduling.enabled=false`. Vì vậy không chỉ chờ rồi kỳ vọng job tự chuyển trạng thái. Deadline thanh toán vẫn được kiểm tra khi gọi API, catalog không giữ chỗ quá hạn; nhưng dọn trạng thái nền/cảnh báo chưa chạy.

Nếu cần bật tác vụ nền cho một phiên demo H2 mới, dừng backend local, giữ frontend rồi dùng terminal backend:

```powershell
Set-Location C:\SWP391\demo-repository
$env:JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$localArgs = @(
    '--spring.datasource.url=jdbc:h2:mem:storage_local;MODE=PostgreSQL;DB_CLOSE_DELAY=-1'
    '--spring.datasource.driver-class-name=org.h2.Driver'
    '--spring.datasource.username=sa'
    '--spring.datasource.password='
    '--spring.jpa.hibernate.ddl-auto=create-drop'
    "--jwt.secret=$env:JWT_SECRET"
    '--app.scheduling.enabled=true'
) -join ' '
& .\scripts\start-backend.ps1 -Profile local "-Dspring-boot.run.arguments=$localArgs"
```

Chọn chế độ này **trước khi tạo dữ liệu** vì restart xóa dữ liệu H2. JWT được đổi nên đăng nhập lại UI/terminal. Đây vẫn là H2; các tham số không dùng datasource Supabase. Để demo đăng ký trên H2 đã kiểm tra, bổ sung tham số schema-reviewed và cấu hình mail như mục 14; không tự dùng cờ đó với database khác.

| Nhánh | Cách trình diễn | Kết quả |
|---|---|---|
| Hết hạn cọc | Tạo đơn, không thanh toán, chờ quá 5 phút; job reservation chạy khoảng mỗi 5 giây | Reservation EXPIRED, invoice PENDING bị CANCELLED |
| NO_SHOW | Đơn đã cọc, chưa ghi nhận khách đến; sau giờ hẹn +30 phút, Staff mở `/facility/no-show` | Xác nhận NO_SHOW có lý do, giải phóng kho giữ hợp lệ |
| Thêm thời gian chờ | Staff `/facility/no-show`, gia hạn một lần 1–30 phút | Hạn mới tính từ giờ hẹn +30 phút + phần gia hạn, không từ lúc bấm |
| Sự cố cơ sở | Staff/Manager ghi sự cố, Manager duyệt giờ hẹn/hạn giữ mới có lý do | Chặn NO_SHOW trong sự cố; lưu hạn mới rõ ràng |
| Hết hạn bàn giao | Đã trả RENT, Staff gửi biên bản nhưng khách không xác nhận trong 24h | Job tạo hồ sơ hủy TIMEOUT/PENDING; chờ Manager, chưa tự giải phóng kho |
| Sắp hết/quá hạn thuê | Hợp đồng đến kỳ; job mỗi khoảng 60 giây | Trước hết hạn 7 ngày: EXPIRING_SOON; qua hạn +gracePeriodDays: OVERDUE, thu hồi PIN |

Hoàn ngoại lệ NO_SHOW: tạo `/refunds` theo Payment PAID gốc, có `exceptionRequested = $true` và lý do. Hạn gửi là **giờ hẹn +24 giờ**, không tính từ lúc Staff xác nhận NO_SHOW. Khách đã đến/xác minh hoặc có sự cố chưa giải quyết thì không đủ điều kiện kết luận NO_SHOW.

Các mốc 24 giờ/tháng không thể trình diễn trực tiếp trong vài phút với seed mới và clock thật. Trình bày quy tắc và dùng regression test để chứng minh, hoặc chuẩn bị fixture thời gian riêng trước buổi demo; không thay đồng hồ hệ thống, không sửa trực tiếp trạng thái DB để giả một kết quả nghiệp vụ.

```powershell
npm run check
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
mvn -f backend/pom.xml test
```

Các test cần staging/config riêng có thể bị skip; test pass local không đồng nghĩa toàn bộ luồng browser/email/VNPay đã được chạy thật.

## 16. VNPay Sandbox cho DEPOSIT/RENT/RENEW

Gia hạn trong hướng dẫn này dùng `/payments/simulate` hoặc VNPay. Cả hai nhánh đều dùng cùng logic settlement: cập nhật hạn thuê, ngày hết hạn, giá tháng, PIN và thời điểm gia hạn sau khi invoice RENEW PAID. Chỉ coi thanh toán xong khi backend xác nhận invoice PAID.

Chuẩn bị merchant sandbox hợp lệ, không dùng thông tin thẻ ngân hàng thật. Khởi chạy backend với:

```powershell
$env:APP_FRONTEND_URL = 'http://127.0.0.1:5173'
$env:VNPAY_TMN_CODE = '<merchant-sandbox-code>'
$env:VNPAY_HASH_SECRET = '<merchant-sandbox-secret>'
$env:VNPAY_RETURN_URL = 'http://127.0.0.1:8080/api/payments/vnpay/return'
npm run start:local
```

Nếu merchant yêu cầu public callback/IPN: chạy `ngrok http 8080`, thay VNPAY_RETURN_URL bằng `https://<ngrok-host>/api/payments/vnpay/return`; đăng ký IPN `https://<ngrok-host>/api/payments/vnpay/ipn` theo cấu hình merchant rồi restart backend. Tunnel backend 8080.

Các giá trị mặc định hiện tại là frontend 5174 và return 8000, không khớp 5173/8080; cần override như trên. Chỉ coi thanh toán xong khi backend xác nhận invoice PAID. Không tự sửa query redirect để giả thành công.

## 17. Checklist kết thúc buổi demo

- [ ] Landing, catalog và bộ lọc; đăng nhập 5 vai trò.
- [ ] Tạo Reservation, DEPOSIT, yêu cầu check-in, tự gán kho, phân công Staff.
- [ ] Staff xác minh; khách chấp nhận hợp đồng; RENT; hai bên hoàn tất biên bản.
- [ ] ACTIVE, PIN đúng được chấp nhận, PIN sai bị từ chối.
- [ ] Gia hạn RENEW sau xác nhận giá; ngày hết hạn được cập nhật sau PAID.
- [ ] Ticket OPEN, IN_PROGRESS, RESOLVED, CLOSED.
- [ ] Trả kho, nghiệm thu, TERMINATED, PIN cũ bị từ chối.
- [ ] Refund PENDING, APPROVED, EVIDENCE_SUBMITTED, COMPLETED.
- [ ] Vệ sinh, Staff yêu cầu ready, Manager duyệt available.
- [ ] Nhánh hủy thường và hủy bàn giao 50% RENT trên hồ sơ khác.
- [ ] Manager quản lý kho/task/phí; Business cơ sở/giá/chính sách/báo cáo; Admin user/role/scope/audit.
- [ ] Nêu rõ các phần cần cấu hình: SMTP/OTP, VNPay, tác vụ thời gian; nêu giới hạn UI hiện tại.

Thứ tự trình bày gọn: Customer đặt kho → Manager phân công → Staff xác minh → Customer ký/trả RENT → Staff gửi biên bản → Customer nhận kho/PIN → hỗ trợ → gia hạn → trả kho → hoàn cọc → vệ sinh/duyệt sẵn sàng → Business → Admin. Nhánh lỗi/hủy dùng đơn thứ hai, thứ ba.
