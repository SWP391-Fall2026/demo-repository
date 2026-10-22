# Chuyển database đang sử dụng

> Cập nhật19/10: schema tham chiếu chỉ là REF, không là chuẩn live. Đã xác minh PostgreSQL17.11 và áp dụng nhóm002/003/004 theo [hướng dẫn mới](D:/SWP/storage-rental/docs/guides/schema-alignment-20261019.md); [bằng chứng thực thi](D:/SWP/storage-rental/docs/testing/schema-migration-execution-20261019.md). Phần bên dưới là kế hoạch lịch sử trước xác minh; tuyệt đối không chạy001_scope_extensions.sql hoặc tự backfill theo suy đoán.

Schema chuẩn là `database/reference/current-schema-as-is.sql` người dùng cung cấp, gồm 15 bảng. File này chỉ để đối chiếu. Không chạy lại như script khởi tạo.

`database/migrations/001_scope_extensions.sql` là đề xuất bổ sung cột và hai bảng invoices/refund_transactions. Không có Flyway hoặc script tự chạy khi bật ứng dụng. Backend mặc định `ddl-auto=validate`; profile local/test mới dùng H2 create-drop riêng.

## Trình tự triển khai

1. Backup và dựng bản sao PostgreSQL của database thật. Kiểm kê số lượng, khóa ngoại, check constraint, phiên bản schema và timezone hiện tại.
2. Chạy SQL bổ sung trên bản sao. Dừng nếu unique index phát hiện trùng hợp đồng/reservation hoặc reference; xử lý dữ liệu theo chứng từ, không bỏ index để chạy tiếp.
3. Đối soát dữ liệu cũ trước khi dùng các workflow mới:
   - Payment: xác định đúng user_id, facility_code, invoice_id và giao dịch gốc từ reservation/contract; tạo Invoice lịch sử từ chứng từ thực, tránh ghi lại thu tiền.
   - Reservation: nhập giờ hẹn và rental_start_at đã xác thực, monthly_price_snapshot, đơn đang giữ kho và held_by_reservation_id. Trường appointment dạng chuỗi không được tự parse mù.
   - Contract: xác định start_at/end_at từ hợp đồng thật và timezone, không tự coi ngày là 00:00; kiểm tra giá, cọc, PIN và các kho đang thuê. Job quá hạn cần end_at.
   - Refund: liên kết payment, user, số tiền yêu cầu, trạng thái đã duyệt/hoàn và bằng chứng. Khoản legacy thiếu chứng từ không tự chuyển COMPLETED.
   - User: chuẩn hóa BCrypt, role aliases, chi nhánh, trạng thái; không giữ mật khẩu demo của prototype.
   - Giữ bảng staff_tasks cũ để đối soát; ứng dụng mới sử dụng daily_tasks.
4. Kiểm tra mapping timestamp có/không timezone của database thật, chạy validate, kiểm thử từng vai trò, đối chiếu báo cáo và tổng tiền trước/sau.
5. Chỉ triển khai sau đối soát và duyệt kế hoạch rollback. Rollback ứng dụng không xóa cột/bằng chứng hoặc giao dịch đã phát sinh.

Chưa kết nối hoặc chạy migration trên Supabase thật trong đợt tái cấu trúc này. Kiểm thử H2 không thay thế kiểm thử PostgreSQL, khóa đồng thời và dữ liệu lịch sử.
