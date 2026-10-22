# Dependency, constraint và index — bản nháp

## Thứ tự

1. M00: metadata live/privileges/timezone và review dữ liệu; xác nhận schema public. Không chạy app/scheduler trên DB thật để thử validate.
2. D10: audit (giữ module mới), chỉ mở rộng nullable.
3. D20: units/reservations/contracts, thêm scalar nullable; chưa bật luồng cũ thiếu timestamp/snapshot.
4. D30: invoices → payment/refund_request columns → refund_transactions. Chỉ tạo bảng nếu LIVE xác nhận vắng. Phải chốt và đưa ACL/RLS vào cùng transaction trước bất kỳ commit triển khai nào; file nháp chưa có vì chưa biết role/default privileges.
5. Đối soát lịch sử có chứng từ (thành kế hoạch riêng được phê duyệt). Không có câu UPDATE tự động trong bộ này.
6. D40: unique/CHECK và FK candidate sau khi kiểm tra duplicates/orphans, quyền truy cập và độ dài. FK về users/facilities cần có trước parent tương ứng, nhưng ADD FK chỉ làm sau khi toàn bộ table/column tồn tại.
7. D50: validate từng FK ở cửa sổ riêng, không gom cả hệ thống vào một transaction dài. Cutover chỉ khi toàn bộ mapping và dữ liệu active sẵn sàng.

Đây là thứ tự review/migration nội bộ, **không phải cho phép chạy app giữa từng bước**. Validate xét tất cả 16 entity cùng lúc.

Chu trình nullable units.held_by_reservation_id → reservations.id và reservations.unit_code → units.code: tạo reservation trước khi gán unit; thêm cả hai FK sau mở rộng. Không tự áp DEFERRABLE; code hiện lưu reservation trước và gán unit sau nên không có bằng chứng cần trì hoãn FK.

Không có @ManyToOne/@OneToMany/@JoinColumn/@Enumerated/@Version/@SequenceGenerator trong code. Các liên kết dưới đây là candidate theo service, không phải FK live đã biết. Không mặc định CASCADE hay SET NULL; draft dùng NO ACTION để giữ lịch sử, vẫn cần duyệt retention/cleanup bên ngoài ứng dụng.

## FK theo từng liên kết

| Child.column | Parent.column | Bằng chứng hiện có | Điều kiện trước khi thêm |
|---|---|---|---|

