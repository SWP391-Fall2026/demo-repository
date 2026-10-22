# Cấu trúc đã triển khai

Đây là tài liệu hiện trạng mã mới. `project-structure.md` lưu thiết kế ban đầu; `current-tree.txt` và `migration-map.md` mô tả cây và việc di chuyển thực tế, không phải danh sách chứng nhận mọi tính năng đã xong.

| Module | Backend sở hữu | Frontend |
| --- | --- | --- |
| identity | Auth, UserAdmin, User/LoginHistory | Đăng nhập/OTP và quản trị tài khoản |
| facility | Facility/Unit, catalog, readiness | Tìm kho, danh mục và quản lý cơ sở/kho |
| reservation | Reservation, NoShowRules | Đặt chỗ, gán kho, hủy, đến quầy, ngoại lệ NO_SHOW |
| rental | Contract, HandoverRecord, InspectionRecord, access, renewal | Kho đang thuê, bàn giao, trả kho, gia hạn |
| billing | Invoice, Payment, RefundRequest/Transaction | Hóa đơn, thu mô phỏng, yêu cầu/duyệt/bằng chứng/xác nhận hoàn |
| workforce | DailyTask | Công việc của Staff và phân công của Manager |
| support | SupportTicket | Khách gửi ticket, Staff tiếp nhận/xử lý |
| policy | BusinessPolicy | Ops cấu hình giá/phí, FM trần quá hạn |
| reporting | Query tổng hợp | Báo cáo cơ sở/chuỗi/quản trị |
| audit | AuditLog | Lịch sử thao tác và đăng nhập cho Admin |

Controller chỉ nhận HTTP và chuyển vào service/workflow. Các luồng liên module ở application/workflow có transaction: tạo reservation và invoice, gán kho, thanh toán, bàn giao, trả và NO_SHOW. Workflow được phép dùng repository của các module tham gia để giữ một transaction; module thông thường không gọi ngược workflow. Entity chỉ định nghĩa tại một module.

Frontend có API adapter theo feature, không gọi fetch rải trong component. Shared HTTP client gắn JWT, timeout, xử lý lỗi; không trả dữ liệu giả khi API lỗi. ResourcePage/Form dùng chung hỗ trợ tìm kiếm, lỗi, tải lại, cập nhật sau thao tác và kết quả API. Một số màn hình vận hành vẫn dùng biểu mẫu nhập mã; có thể cải thiện thành bộ chọn dữ liệu trong đợt UI tiếp theo.

RBAC được kiểm tra lại ở backend từ principal và dữ liệu User hiện tại; không tin facility/user/role do client gửi. Module tài chính khóa bản ghi gốc khi xử lý; pending refund giữ hạn mức. Unique indexes PostgreSQL là một phần của script triển khai, chưa chạy trên database thật.

Figma chính: https://www.figma.com/design/ZI2wVoTC5MsWXC07Y7rpsB/Untitled?node-id=0-1 . React hiện theo hệ màu/layout tối thiểu và bộ prototype lưu trong design; chưa có đối chiếu pixel từng frame Figma.

Các artifact cũ: runtime HTML/JS/CSS/server và generator ở docs/archive/prototype-runtime; SRS/Scope gốc được lưu theo nguồn. Không sử dụng prototype runtime làm frontend đang chạy.

