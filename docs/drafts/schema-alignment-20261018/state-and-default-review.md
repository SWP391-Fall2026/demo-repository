# Trạng thái, enum, default và cột ngoài mapping

Không có Java enum/@Enumerated hoặc @ColumnDefault trong source hiện tại. Các field bên dưới là String/Boolean và được gán tại entity/service/workflow. Danh sách REF là bằng chứng tham chiếu, **không phải tập giá trị live**. M03/M05/M09 và Q03 phải được thu thập trước khi chỉnh CHECK/domain/enum.

| Bảng / field | Code hiện ghi/đọc | REF hoặc metadata đã cung cấp | Kế hoạch |
|---|---|---|---|
| users.role | Ghi CUSTOMER/STAFF/FMANAGER/OPS_MGR/ADMIN; ActorContext đọc FACILITY_MANAGER/OPS_MANAGER/SYSTEM_ADMIN alias | REF CHECK có 8 giá trị đó | Giữ alias lịch sử; không tự normalize hoặc thay PostgreSQL enum |
| users.status | ACTIVE/LOCKED/DISABLED; field init ACTIVE | REF CHECK cùng tập, default ACTIVE, nullable | Xác minh NULL lịch sử, không tự cấp ACTIVE cho tài khoản chưa rõ trạng thái |
| facilities.status | Tạo ACTIVE | REF default ACTIVE, không CHECK | Chưa có căn cứ cấm trạng thái facility legacy khác |
| units.type | Validate S/M/L/CLIMATE | REF CHECK cùng tập | So sánh live CHECK/domain, không đổi kiểu String sang enum SQL |
| units.status | available/reserved/occupied/cleaning/maintenance, chữ thường | REF CHECK cùng tập; default available; NOT NULL | Giữ case theo code, kiểm tra data/consumer cũ; không đổi uppercase toàn bảng |
| units.readiness_status | NULL/PENDING/APPROVED | REF không có cột; live chưa biết | NULL lịch sử, không đánh dấu đã vệ sinh/đã duyệt khi chưa có chứng cứ |
| reservations.status | PENDING_PAYMENT/RESERVED/CHECKED_IN/CANCELLED/EXPIRED/NO_SHOW | REF chỉ có 5 trạng thái đầu, default PENDING_PAYMENT | NO_SHOW là khác biệt CHECK theo REF; cần exact live definition trước thay thế |
| contracts.status | ACTIVE/EXPIRING_SOON/OVERDUE/TERMINATED (đọc); ghi ACTIVE/OVERDUE/TERMINATED | REF CHECK cho cả 4, default ACTIVE | Không xóa EXPIRING_SOON chỉ vì job mới chưa tạo nó |
| invoices.invoice_type | DEPOSIT/RENT từ booking, RENEW từ renewal; parameter String | REF không có bảng | Không tự suy ra mọi invoice type tương lai; kiểm tra actual kinds trước CHECK |
| invoices.status | PENDING/PAID/CANCELLED (job hủy invoice chưa thu khi reservation hết hạn) | REF không có bảng | Cần cả CANCELLED; không thêm CHECK chỉ PENDING/PAID |
| payments.invoice_type | Lấy Invoice.invoiceType | REF CHECK DEPOSIT/RENT/RENEW/EXTRA | Không bỏ EXTRA của lịch sử, không biến type thành enum khác |
| payments.status | Ghi PAID hoặc FAILED | REF CHECK PENDING/PAID/FAILED/REFUNDED, default PAID | Không thu hẹp còn 2 trạng thái. REFUNDED legacy phải đối soát, không tự đổi PAID/mở lại hạn mức |
| payments.payment_method | MOCK_CARD/BANK_TRANSFER_QR/CASH_AT_COUNTER, có kiểm tra trong workflow | REF default phương thức QR legacy, không CHECK | Không hồi tố method; nếu thêm CHECK phải chứa các giá trị legacy được xác minh |
| refund_requests.status | PENDING/APPROVED/REJECTED/CANCELLED/EVIDENCE_SUBMITTED/COMPLETED | REF có varchar NOT NULL, không CHECK/default | Thu thập live phân bố trước CHECK; không chuyển legacy APPROVED thành COMPLETED |
| refund_requests.refund_type | DEPOSIT nếu payment DEPOSIT, còn lại RENT | REF thiếu cột | Tách cọc/thuê; lịch sử không phân loại theo amount hoặc tên |
| refund_transactions.status | SUBMITTED/COMPLETED | REF không có bảng | Không gán trạng thái cho lịch sử; future failure/retry model cần quyết định riêng |
| daily_tasks.status | Init/tạo PENDING; cập nhật IN_PROGRESS/COMPLETED | REF không CHECK, không default status | Nếu siết phải so dữ liệu và external consumer, không copy CHECK từ staff_tasks |
| daily_tasks.task_type | System ghi CHECKIN/RETURN; Manager API nhận String, chưa validate một tập cố định | REF varchar tự do | Đề xuất validation ứng dụng riêng nếu muốn 4 loại; chưa siết SQL theo UI select hoặc comment |
| staff_tasks.task_type/status | Không có entity/consumer mới; không thực thi từ Java | REF CHECK 4 loại CHECKIN/RETURN/SUPPORT/MAINTENANCE và 3 trạng thái task | Giữ riêng, xác minh producer cũ; không migrate sang daily_tasks bằng suy đoán |
| support_tickets.status | Tạo OPEN; cập nhật IN_PROGRESS/RESOLVED/CLOSED; entity init IN_PROGRESS | REF default OPEN + CHECK 4 giá trị | Init Java và DB default khác nhưng create service set OPEN; kiểm tra đường ghi khác, không đổi DB default mù |
| support_tickets.priority | Service tạo NORMAL; entity init NORMAL, comment còn LOW | REF CHECK NORMAL/HIGH/URGENT | LOW chỉ trong comment không là bằng chứng cần nới CHECK |
| support_tickets.category | String do khách gửi, không enum | REF varchar NOT NULL | Không tự đặt enum danh mục từ tên màn hình |
| inspection_records.cleanliness_status | Service nhận String; CLEAN được xử lý riêng, mọi giá trị khác bị coi chưa sạch | REF varchar nullable, không CHECK | Không tự thêm CHECK chỉ CLEAN/DIRTY trong khi backend chưa validate tập đó |
| inspection_records.is_cleared | Boolean tính từ cleanliness/lockDamaged | REF NOT NULL | Giữ NOT NULL của dữ liệu hiện tại, kiểm tra tất cả path ghi; không false mặc định cho lịch sử |
| handover_records.customer_signature_confirmed | Workflow yêu cầu true rồi ghi true | REF boolean NOT NULL | Không tự backfill chữ ký từ contract/paid status |
| audit_logs.role/status/action | Role canonical từ actor; status luôn SUCCESS; action extensible, PAYMENT_FAILED vẫn status SUCCESS | LIVE varchar, status default SUCCESS | Chốt nghĩa status audit, không CHECK action theo danh sách hiện tại; actor/system chưa là enum SQL |
| login_history.role/status | Có UNKNOWN với username chưa tồn tại; SUCCESS/FAILED/BLOCKED | REF role varchar NOT NULL, status default SUCCESS, không CHECK | Không FK username sang users hoặc áp CHECK role của users vào login history |
| business_policies.policy_key/value | Key có price.*, discount.*, cap.<facility> và fee; value hiện numeric string | REF policy_value TEXT NOT NULL, key PK | Không đổi TEXT thành NUMERIC hoặc CHECK cast tất cả key trước khi biết policy legacy; không lấy fallback làm backfill |