| `users.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `units.facility_code` | `facilities.code` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `units.held_by_reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `units.readiness_requested_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `reservations.user_id` | `users.id` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `reservations.facility_code` | `facilities.code` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `reservations.unit_code` | `units.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `reservations.schedule_approved_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `contracts.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `contracts.user_id` | `users.id` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `contracts.unit_code` | `units.code` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `contracts.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `invoices.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `invoices.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `invoices.user_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `invoices.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `payments.invoice_id` | `invoices.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `payments.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `payments.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `payments.user_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `payments.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.payment_id` | `payments.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.inspection_id` | `inspection_records.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.user_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.requested_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_requests.approved_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_transactions.refund_request_id` | `refund_requests.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_transactions.performed_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `refund_transactions.confirmed_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `handover_records.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `handover_records.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `handover_records.staff_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `inspection_records.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `inspection_records.staff_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `daily_tasks.staff_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `daily_tasks.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `daily_tasks.unit_code` | `units.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `daily_tasks.reservation_id` | `reservations.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `daily_tasks.contract_id` | `contracts.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `support_tickets.user_id` | `users.id` | REF có FK; LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `support_tickets.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `support_tickets.unit_code` | `units.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `support_tickets.staff_assigned` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention; giá trị legacy có thể là tên/nhãn, không phải user ID |
| `business_policies.updated_by` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention; giá trị legacy có thể là tên/nhãn, không phải user ID |
| `audit_logs.user_id` | `users.id` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention |
| `audit_logs.facility_code` | `facilities.code` | ID scalar/service lookup; FK LIVE chưa biết | So khớp definition live, parent PK/unique và types; thống kê orphan; review NO ACTION/retention; xác nhận actor facility, không target facility |

Không tạo FK cho audit_logs.entity_id: đối tượng đa hình gồm reservation/contract/payment/refund/unit/facility/user/task/ticket và khóa policy. Không FK login_history.username → users.username: code ghi thất bại với username chưa tồn tại, role UNKNOWN/BLOCKED hợp lệ cho login history. Không hợp nhất staff_tasks với daily_tasks bằng suy đoán.

## Unique/index candidate

| Candidate | Căn cứ | Rủi ro/gate |
|---|---|---|
| users.username, users.email | @Column(unique=true) + kiểm tra tạo tài khoản | LIVE index/constraint chưa biết. Kiểm tra duplicate exact và lower-case; không tự chuyển citext/lower unique hoặc đổi chữ hoa/thường. |
| payments(idempotency_key) WHERE NOT NULL | findByIdempotencyKey trả Optional, truy vấn key toàn cục | Kiểm tra trùng/blank/collation; không chế key cho lịch sử. |
| refund_requests(payment_id,idempotency_key) WHERE NOT NULL | service tìm key trong giao dịch gốc | Scope khác Payment; không unique toàn cục. Không sửa amount/status để hết trùng. |
| contracts(reservation_id) WHERE NOT NULL | findByReservationId Optional, handover chỉ tạo một hợp đồng/reservation | Cần xác nhận lịch sử; không xóa/chọn một hợp đồng tùy tiện. |
| invoices(reservation_id,invoice_type) cho DEPOSIT/RENT | requirePaid dùng Optional | BLOCK nếu lịch sử nhiều invoice tiền thuê theo kỳ; có thể cần sửa query/code sau phê duyệt thay vì siết unique. |
| refund_transactions.transfer_reference | findByReference Optional, mã giao dịch không dùng lại | Phải xác nhận reference có unique toàn hệ thống hay chỉ ngân hàng/ngày; không giả định quá scope. |
| refund_transactions.refund_request_id | flow hiện chỉ nhận một bằng chứng rồi đổi trạng thái | Chỉ chọn nếu không cần nhiều lần thực hiện/thất bại/đính chính. Query hiện trả List, nên đây không phải ràng buộc JPA bắt buộc. |
| Index child FK / scope | tra cứu theo owner/facility/status/payment | Dựa volume/EXPLAIN sau lấy metadata; không tạo trùng index sẵn có hoặc index mọi cột chỉ để validate. |

Draft index thường dùng CREATE INDEX trong transaction (có thể chặn ghi). Không đổi sang CONCURRENTLY trong transaction đó; nếu cần online thì tách script, gate phê duyệt và xử lý invalid index. Chưa chọn chiến lược online khi chưa biết kích thước/table traffic.

## CHECK, NOT NULL và default

- Reservation code ghi NO_SHOW, REF CHECK chưa cho phép. Thêm CHECK rộng hơn mà vẫn giữ CHECK cũ **không** mở được trạng thái này. Chỉ thay chính xác constraint đã review từ M05; placeholder trong draft chặn chạy. Không dùng regex quét rồi xóa tất cả CHECK liên quan status như SQL candidate cũ.
- Giữ các CHECK live khác sau khi so sánh giá trị thực/code; mọi enum hiện là String chứ không có Java @Enumerated. Không ép PostgreSQL enum type vì metadata chưa có.
- Không mở LOW cho support_tickets.priority chỉ vì comment entity có LOW: service hiện luôn tạo NORMAL; REF cho NORMAL/HIGH/URGENT. Đây là drift comment/thiết kế cần chốt, không tự nới constraint.
- Invoice.status phải bao gồm PENDING, PAID, CANCELLED vì ReservationMonitoringJob dùng CANCELLED. RefundRequest dùng PENDING/APPROVED/REJECTED/CANCELLED/EVIDENCE_SUBMITTED/COMPLETED. RefundTransaction dùng SUBMITTED/COMPLETED. Không thu hẹp tập live nếu còn trạng thái lịch sử chưa đối soát.
- NOT NULL của ref audit/user/ticket/handover/inspection/refund phải giữ; không nới chỉ để seed/test qua. Entity phần lớn thiếu nullable=false; validate không thay cho test ghi NULL và xác nhận DB invariant.
- Cột mới trong bảng có lịch sử giữ nullable; thêm NOT NULL chỉ sau chứng từ backfill và xét trường hợp NULL nghiệp vụ hợp lệ. invoices.reservation_id/contract_id và audit.facility_code không được NOT NULL vô điều kiện.
- Java field initializer không phải DEFAULT SQL. Không dùng false/0/giá hiện hành/now() để bịa các sự kiện lịch sử. INSERT ORM gửi NULL có thể không nhận DB default.
- REF có default mã PIN cố định (giá trị không đưa vào tài liệu). Cần xác minh live có default này qua cờ redacted; review việc bỏ default riêng, **không sửa/xóa PIN đang có**, không khởi tạo mã truy cập từ migration.

