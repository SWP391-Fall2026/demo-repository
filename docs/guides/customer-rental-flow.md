# Hướng dẫn khách hàng thuê kho

## 1. Chọn kho và tạo đơn

1. Mở **Tìm kho & bảng giá**.
2. Chọn cơ sở, xem diện tích, giá tháng, ảnh và trạng thái còn trống.
3. Nhấn **Đặt giữ chỗ** tại kho phù hợp.
4. Nhập ngày bắt đầu thuê, số tháng thuê và ngày/giờ hẹn check-in.
5. Ngày bắt đầu thuê không được trước ngày check-in. Kiểm tra lại thông tin rồi nhấn **Tạo đơn và đặt cọc**.

Đơn mới có trạng thái `PENDING_PAYMENT`. Hệ thống giữ đơn trong 5 phút chờ thanh toán cọc. Quá hạn, đơn chuyển `EXPIRED`, hóa đơn chưa trả chuyển `CANCELLED` và kho giữ tạm được giải phóng.

## 2. Thanh toán tiền cọc

1. Hệ thống chuyển tới hóa đơn loại `DEPOSIT`.
2. Kiểm tra mã đơn, cơ sở, hạn thanh toán và số tiền.
3. Nhấn **Thanh toán qua VNPay** để mở cổng VNPay Sandbox.
4. Nhập thông tin thẻ thử nghiệm tại cổng thanh toán, không nhập trong form của ứng dụng.
5. Chờ VNPay và backend xác nhận giao dịch. Chỉ khi hóa đơn thành `PAID`, đơn mới chuyển sang `RESERVED`.

Không đóng kết luận chỉ dựa trên trang redirect. Nếu giao dịch đang chờ, mở lại **Thanh toán cọc/phí** để kiểm tra trạng thái hóa đơn.

## 3. Nhận kho được gán và thanh toán tiền thuê

Sau khi cọc thành công, quản lý cơ sở gán mã kho cụ thể. Khách mở **Thanh toán cọc/phí**, chọn hóa đơn `RENT` và thanh toán tiền thuê kỳ đầu. Hóa đơn thuê chỉ được thanh toán sau khi kho đã được gán.

## 4. Check-in và bàn giao

1. Mở **Thẻ Check-in**, chọn đơn đã cọc thành công.
2. Đến đúng cơ sở, đúng ngày/giờ ghi trên thẻ hẹn; mang giấy tờ cần thiết theo yêu cầu của cơ sở.
3. Nhân viên đối chiếu mã đơn, khách hàng, kho được gán và trạng thái thanh toán.
4. Cùng nhân viên kiểm tra cửa, vách, đèn, vệ sinh và thiết bị trong kho.
5. Xác nhận nội dung biên bản bàn giao.
6. Sau khi bàn giao hoàn tất, hợp đồng chuyển `ACTIVE`, kho chuyển `OCCUPIED` và hệ thống cấp PIN truy cập.

Nếu chưa thanh toán đủ `DEPOSIT` và `RENT`, hoặc chưa xác nhận biên bản, hệ thống không hoàn tất handover.
