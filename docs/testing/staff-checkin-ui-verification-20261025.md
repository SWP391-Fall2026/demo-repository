# Bỏ thao tác tiếp nhận trùng ở trang tra cứu — 25/10/2026

VERIFIED qua source: `CheckinWorkflow.verify` đã lưu `arrivedAt`, `identityVerifiedAt` và `identityVerifiedBy` trong cùng transaction xác nhận task. Trước thay đổi, trang tra cứu còn form gọi `/reservations/{id}/arrived`; trang task cũng gọi lại endpoint này sau khi verify thành công. Hai thao tác đó lặp việc ghi nhận khách đến, và request thứ hai lỗi có thể làm giao diện báo thất bại dù verify đã thành công.

## Thay đổi

- `frontend/src/features/reservation/pages/ReservationLookupPage.jsx`: bỏ form mã đặt chỗ và nút mặc định “Lưu thay đổi”; giữ bảng, tìm kiếm và làm mới. Mô tả hướng dẫn xác nhận qua task trong Công việc.
- `frontend/src/features/workforce/pages/StaffTaskBoardPage.jsx`: bỏ request `arrived` lặp sau `verifyCheckin`. Thông báo thành công ghi đúng việc đã xác minh và lưu giờ đến, không báo task COMPLETED khi backend vẫn giữ IN_PROGRESS.
- `docs/guides/customer-rental-flow.md`: cập nhật hướng dẫn xác nhận từ task, không lưu lại ở trang tra cứu.
- Không sửa backend hoặc dữ liệu nghiệp vụ trong task này; giữ nguyên các thay đổi danh mục từ task trước.

## Xác minh

| Kiểm tra | Lệnh / cách thực hiện | Kết quả |
| --- | --- | --- |
| Frontend | `& 'C:\Program Files\nodejs\npm.cmd' run check` | PASS: build, 12/12 tests, contract structure/routes (85 operations, 41 schemas, 74 frontend calls) |
| Backend | `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` | PASS: 55 tests thực thi trên H2, 0 failure/error; 8 mục live Supabase opt-in không bật trong lượt này; BUILD SUCCESS |
| Tra cứu trên trình duyệt | Render component thực với 2 đơn mô phỏng; nhập RSV-QA-002 vào tìm kiếm | PASS: bảng còn 1 đơn; không có nút “Lưu thay đổi”; chỉ gọi GET danh sách |
| Task trên trình duyệt | Mở nội dung task, dùng mã tự điền, tick đủ hai bước và nhấn Xác nhận check-in | PASS: một POST `/api/tasks/TSK-QA-001/checkin/verify`, sau đó GET tải lại task; không gọi `/arrived`; hiển thị thông báo thành công mới |
| Diff | `git diff --check` | PASS |

Ảnh giao diện tra cứu dùng dữ liệu mô phỏng: [staff-reservation-lookup-20261025.jpg](screenshots/staff-reservation-lookup-20261025.jpg).

Trang preview tạm đã được xóa sau khi kiểm thử; nó dùng component source thực và thay các API adapter bằng fixture, chặn fetch để không ghi dữ liệu khách hàng. Các tương tác này xác minh frontend; chưa phải bằng chứng xác nhận task Staff trực tiếp qua API/Supabase. Không thực thi check-in, gửi email hoặc tạo hợp đồng thật trong lượt này. Kết quả Supabase 11/11 của thay đổi danh mục được ghi riêng trong báo cáo catalog, không dùng để tuyên bố luồng check-in live đã đạt.
