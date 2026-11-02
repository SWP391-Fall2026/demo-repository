# Đối chiếu flow/service và Supabase — 02/11/2026

Nguồn yêu cầu: `flow_service_audit.md` do người dùng cung cấp, đánh giá mã nguồn ở commit `c499f59`. Các mục trong audit được đối chiếu với mã mới; kết quả dưới đây không thay thế nghiệm thu toàn bộ SRS/Figma.

## Sửa bổ sung

- PIN chính/tạm kiểm tra chủ thuê, cơ sở, kho đang thuê, thời hạn và trạng thái hợp đồng. Đổi PIN chính thu hồi PIN tạm. Đổi PIN, nghiệm thu và cấp lại PIN dùng khóa hợp đồng để tránh cập nhật trạng thái cũ.
- Cơ sở ngưng hoạt động không nhận báo giá/đơn mới; chưa được ngưng khi còn đơn giữ chỗ. Bảo trì/đổi loại kho phải còn đủ số kho bảo đảm cho đơn chưa gán kho.
- Tạo đơn, gán kho, yêu cầu check-in, phân công check-in và thanh toán cọc dùng khóa cơ sở nhất quán. Thời hạn cọc được kiểm tra sau khi chờ khóa. Job hết hạn khóa đơn trước hóa đơn.
- Nghiệm thu phát hành hóa đơn `EXTRA` cho phần phí vượt cọc; trạng thái kết thúc ngăn phát hành lại. Frontend hiển thị đúng hợp đồng, nội dung và bước tiếp theo của `EXTRA`/`RENEW`.
- VNPay không xử lý lại hóa đơn đã thanh toán qua giao dịch khác. QR/card mô phỏng bị tắt mặc định; chỉ local/test bật sẵn. Thu tại quầy vẫn yêu cầu Staff.
- Ticket kiểm tra đánh giá 1–5, priority và chiều dài ghi chú tương thích PostgreSQL; cấp lại PIN yêu cầu phiếu truy cập còn mở và đúng người thuê.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| `mvn -B -f backend/pom.xml test` | 163 test được phát hiện; 124 chạy đạt, 39 opt-in bỏ qua; không lỗi |
| `npm run check` | Build đạt; 19/19 frontend test; contract 102 operations, 50 schemas, 87 frontend calls |
| `DailyTasksSupabaseReadTest` với opt-in | Đạt, truy vấn theo cả 5 cơ sở |
| `SupabaseMigrationCoverageTest` với opt-in | 18 entity validate; `missing=[]`; migration effects 002–016 hiện diện; không nhóm manager/admin/ops trùng |
| Runtime | Backend `auth-supabase` tại 8080; frontend/proxy tại 5173; API trả đủ 5 cơ sở |

Hai kiểm tra Supabase trên dùng kết nối read-only, không chạy migration hay seed dữ liệu. Kiểm thử nghiệp vụ có ghi dữ liệu chạy trên H2 cô lập. Không kết luận toàn bộ luồng ghi đã được nghiệm thu trên Supabase chỉ từ các kiểm tra này.

## Dữ liệu và phạm vi còn thiếu

Snapshot API: `HN-CG` có 29 kho, `HCM-Q7` có 2 kho; `HN-NTL`, `HCM-TB`, `DN-HC` có 0 kho. Catalog chỉ trả kho khả dụng sau khi trừ đơn giữ chỗ. Cần danh mục kho và nhân sự vận hành thật trước khi chạy đầy đủ luồng tại các cơ sở trống; không tự nhân bản dữ liệu Cầu Giấy.

Database còn lịch sử fixture. VNPay hiện là sandbox, PIN mô phỏng khóa vật lý, hoàn tiền ghi nhận thủ công. Dữ liệu inventory và nhân sự thật của các cơ sở đang trống vẫn cần được provision trước demo; các giới hạn còn lại được ghi trong [trạng thái triển khai](../architecture/refactoring-status.md).