## Kiểu ID và default constructor

- AuditLog: Long/IDENTITY; LIVE metadata cung cấp bigint với default nextval. Cần thêm thông tin sequence ownership, grants, cache/last_value và max ID, không đổi sang SERIAL từ legacy SQL.
- User/Reservation/Contract/Payment/Ticket/Task/Handover/Inspection/Invoice/RefundRequest/RefundTransaction: app cấp prefix + UUID trong code. LoginHistory constructor cũng cấp chuỗi ID. Facility/Unit dùng code nghiệp vụ; BusinessPolicy dùng policy_key.
- Không thêm sequence/default UUID vào 15 entity String, không chuyển prefixed ID sang kiểu uuid SQL. Không tự ép width 50/255 lên ID đang dài hơn hoặc cột đang không giới hạn.
- Timestamp default now() do DB và LocalDateTime.now()/Clock do app là các nguồn khác nhau. Constructor có thể set trước lúc commit; không tự coi chúng là cùng nghĩa/thời điểm.

## Ngoài JPA nhưng ảnh hưởng ghi dữ liệu

- users.email_verified: REF NOT NULL default true; User không mapping cột. Nếu LIVE bỏ default, INSERT User có thể lỗi. Việc bỏ/mất default phải được phát hiện M03, không tự đổi giá trị lịch sử hoặc trạng thái xác minh.
- login_history.login_time/ip_address; audit.time_display/ip_address: giữ cột và kiểm tra default/trigger; không sao chép chuỗi/loopback thành timestamp/IP thật.
- support_tickets.feedback: REF TEXT ngoài mapping; giữ dữ liệu.
- staff_tasks: giữ nguyên 9 cột REF; không có entity mới không có nghĩa bảng không còn được dùng ngoài repo.

Các thuộc tính field/default/nullable/length/unique chi tiết cho toàn bộ 216 mapping nằm trong mapping-inventory.json và schema-diff.md. Không mặc định mọi chênh lệch annotation/default/comment là DDL cần áp dụng.
