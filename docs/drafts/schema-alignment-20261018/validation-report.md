# Kiểm chứng bộ tài liệu nháp

Kết quả: **PASS kiểm tra tĩnh offline**. Không kết nối/chạy PostgreSQL, không thực thi SQL và không chạy ứng dụng/test/Maven. Không dùng parser PostgreSQL: kiểm tra dấu ngoặc/chuỗi/comment/statement chỉ là lexical, không chứng minh cú pháp/ngữ nghĩa SQL trên phiên bản live.

- 16 entity / 216 field được kiểm kê; từng field có hàng trong schema-diff.
- 37 ADD COLUMN candidates khớp mapping thiếu theo REF; 23 cột hai bảng mới khớp mapping. Không suy ra chúng đều thiếu live.
- 49 logical FK candidates tham chiếu đúng field và parent PK trong inventory; không chứng minh đó là FK live hoặc đều cần thêm.
- Tất cả draft DDL có guard RAISE EXCEPTION, BEGIN/ROLLBACK và không có COMMIT; không có DML backfill, drop table/column hoặc ALTER TYPE.
- Tất cả file readonly chỉ có BEGIN READ ONLY REPEATABLE READ, SET LOCAL timeout, SELECT/WITH và ROLLBACK; không gọi nextval/setval hoặc hàm quản trị backend.
- Link tài liệu nội bộ tồn tại. Không sao chép giá trị default mã truy cập legacy.
- Hash tất cả file trong source-snapshot khớp: code ứng dụng, cấu hình, SQL tham chiếu/migration cũ và tài liệu ngoài khu vực draft được giữ nguyên.

| SQL file | Số statement theo lexer |
|---|---|
| 00_metadata_readonly.sql | 20 |
| 01_quality_queries_readonly.sql | 20 |
| draft_10_audit.sql | 8 |
| draft_20_rental_inventory.sql | 25 |
| draft_30_billing.sql | 21 |
| draft_40_constraints.sql | 61 |
| draft_50_validate_constraints.sql | 49 |
| rollback_review_readonly.sql | 8 |

Các gate triển khai vẫn BLOCKED như README. Cần metadata live và rehearsal PostgreSQL mới có thể phê duyệt bản SQL production.
