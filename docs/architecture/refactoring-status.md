# Trạng thái triển khai hiện tại — 02/11/2026

Tài liệu này mô tả trạng thái mã nguồn hiện tại và bằng chứng môi trường đã quan sát. Đây không phải xác nhận nghiệm thu toàn bộ SRS, không phải xác nhận dữ liệu production sạch, và không thay thế kiểm thử end-to-end trên từng cơ sở.

## Runtime và dữ liệu

- Lượt kiểm tra hiện tại ghi nhận backend profile `auth-supabase` đang chạy API tại cổng `8080`, với biến môi trường riêng trong `storage-rental-secrets/backend.properties`.
- Profile Supabase dùng PostgreSQL/Supabase với `spring.jpa.hibernate.ddl-auto=validate`; ứng dụng không tự tạo hoặc sửa schema khi khởi động.
- Snapshot schema đã đối chiếu theo hướng read-only cho 18 entity; đã ghi nhận effects của migration `002` đến `016` hiện diện trên schema live. Đây là bằng chứng kiểm tra schema, không phải lượt thực thi migration mới.
- Snapshot live được báo cáo có 5 facility: `HN-CG` có 29 unit, `HCM-Q7` có 2 unit, `HN-NTL`, `HCM-TB` và `DN-HC` hiện có 0 unit. Đây là số liệu của snapshot có sẵn, không phải dữ liệu seed sạch và không chứng minh tất cả cơ sở đã được nhập đủ dữ liệu vận hành.
- Database còn lịch sử fixture và dữ liệu nghiệp vụ cũ. Không xem các con số snapshot này là số liệu kinh doanh production.
- `npm run start:local` vẫn là H2 demo, có seed cục bộ và mất dữ liệu khi backend dừng; không dùng lệnh này để kết luận Supabase đã hoạt động.

## Đã có trong mã nguồn

- Backend đã tách các module identity, facility, reservation, billing, rental, workforce, support, policy, reporting và audit; workflow liên module dùng transaction và kiểm tra owner/facility/role ở backend.
- Flow reservation, check-in/handover, rented unit/return, policy/pricing/reporting và facility/staff có API và route frontend tương ứng.
- Báo cáo có phạm vi FM theo facility và OPS theo toàn chuỗi. Báo cáo/export hiện trả thêm số hợp đồng `OVERDUE`, breakdown theo loại unit và breakdown theo trạng thái unit.
- Flow gia hạn: backend tạo báo giá/hóa đơn `RENEW`; frontend không đưa hợp đồng `OVERDUE` vào lựa chọn gia hạn, khớp với backend đang chặn gia hạn trạng thái này.
- Facility có cập nhật metadata/trạng thái `ACTIVE`/`INACTIVE`; unit có cập nhật loại, diện tích, giá và chuyển vào `maintenance` theo điều kiện nghiệp vụ. Không xóa unit đang có lịch sử; `maintenance` chủ đích dùng để rút unit khỏi nguồn kho khả dụng, sau đó Staff yêu cầu sẵn sàng và Manager duyệt trước khi quay lại `available`.
- RBAC theo role và facility được kiểm tra trong backend; Admin có màn cấu hình bật/tắt quyền đọc/ghi theo module. Các kiểm tra owner, facility và SoD của workflow vẫn luôn được áp dụng.

## Giới hạn cần giữ rõ

- PIN kho và PIN cơ sở hiện là mô phỏng phần mềm; chưa kết nối khóa IoT, NFC/RFID hay thiết bị vật lý.
- VNPay hiện dùng sandbox/integration mô phỏng theo môi trường; chưa phải thanh toán production.
- `app.payments.simulation-enabled` mặc định là `false` và tắt ở Supabase; profile local/test mới bật mô phỏng. UI chỉ hiện QR mô phỏng khi API `/payments/bank-info` xác nhận cờ này là `true`. Supabase không tự ghi `PAID` từ thao tác xác nhận QR của Customer; thanh toán online đi qua VNPay và xác minh từ backend.
- Hoàn tiền là quy trình thủ công: Staff cung cấp bằng chứng, Manager xác nhận; hệ thống không tự chuyển tiền ngân hàng.
- OTP/email cần SMTP/Brevo hợp lệ trong Supabase profile; không coi việc có API login là bằng chứng email production đã giao thành công.
- Facility/unit/staff/manager của từng cơ sở phải được kiểm tra và provision trong Supabase trước khi demo toàn chuỗi. Tài khoản `demo-seed` chỉ phục vụ dữ liệu mẫu, không đại diện dữ liệu thật.
- Chưa dùng tài liệu này để khẳng định toàn bộ AC, mọi màn hình Figma, mọi nhánh lỗi, hoặc toàn bộ 5 flow đã nghiệm thu trên dữ liệu live.

## Gap còn lại so với audit flow/service

- Các màn quản trị cơ sở, kho, chính sách, hoàn tiền, duyệt kho sẵn sàng và gán nhân sự đã dùng bảng, bộ lọc, dialog và thao tác theo dòng; API vẫn là nguồn dữ liệu duy nhất.
- `FacilityContractsPage` có bộ lọc và chi tiết hợp đồng; màn quá hạn riêng hỗ trợ nhắc nợ, khóa PIN và yêu cầu trả kho. `OVERDUE` có báo giá gia hạn gồm phí quá hạn, hóa đơn hết hạn được vô hiệu hóa và PIN chỉ khôi phục sau thanh toán.
- Ticket PAYMENT/OTHER có thể gắn với reservation thuộc chính khách hàng trước khi có hợp đồng; vì schema live không đổi, mã reservation được lưu trong nội dung ticket và kiểm tra ownership ở backend. ACCESS/DAMAGE vẫn yêu cầu hợp đồng có hiệu lực.
- Report API/export có bộ lọc trạng thái thuê, breakdown theo loại kho, trạng thái kho và trạng thái hợp đồng; frontend hiển thị trạng thái cơ sở thật và xuất CSV/XLSX theo bộ lọc.
- Ma trận RBAC có màn cấu hình cho Admin; quyền nghiệp vụ quan trọng vẫn bị giới hạn bởi role, ownership, facility và quy trình duyệt phía backend.

## Kiểm thử

Chạy các bộ kiểm thử hiện tại từ root project bằng `npm run test:frontend`, `npm run build`, `npm run check:contract` và `mvn -f backend/pom.xml test`. Số lượng test có thể thay đổi theo commit; kết quả của từng lần chạy là bằng chứng của lần chạy đó, không ghi cố định vào tài liệu này.

Không thực hiện migration hoặc ghi dữ liệu vào Supabase chỉ bằng việc đọc tài liệu trạng thái này.
