# Xác nhận biên bản trong 24 giờ và hủy trước nhận kho

Chính sách đã được người dùng chốt: khách có 24 giờ kể từ lúc Staff gửi biên bản. Khi Manager từ chối hủy, khách có một hạn mới đủ 24 giờ kể từ lúc từ chối. Đúng thời điểm hết hạn, hệ thống không chấp nhận xác nhận nhận kho nữa.

## Khách hàng

- Xem hạn xác nhận tại **Thẻ Check-in & bàn giao**.
- Nếu hiện trạng có vấn đề, chọn **Báo kho có vấn đề**, nhập lý do cụ thể và đính kèm PDF/PNG/JPEG nếu có (tối đa 10 MB).
- Nếu không muốn nhận kho hoặc muốn hủy, liên hệ Staff cơ sở hoặc kênh hỗ trợ. Staff ghi hồ sơ để Facility Manager quyết định; báo vấn đề không tự hủy đơn.
- Xem quyết định tại **Yêu cầu bàn giao**. Quyết định gồm lý do, điều kiện, hướng xử lý và hạn xác nhận mới khi từ chối hủy. Khách có thể gửi phản hồi tại đây rồi mở lại biên bản để xác nhận.
- Nếu được duyệt hủy, liên hệ Staff để được hỗ trợ hoàn thủ công. Được hoàn 50% RENT thực tế đã thanh toán, giữ lại toàn bộ DEPOSIT. Không có tự động chuyển khoản hoặc ví số dư.
- Khi Staff đã tải bằng chứng chuyển tiền, mở **Hoàn tiền của tôi**, chọn yêu cầu và bấm **Xem bằng chứng** để xem ảnh/PDF hoặc tải về. Bằng chứng cũng có trong phần theo dõi khoản hoàn tại hồ sơ **Yêu cầu bàn giao** và vẫn xem được sau khi hoàn tất. Khách chỉ truy cập được hồ sơ/bằng chứng của mình.
- Trang **Hoàn tiền của tôi** chỉ theo dõi và xem bằng chứng; không có form tạo yêu cầu hoàn ngoại lệ hoặc hủy yêu cầu hoàn. Khách liên hệ Staff để được hỗ trợ theo quy trình đã duyệt.

## Staff

1. Mở **Yêu cầu bàn giao**, chọn hợp đồng chờ bàn giao.
2. Ghi lý do khách từ chối nhận kho, căn cứ khách yêu cầu hủy/nội dung trao đổi và bằng chứng có liên quan.
3. Chuyển Facility Manager duyệt. Có thể bổ sung ghi chú/file vào lịch sử hồ sơ đang chờ; không sửa đè bằng chứng cũ.
4. Khi vấn đề được xử lý và khách vẫn nhận kho, gửi lại biên bản đã sửa ở **Bàn giao**. Hồ sơ lý do/bằng chứng trước đó vẫn được giữ.
5. Sau duyệt hủy, mở **Thực hiện hoàn tiền**, chọn yêu cầu hoàn đã duyệt từ danh sách, ghi mã giao dịch hoàn thủ công và tải bằng chứng. Trang này chỉ thực hiện/tải bằng chứng cho hồ sơ đã có, không tạo yêu cầu hoàn mới. Hồ sơ đã gửi bằng chứng chỉ được xem lại, không tải đè. Khoản hoàn chỉ hoàn tất khi Manager xác nhận.

## Facility Manager

- Xem hồ sơ, biên bản tại thời điểm ghi nhận và bằng chứng trong **Yêu cầu bàn giao**.
- **Từ chối hủy:** bắt buộc nhập lý do, điều kiện và hướng xử lý; hệ thống thông báo trong ứng dụng và cấp lại 24 giờ. Hợp đồng/kho chưa bị hủy hoặc giải phóng. Không tự thực hiện phần giải quyết ngoài hệ thống.
- **Phê duyệt hủy:** xác nhận chính sách 50% RENT, không hoàn cọc; hệ thống xử lý Reservation/Contract/Unit/task và tạo RefundRequest APPROVED theo Payment RENT gốc.
- Mở **Xác nhận hoàn tiền**, chọn hồ sơ Staff đã gửi bằng chứng, bấm **Xem bằng chứng** để xem ảnh/PDF, mở tab mới hoặc tải về. Sau đối chiếu, ghi chú và xác nhận COMPLETED. Bằng chứng vẫn xem được sau khi hoàn tất; chỉ người thuộc đúng cơ sở hoặc chủ sở hữu mới truy cập được. Phê duyệt hủy không đồng nghĩa đã chuyển tiền hoàn.

## Quá hạn và trạng thái

Job mặc định kiểm tra mỗi 60 giây. Đến hạn, một hồ sơ TIMEOUT/PENDING được tạo để Manager duyệt; Reservation vẫn RESERVED, Contract vẫn PENDING_HANDOVER và Unit vẫn reserved. Không tự kết luận khách đã nhận kho và không giải phóng kho trước phê duyệt.

Sau phê duyệt hủy: Reservation CANCELLED; Contract TERMINATED; biên bản CANCELLED; task CHECKIN CANCELLED. Unit chỉ chuyển available khi đang reserved và held_by_reservation_id đúng đơn; xóa PIN thường/tạm. Nếu dữ liệu giữ chỗ hoặc chứng từ không khớp, toàn bộ quyết định thất bại và không ghi một phần.

Hạn mức hoàn theo từng Payment RENT thực thu; 50% làm tròn HALF_UP đến đồng. Không thay đổi Invoice/Payment PAID, không hoàn DEPOSIT và chặn luồng hoàn chung tạo khoản bổ sung cho cùng hủy bàn giao đã duyệt. Nếu trước đó đã có hồ sơ hoàn cọc, cần đối soát trước khi duyệt chính sách giữ cọc.

## API và triển khai

Nguồn hợp đồng: `contracts/openapi/storage-rental.openapi.json`, nhóm `/api/handover-reviews` và `/api/contracts/{id}/handover/issue`.

Migration mới: `database/migrations/015_handover_review_and_cancellation.sql`. Phải review và được phép cho môi trường cụ thể trước khi chạy. Nó thêm deadline, hai bảng lịch sử/bằng chứng và liên kết hoàn tiền; không tự backfill hạn cho biên bản lịch sử. Biên bản cũ chưa có hạn cần Staff gửi lại.

Staging `xnerbsgbwdpemvnatvuy` đã áp dụng migration 015 sau authorization, rehearsal rollback và postcheck ngày 26/10/2026. Không chạy lại; xem [bằng chứng thực thi](../testing/handover-migration-015-execution.md). Các môi trường khác vẫn cần authorization và kiểm tra riêng.

Triển khai theo thứ tự: backup/snapshot đã kiểm chứng → chạy migration được duyệt → Hibernate validate → nạp backend mới → nạp frontend mới → kiểm thử trên dữ liệu tổng hợp. Không bật profile local/test với database thật. Không chạy lại các migration cũ hoặc dùng ddl-auto=update để né việc review schema.

Rollback ứng dụng: dừng scheduler phiên mới và quay lại binary trước thay đổi; giữ nguyên schema bổ sung và toàn bộ hồ sơ/bằng chứng/hoàn tiền đã ghi để đối soát. Không DROP bảng/cột hoặc xóa giao dịch để rollback.
