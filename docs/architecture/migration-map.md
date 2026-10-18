# Ánh xạ trước và sau tái cấu trúc

| Trước trong ZIP | Hiện tại | Ý nghĩa |
| --- | --- | --- |
| frontend/js/app.js, css/style.css, server.js | docs/archive/prototype-runtime | Lưu nguyên nguồn để truy vết, không nằm trong runtime React |
| frontend/index.html nhiều panel | frontend/index.html + src/app/router.tsx + features/*/pages | Một React root; route và page theo nghiệp vụ |
| frontend/images | frontend/src/assets/images | Asset được Vite đóng gói |
| controller/AuthController + service/AuthService | modules/identity/controller, service, dto | Tách xác thực khỏi quản trị User |
| controller/PolicyAnalyticsController | modules/policy và modules/reporting | Tách cấu hình chính sách khỏi báo cáo |
| controller/TaskIncidentController | modules/workforce và modules/support | Tách phân công khỏi ticket sự cố |
| controller/ContractController + service/ContractService | modules/rental và application/workflow | Tách truy vấn, PIN, gia hạn, bàn giao và nghiệm thu |
| service/ReservationService | modules/reservation và application/workflow | Quy tắc thời gian riêng; giữ chỗ/gán kho/hủy/NO_SHOW có transaction |
| service/PaymentService | modules/billing và PayInvoiceWorkflow | Invoice là khoản phải thu; Payment là từng lần thử; hoàn tiền riêng |
| entity, repository, dto dùng chung toàn cục | modules/<feature>/{entity,repository,dto} | Mỗi module sở hữu mapping dữ liệu của mình |
| dto/ApiResponse, exception | common/web, common/exception | Quy ước HTTP và validation dùng chung |
| config/DataInitializer | docs/archive/prototype-runtime/DataInitializer.java | Seed cũ được lưu ngoài classpath; LocalDataInitializer mới dùng H2 riêng |
| docs/supabase_schema.sql (10 bảng cũ) | database/reference/legacy-repository-schema.sql | Tham khảo lịch sử, không thay schema người dùng cung cấp |
| Schema 15 bảng gửi riêng | database/reference/current-schema-as-is.sql | Nguồn chuẩn để đối chiếu dữ liệu |
| docs và design nhiều viewer/file trùng | docs/requirements, docs/archive, design/reference, design/legacy | Tách nguồn yêu cầu, tài liệu lịch sử và hình tham chiếu |
| scripts/render_screens.js | docs/archive/prototype-runtime/render_screens.js | Generator prototype cũ được lưu riêng |

Xem `current-tree.txt` cho toàn bộ cây thực tế. Thiết kế ban đầu lưu tại `project-structure.md`; các thư mục trong thiết kế đó có thể là vị trí dành cho giai đoạn sau.

