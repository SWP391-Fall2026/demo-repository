# Đối chiếu toàn bộ migration với Supabase — 26/10/2026

> Cập nhật sau audit ban đầu: migration 016 đã xóa staff_tasks theo yêu cầu người dùng. Đối chiếu lại lúc 11:17:38 xác nhận đầy đủ tác động schema 002–016, missing=[], validate 18 Entity PASS. Xem [báo cáo xóa bảng](staff-tasks-retirement-20261026.md).

## Kết quả

VERIFIED trực tiếp trên Supabase staging project `xnerbsgbwdpemvnatvuy`: **không còn cấu trúc migration 002–015 bị thiếu**. Hibernate schema validate đạt với 18 Entity backend hiện tại. Cơ sở dữ liệu đã có các thay đổi cần cho các luồng H2 vừa kiểm thử; lượt này không cần phát hành SQL bổ sung.

Đã đối chiếu catalog PostgreSQL, không dựa trên việc H2 tests PASS để suy ra SQL đã chạy. H2 profile dùng `ddl-auto=create-drop`, tạo schema từ Entity; không chạy các file migration SQL theo thứ tự. Kết quả dưới đây xác nhận **tác động schema hiện có**, không khẳng định lịch sử chạy từng file vì repository không có migration ledger/Flyway.

| Migration | Tác động đã có trên staging |
| --- | --- |
| 002 | Các cột mapping nghiệp vụ bổ sung, invoices và refund_transactions |
| 003 | Unique index username/email không phân biệt hoa thường và phone chuẩn hóa |
| 004 | Reservation CHECK có NO_SHOW |
| 005 | Cột ảnh kho |
| 006 | PIN hash cơ sở và xác minh danh tính/điều khoản hợp đồng |
| 007 | Ba unique index cho Manager/cơ sở, Admin và Operations Manager |
| 008 | Cột PIN cơ sở mô phỏng |
| 009 | Contract CHECK có các trạng thái chờ thanh toán/bàn giao và hoạt động/kết thúc |
| 010 | invoices.price_snapshot là text |
| 011 | Cột status và customer_confirmed_at của biên bản |
| 012 | Tình trạng, ghi chú và đường dẫn bằng chứng bàn giao |
| 013 | Người/phiên bản xác nhận và lý do issue |
| 014 | Thời điểm/người báo issue |
| 015 | Deadline, bảng hồ sơ/bằng chứng hủy, liên kết refund và sáu index |

Kiểm aggregate dữ liệu không có nhóm trùng theo các biểu thức index migration 007: Facility Manager/cơ sở = 0, Admin = 0, Operations Manager = 0. Không xuất thông tin tài khoản hoặc bản ghi khách hàng.

CHECK trạng thái Contract live còn cho phép `CHECKOUT_REQUESTED` ngoài các giá trị trong file 009. Giữ nguyên tập giá trị rộng hơn đang được luồng trả kho sử dụng; chạy lại file 009 sẽ vô tình loại trạng thái này. Coverage kiểm các giá trị yêu cầu đều có, không ép constraint live về tập hẹp hơn.

## Thao tác và bằng chứng

Đã chạy kết nối read-only, transaction rollback, timeout truy vấn 20 giây và kiểm tra đúng host/port/project/database/schema/role. Không ghi dữ liệu nghiệp vụ, không chạy DDL, scheduler, seed hoặc replay migration đã có.

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=SupabaseMigrationCoverageTest" "-Dmigration.coverage.enabled=true" "-Duser.timezone=UTC"
```

PASS lúc 11:02:18 ngày 26/10/2026 giờ Việt Nam: 1 test, 0 failure/error/skipped; `missing=[]`, `hibernate_validated_entities=18`. Snapshot cục bộ `.tmp/supabase-migration-coverage/audit.json` lưu hash từng migration, catalog cột/index/CHECK/ACL và hash aggregate dữ liệu, không chứa credential hay nội dung hàng nghiệp vụ.

## File không chạy lại

- `001_scope_extensions.sql` là bản đề xuất lịch sử đã được thay thế bằng nhóm migration có kiểm soát; hướng dẫn database yêu cầu không chạy lại.
- `011_customer_confirmed_handover.sql` chứa UPDATE toàn bảng đặt lại status và customer_confirmed_at. Các cột đã có; replay UPDATE sẽ làm mất trạng thái xác nhận hiện tại. Không chạy lại thao tác này.
- `015_handover_review_and_cancellation.sql` đã COMMIT và postcheck ở lượt trước; xem [execution report](handover-migration-015-execution.md).

Không tạo migration rỗng hoặc ledger giả để đánh dấu lịch sử. Quyền người dùng cấp cho phép áp dụng phần còn thiếu; khảo sát cho thấy không có phần cần áp dụng trong lượt này.

Các chỉnh sửa form/nút/xem ảnh hoàn tiền phía React chỉ cần bản build frontend mới; migration không cập nhật code đang chạy. Backend đang phục vụ/scheduler không được restart trong thao tác kiểm tra schema này. Kết quả PostgreSQL luồng Staff/Manager được ghi riêng trong [báo cáo kiểm thử](staff-refund-evidence-postgresql-verification.md).

Regression sau thêm audit opt-in: `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` PASS lúc 11:04:20, 78 tests H2 thực thi, 0 failure/error; 31 mục live/migration/setup/audit opt-in không bật. Contract check PASS 92 operations/45 schemas/80 adapter calls; `git diff --check` PASS. Không sửa nghiệp vụ hoặc migration SQL trong task này.
