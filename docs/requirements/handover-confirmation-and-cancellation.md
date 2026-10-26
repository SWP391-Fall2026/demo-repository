# Xác nhận bàn giao và hủy trước khi nhận kho

## Phạm vi và nguồn quyết định

Nguồn: yêu cầu người dùng ngày 25/10/2026. Áp dụng cho hợp đồng đã thanh toán, đang `PENDING_HANDOVER`, trước khi khách xác nhận nhận kho. Không thay thế quy trình trả kho sau khi hợp đồng đã `ACTIVE`.

Các thay đổi danh mục và tra cứu Staff từ các task trước được giữ nguyên.

## Quy tắc đã chốt

- Khách có 1 ngày (24 giờ) kể từ khi Staff gửi biên bản để xác nhận.
- Hết hạn mà chưa xác nhận: hệ thống tự tạo yêu cầu hủy chờ Facility Manager phê duyệt. Không tự giải phóng kho trước quyết định phê duyệt.
- Khách liên hệ Staff tại cơ sở hoặc kênh hỗ trợ để trình bày lý do không nhận kho và yêu cầu hủy/hoàn.
- Staff ghi nhận lý do và bằng chứng liên quan, chuyển Facility Manager xem xét.
- Chỉ Facility Manager có quyền duyệt hoặc từ chối hủy và xác nhận điều kiện hoàn theo chính sách đã duyệt.
- Khi duyệt hủy, cập nhật Reservation, giải phóng đúng kho đang giữ cho đơn và tạo quy trình hoàn thủ công. Staff ghi nhận bằng chứng chuyển tiền; Manager xác nhận hoàn tất theo luồng hiện có. Không tự chuyển tiền ngân hàng.
- Tỷ lệ hoàn: 50% số tiền RENT thực tế đã thanh toán lúc thanh toán hợp đồng. Toàn bộ DEPOSIT được giữ lại, không hoàn. Không tạo thêm khoản hoàn ngoài chính sách này, kể cả bằng luồng yêu cầu ngoại lệ chung.
- Lý do, bằng chứng, người ghi nhận, người quyết định và thời điểm phải được giữ để đối soát.

## Quyết định bổ sung đã chốt

- Manager từ chối hủy phải ghi rõ lý do, điều kiện liên quan và hướng xử lý tiếp theo. Quyết định hiển thị cho khách trong ứng dụng; không tự gửi email hoặc thực hiện thay việc xử lý ngoài hệ thống.
- Cấp lại đủ 24 giờ kể từ thời điểm Manager từ chối. Khách có thể gửi phản hồi quyết định và tiếp tục xác nhận biên bản. Phản hồi không tự thay đổi quyết định hoặc tự xác nhận nhận kho.
- Nếu tiếp tục quá hạn mới, hệ thống tạo một yêu cầu hủy mới chờ Manager. Mỗi thời điểm chỉ có một yêu cầu hủy PENDING cho cùng hợp đồng.
- Biên bản, ghi chú và bằng chứng tại thời điểm báo vấn đề/yêu cầu hủy được lưu riêng để không bị mất khi Staff gửi lại biên bản đã sửa.
- Manager phê duyệt: Reservation CANCELLED, Contract TERMINATED, biên bản CANCELLED, task CHECKIN CANCELLED; chỉ giải phóng Unit đang reserved và held_by_reservation_id đúng đơn. Xóa PIN của hợp đồng/kho và PIN tạm.
- Tạo RefundRequest APPROVED cho RENT, giữ hạn mức theo Payment gốc, sau đó Staff ghi nhận chuyển tiền + bằng chứng và Manager xác nhận COMPLETED. Chưa có bằng chứng hoàn tất thì chưa coi đã hoàn tiền.
- Tiền hoàn làm tròn đến đồng VND theo HALF_UP trên từng giao dịch RENT gốc; không tính trên tiền thuê tương lai chưa trả, DEPOSIT, RENEW hoặc EXTRA.
- Các biên bản lịch sử chưa có deadline không được tự backfill hoặc tự hủy theo mốc suy đoán; Staff gửi lại để bắt đầu hạn mới. Đây là biện pháp bảo toàn dữ liệu cũ khi triển khai migration.

## Khảo sát VERIFIED

- `HandoverWorkflow.confirmByCustomer` hiện kích hoạt hợp đồng, chuyển kho occupied và hoàn thành task chỉ sau khi khách xác nhận đủ ba nội dung.
- `HandoverWorkflow.reportIssue` hiện chỉ lưu lý do chung, chưa tiếp nhận lý do cụ thể và bằng chứng khách từ chối; Staff sửa biên bản còn xóa ghi chú issue cũ.
- Chưa có deadline xác nhận hoặc yêu cầu hủy chờ Manager riêng cho giai đoạn bàn giao.
- `CancelReservationWorkflow` hiện cho Customer/Staff/Manager hủy Reservation RESERVED trực tiếp. Cần chặn đường này với hợp đồng chờ bàn giao để không bỏ qua quyền duyệt của Manager.
- Refund hiện có PENDING → APPROVED → EVIDENCE_SUBMITTED → COMPLETED; yêu cầu hoàn giữ hạn mức theo Payment gốc và chỉ Staff/Manager đúng cơ sở được thực hiện các bước tương ứng.
- `RefundRequestService.create` hiện có thể yêu cầu hoàn RENT của Reservation CANCELLED theo toàn bộ Payment. Phải áp dụng trần chính sách mới với các hủy bàn giao đã được duyệt, tránh tạo thêm yêu cầu vượt tỷ lệ 50%.

## Kế hoạch triển khai và tiêu chí hoàn thành

1. Ghi chính sách đã chốt và hợp đồng API trước khi bàn giao thay đổi.
2. Lưu deadline, hồ sơ lý do/bằng chứng và lịch sử quyết định; soạn migration mới, không chạy migration dùng chung khi chưa được phép.
3. Thêm xử lý quá hạn và luồng Staff → Manager. Chặn xác nhận/hủy trực tiếp chạy đua với quyết định; phê duyệt lặp không tạo thêm khoản hoàn hoặc giải phóng nhầm kho.
4. Nối giao diện khách/Staff/Manager và luồng hoàn hiện có; thể hiện rõ trạng thái chờ và thông tin liên hệ Staff.
5. Kiểm thử mốc đúng 24 giờ, phân quyền theo khách/chi nhánh, lý do/bằng chứng, duyệt/từ chối, hoàn đúng hạn mức, retry/đồng thời và regression luồng nhận kho bình thường.
6. Review toàn bộ diff, cập nhật OpenAPI/route inventory/hướng dẫn, chạy kiểm tra frontend và backend. Báo riêng phần H2, PostgreSQL và giao diện đã/chưa thực thi.

Rủi ro chính: hủy vượt quyền, giao nhau với xác nhận nhận kho, hoàn quá hạn mức, giải phóng kho sai quan hệ giữ chỗ và mất lịch sử/bằng chứng khi lập lại biên bản. Kiểm thử cần xác nhận trạng thái lẫn số tiền; build thành công chưa đủ kết luận nghiệp vụ đúng.
