# Hướng dẫn khách hàng thuê kho

## 1. Chọn kho và tạo đơn

1. Mở **Tìm kho & bảng giá**.
2. Chọn cơ sở, xem diện tích, giá tháng, ảnh và trạng thái còn trống.
3. Nhấn **Đặt giữ chỗ** tại kho phù hợp.
4. Nhập ngày bắt đầu thuê, số tháng thuê và ngày/giờ hẹn check-in.
5. Ngày bắt đầu thuê không được trước ngày check-in. Kiểm tra lại thông tin rồi nhấn **Tạo đơn và đặt cọc**.

Đơn mới có trạng thái `PENDING_PAYMENT`. Hệ thống giữ đơn trong 5 phút chờ thanh toán cọc. Quá hạn, đơn chuyển `EXPIRED`, hóa đơn chưa trả chuyển `CANCELLED` và kho giữ tạm được giải phóng.

Danh mục “Còn trống” tính số kho `available` theo cơ sở và loại kho, trừ các đơn `RESERVED` chưa gán kho và đơn `PENDING_PAYMENT` chưa gán kho còn hạn thanh toán. Đơn đã gán kho không bị trừ thêm vì kho đã chuyển trạng thái. Khi hết số chỗ có thể đặt, loại kho đó không xuất hiện trong danh mục; đơn chờ cọc hết hạn không còn chiếm chỗ ngay cả khi tác vụ dọn dẹp chưa chạy. Bộ lọc giá/diện tích áp dụng trên các kho phù hợp và số kết quả không vượt số chỗ còn lại của loại kho tại cơ sở. Làm mới danh mục để lấy tình trạng mới nhất; bước tạo đơn vẫn kiểm tra lại để tránh đặt vượt chỗ khi có khách khác đặt đồng thời.

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
3. Nhân viên mở task được giao trong **Công việc**, đối chiếu mã đơn, giấy tờ khách hàng, kho được gán và trạng thái thanh toán rồi chọn **Xác nhận check-in**. Hệ thống tự ghi nhận thời điểm khách đến; trang **Tra cứu đơn** chỉ dùng tìm kiếm và xem thông tin, không cần nhập mã và lưu thêm lần nữa.
4. Cùng nhân viên kiểm tra cửa, vách, đèn, vệ sinh và thiết bị trong kho.
5. Xác nhận nội dung biên bản bàn giao.
6. Sau khi bàn giao hoàn tất, hợp đồng chuyển `ACTIVE`, kho chuyển `OCCUPIED` và hệ thống cấp PIN truy cập.

Nếu chưa thanh toán đủ `DEPOSIT` và `RENT`, hoặc chưa xác nhận biên bản, hệ thống không hoàn tất handover.

Khách có 24 giờ kể từ lúc Staff gửi biên bản. Hết hạn, hệ thống tự tạo yêu cầu hủy chờ Facility Manager duyệt. Nếu khách không đồng ý nhận kho, liên hệ Staff để ghi lý do, bằng chứng và chuyển Manager. Manager từ chối phải nêu lý do/điều kiện/hướng xử lý và cấp lại 24 giờ; khách xem và phản hồi tại **Yêu cầu bàn giao**. Nếu duyệt hủy, hoàn 50% tiền thuê RENT đã thanh toán, giữ lại toàn bộ tiền cọc; Staff hỗ trợ hoàn thủ công và Manager xác nhận kết quả. Xem [hướng dẫn chi tiết](handover-cancellation.md).
