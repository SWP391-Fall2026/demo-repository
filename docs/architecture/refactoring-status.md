# Trạng thái tái cấu trúc — 18/10/2026

Mã mới: D:/SWP/storage-rental, branch codex/restructure-storage-rental, từ baseline 21cbce8 khớp ZIP đã xác nhận. Checkout D:/SWP/demo-repository và các thay đổi có sẵn được giữ riêng. Chưa commit/push.

## Đã triển khai trong đợt này

- Backend 103 file Java, chia 10 module theo nghiệp vụ; controller/service/repository/entity/dto cùng module, workflow liên module có transaction riêng.
- Frontend React + Vite + TypeScript: 41 page, 43 route cho năm vai trò; AppShell, RoleGuard, Form, ResourcePage, ActionResult và HTTP client riêng.
- Tách Auth/UserAdmin, Policy/Reporting, Workforce/Support; không còn combined controller/service cũ trong runtime.
- Invoice riêng, Payment từng lần thử; hoàn tiền theo giao dịch gốc, giữ hạn mức ngay lúc tạo, hủy chờ duyệt, Manager quyết định, Staff tải bằng chứng, Manager xác nhận kết quả.
- NO_SHOW cảnh báo/Staff xác nhận, ghi nhận đã đến quầy, gia hạn một lần, sự cố, lịch/hạn giữ được Manager duyệt.
- Bàn giao, yêu cầu trả, nghiệm thu dừng phí/khóa PIN, yêu cầu vệ sinh và Manager duyệt AVAILABLE; gia hạn phải xác nhận giá.
- Kiểm tra chủ sở hữu/chi nhánh/vai trò phía backend, audit từ principal, khóa dữ liệu và khóa chống xử lý trùng. Frontend giữ nguyên khóa khi thử lại sau mất phản hồi.
- Policy lưu database; Ops cấu hình khung giá/phí, FM giá kho trong phạm vi và trần quá hạn; báo cáo thu/hoàn từ dữ liệu thực, không dùng số cố định.
- Tách prototype/seed/generator cũ khỏi runtime. Schema 15 bảng được giữ làm tham chiếu; SQL mở rộng chỉ là đề xuất triển khai.
- OpenAPI 66 thao tác, 33 schema đầu vào; kiểm tra 56 lời gọi frontend khớp endpoint trong hợp đồng. CI chạy frontend và backend độc lập.

## Kết quả kiểm chứng

- npm run check: production build, 3 kiểm thử frontend và kiểm tra contract/adapter đều qua.
- mvn -o verify: 8 kiểm thử backend qua, JAR Spring Boot đóng gói thành công.
- Các bài backend kiểm tra biên hủy đúng 24 giờ, phí trễ làm tròn mỗi 24 giờ bắt đầu và trần theo giá hiện hành, NO_SHOW/đến quầy/sự cố/giữ chỗ, hạn mức hoàn, vai trò/chi nhánh, thuê–bàn giao–trả–nghiệm thu–vệ sinh–hoàn thủ công, thao tác trùng và hai yêu cầu hoàn đồng thời.
- HTTP local đã kiểm tra đăng nhập và endpoint đúng quyền của cả 5 vai trò. Trình duyệt đã kiểm tra trang chủ tải catalog, đăng nhập khách local, menu đúng vai trò và tạo Reservation qua React → Vite proxy → Spring Boot → H2. Ảnh ở artifacts/react-reservation-smoke.png (đầu ra local được ignore).

## Giới hạn cần phân biệt với hoàn thiện toàn bộ sản phẩm

- Chưa chạy hoặc đối soát migration trên PostgreSQL/Supabase thật; H2 không chứng minh khóa/constraint và dữ liệu lịch sử trên PostgreSQL. Xem docs/guides/database-migration.md.
- Một số màn hình vận hành dùng biểu mẫu nhập mã. Chưa nghiệm thu mọi màn hình/trạng thái theo từng frame Figma, mọi kích thước màn hình hoặc toàn bộ AC trong SRS.
- Hợp đồng hiện mô tả route, quyền, đầu vào và lỗi; phần data của nhiều response vẫn dùng Envelope chung, cần bổ sung DTO response chi tiết khi triển khai từng phần tiếp theo.
- OTP, thu tiền/QR và PIN là mô phỏng phần mềm, không kết nối email/ngân hàng/khóa IoT thật. Hoàn thủ công ghi nhận chứng từ, không tự chuyển tiền.
- Báo cáo hiện là tổng thu/hoàn/lấp đầy theo phạm vi; chưa có bộ lọc thời kỳ, xuất báo cáo và đầy đủ chỉ số công nợ/đối soát.
- Ticket ảnh/đánh giá, hoàn thiện tương tác chọn kho/nhân sự và các ngoại lệ vận hành còn cần phát triển/kiểm thử tiếp. Tái cấu trúc này không được dùng làm xác nhận toàn bộ nghiệp vụ đã nghiệm thu.

Không thực hiện ghi dữ liệu hoặc migration vào Supabase đang dùng.
