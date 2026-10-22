# Kế hoạch từng cột mới — chỉ là candidate theo REF

Mọi cột thêm vào bảng có dữ liệu: **NULL, không default, không UPDATE backfill tự động**. Hai bảng mới: PK NOT NULL; các cột còn lại nullable theo mapping; constraint nghiệp vụ chỉ xét ở giai đoạn sau. VARCHAR dùng đúng hint mapping cho cột mới; NUMERIC không khóa precision/scale để tránh tự quyết định làm tròn VND.

| Bảng.cột | PostgreSQL đề xuất | NULL ban đầu | Căn cứ và backfill |
|---|---|---|---|
| `audit_logs.user_id` | `varchar(255)` | Có | record() gán từ principal/ID đối tượng; không suy diễn actor từ user_name. facility hiện là facility của actor, có thể NULL. |
| `audit_logs.entity_id` | `varchar(255)` | Có | record() gán từ principal/ID đối tượng; không suy diễn actor từ user_name. facility hiện là facility của actor, có thể NULL. |
| `audit_logs.facility_code` | `varchar(255)` | Có | record() gán từ principal/ID đối tượng; không suy diễn actor từ user_name. facility hiện là facility của actor, có thể NULL. |
| `invoices.id` | `varchar(255)` | Không (PK) | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.reservation_id` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.contract_id` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.user_id` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.facility_code` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.invoice_type` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.amount` | `numeric` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.status` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.issued_at` | `timestamp without time zone` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.due_at` | `timestamp without time zone` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.description` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `invoices.price_snapshot` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `payments.invoice_id` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `payments.user_id` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `payments.facility_code` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `payments.idempotency_key` | `varchar(255)` | Có | Không sinh key ngẫu nhiên hoặc ghép mã cho giao dịch cũ; NULL hợp lệ nếu chưa có key gốc. |
| `refund_requests.user_id` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.requested_by` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.on_behalf_basis` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.refund_type` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.requested_amount` | `numeric` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.reason` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.decision_reason` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.approved_by` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `refund_requests.exception_requested` | `boolean` | Có | Không tự gán false/0 cho lịch sử chưa biết; xác minh hồ sơ nghiệp vụ. |
| `refund_requests.idempotency_key` | `varchar(255)` | Có | Không sinh key ngẫu nhiên hoặc ghép mã cho giao dịch cũ; NULL hợp lệ nếu chưa có key gốc. |
| `refund_transactions.id` | `varchar(255)` | Không (PK) | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.refund_request_id` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.performed_by` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.confirmed_by` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.transfer_reference` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.evidence_path` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.original_name` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.content_type` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.status` | `varchar(255)` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.created_at` | `timestamp without time zone` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `refund_transactions.confirmed_at` | `timestamp without time zone` | Có | Bảng chỉ tạo nếu xác nhận chưa tồn tại. Không sinh Invoice/RefundTransaction lịch sử từ suy đoán; cần chứng từ đối soát. |
| `units.held_by_reservation_id` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `units.readiness_status` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `units.readiness_requested_by` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `units.readiness_notes` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `contracts.start_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `contracts.end_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `contracts.terminated_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.appointment_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.approved_appointment_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.hold_until` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.arrived_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.no_show_alert_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.extension_minutes` | `integer` | Có | Không tự gán false/0 cho lịch sử chưa biết; xác minh hồ sơ nghiệp vụ. |
| `reservations.extension_used` | `boolean` | Có | Không tự gán false/0 cho lịch sử chưa biết; xác minh hồ sơ nghiệp vụ. |
| `reservations.incident_open` | `boolean` | Có | Không tự gán false/0 cho lịch sử chưa biết; xác minh hồ sơ nghiệp vụ. |
| `reservations.exception_reason` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `reservations.monthly_price_snapshot` | `numeric` | Có | Chứng từ/hợp đồng/giá đã chốt gốc; tuyệt đối không lấy bảng giá hiện hành. |
| `reservations.schedule_approved_by` | `varchar(255)` | Có | Code setter cho giao dịch mới; lịch sử NULL cho tới khi có chứng từ/link xác thực. |
| `reservations.rental_start_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
| `reservations.cancelled_at` | `timestamp without time zone` | Có | Chỉ backfill từ thời điểm chính thức có timezone/ngữ nghĩa đã xác nhận; không parse chuỗi tự do hoặc giả định 00:00. |
