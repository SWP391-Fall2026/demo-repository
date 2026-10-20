# VNPay Sandbox qua ngrok

Backend nhận IPN và browser return tại cùng public URL. Ngrok phải tunnel đến backend (8080), không tunnel riêng frontend.

```powershell
ngrok http 8080
```

Lấy HTTPS URL ngrok, rồi khởi chạy backend với thông tin merchant sandbox cấp bởi VNPay:

```powershell
$env:VNPAY_TMN_CODE = "<sandbox-tmn-code>"
$env:VNPAY_HASH_SECRET = "<sandbox-hash-secret>"
$env:VNPAY_RETURN_URL = "https://<ngrok-host>/api/payments/vnpay/return"
$env:APP_FRONTEND_URL = "http://127.0.0.1:5174"
$env:VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
cd backend
mvn spring-boot:run
```

Đăng ký URL IPN `https://<ngrok-host>/api/payments/vnpay/ipn` trong cấu hình merchant sandbox nếu VNPay yêu cầu khai báo IPN riêng. Không đưa hash secret vào frontend, Postman environment dạng plain text, source control, hoặc URL. Khi ngrok đổi hostname, cập nhật lại return URL/IPN đã đăng ký và restart backend.

Backend cập nhật `payments.status`, `invoices.status` và trạng thái reservation từ IPN hợp lệ hoặc browser return có chữ ký hợp lệ; cả hai cùng dùng settlement idempotent, xác minh terminal/reference/amount. Browser return không tin query unsigned. Trang kết quả chỉ mở thẻ hẹn khi deposit đã là `PAID`/reservation là `RESERVED`.

Không thể kiểm thử thanh toán live nếu chưa có `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và merchant sandbox. Thiếu cấu hình, tạo payment URL bị từ chối thay vì giả lập giao dịch thành công.

Nếu nút thanh toán trả `500`, xem log backend ngay trong terminal chạy `mvn spring-boot:run`. Kiểm tra nhanh cấu hình và schema:

```powershell
Get-ChildItem Env:VNPAY_TMN_CODE,Env:VNPAY_HASH_SECRET,Env:VNPAY_RETURN_URL
```

Nếu log có lỗi cột bảng `payments`, áp dụng nhóm migration backend yêu cầu, đặc biệt `database/migrations/002_align_backend_mapping.sql`, trên đúng database trong `DB_URL`. Không dùng `ddl-auto=update` để né lỗi schema.
