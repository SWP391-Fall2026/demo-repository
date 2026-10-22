# Kế hoạch đồng bộ schema — CHƯA PHÊ DUYỆT / CHƯA ÁP DỤNG

Repository: `D:/SWP/storage-rental`. Mốc kiểm kê: 18/10/2026. Đây là tài liệu và SQL nháp; không thuộc resources hay đường dẫn migration runtime. Không kết nối database, không chạy SQL, không thay đổi Entity/Service/Repository/Controller hoặc `ddl-auto=validate`.

## Kết luận để review

**Đủ căn cứ lập bản nháp, chưa đủ căn cứ chuẩn bị một release có thể triển khai.** Còn thiếu metadata live toàn hệ thống, dữ liệu chất lượng/đối soát, quyết định thời gian, ý nghĩa chi nhánh audit, privilege/RLS của bảng mới và một artifact rollback đã chứng minh tương thích PostgreSQL.

- 16 Entity, 216 mapped fields; schema tham chiếu có 15 bảng. Đối chiếu gồm 17 bảng (14 bảng được mapping sẵn trong REF, 2 bảng mới so với REF, và staff_tasks ngoài JPA).
- 37 cột mapping không có trong các bảng hiện diện ở REF. Chỉ **3 cột audit_logs** có chứng cứ thiếu từ metadata live do người dùng cung cấp; **34 cột còn lại chưa xác minh live**.
- `invoices` (12 cột) và `refund_transactions` (11 cột) không có trong REF; sự tồn tại/shape live **chưa biết**. Tổng 60 column candidates gồm 37 cột bổ sung + 23 cột hai bảng đó, không có nghĩa live đang thiếu 60 cột.
- Không có JPA association, enum Java/@Enumerated, converter, @Version hay sequence generator riêng. Có 7 query JPQL kèm PESSIMISTIC_WRITE; không thấy native SQL/JdbcTemplate trong source ứng dụng.
- Có 49 logical FK candidates; chúng không phải 49 FK live còn thiếu. Chỉ chọn những quan hệ/cardinality đã được xác minh, không chạy toàn bộ một cách máy móc.

## Phân loại bằng chứng

| Nhãn | Nghĩa | Giới hạn |
|---|---|---|
| A / LIVE | Metadata audit_logs người dùng đã cung cấp trong yêu cầu điều tra trước | Không truy vấn lại; không biết thời điểm lấy, length, quyền, index/FK/trigger/RLS |
| B / REF | SQL `database/reference/current-schema-as-is.sql` | Là snapshot tham chiếu 15 bảng, không chứng minh database live hiện tại |
| C / UNKNOWN | Mọi thông tin live chưa được cung cấp | Không được dùng để kết luận có/thiếu cột, bảng, index hoặc FK live |

`legacy-repository-schema.sql` chỉ là tài liệu cũ, có SERIAL audit ID và các policy rộng; không dùng làm migration hoặc nguồn quyền production. `database/migrations/001_scope_extensions.sql` là candidate cũ, không phải ledger chứng minh migration đã chạy.

## Tệp bàn giao

| Tệp | Nội dung |
|---|---|
| [schema-diff.md](schema-diff.md) | Bảng sáu cột theo yêu cầu cho từng field của từng bảng, gồm các cột REF không có mapping |
| [mapping-inventory.json](mapping-inventory.json) | Inventory JPA, nullable/length/unique/ID/default Java, snapshot REF và metadata audit đã cung cấp |
| [new-column-plan.md](new-column-plan.md) | Kiểu/nullability và căn cứ backfill cho từng candidate column mới |
| [query-and-state-inventory.json](query-and-state-inventory.json) | Query JPQL và vị trí ghi trạng thái, không tự biến comment thành database enum |
| [state-and-default-review.md](state-and-default-review.md) | Đối chiếu trạng thái/default/enum cho từng bảng, gồm drift comment và cột ngoài entity |
| [constraints-and-dependencies.md](constraints-and-dependencies.md) | Thứ tự, FK, unique/index, CHECK/default/NOT NULL |
| [risks-and-decisions.md](risks-and-decisions.md) | Audit/timezone, giao dịch, dữ liệu lịch sử, giới hạn và quyết định còn mở |
| [tests-and-rollback.md](tests-and-rollback.md) | Ma trận test PostgreSQL, điều kiện cutover và rollback giữ dữ liệu |
| [sql/00_metadata_readonly.sql](sql/00_metadata_readonly.sql) | Bộ câu SQL catalog chỉ đọc, cần operator thực hiện sau này |
| [sql/01_quality_queries_readonly.sql](sql/01_quality_queries_readonly.sql) | Sinh câu SELECT aggregate phù hợp các bảng/cột thực sự tồn tại; không tự EXECUTE |
| [sql/draft_10_audit.sql](sql/draft_10_audit.sql) | Ba cột audit mới, nullable, không giả lịch sử |
| [sql/draft_20_rental_inventory.sql](sql/draft_20_rental_inventory.sql) | Units, Reservation và Contract |
| [sql/draft_30_billing.sql](sql/draft_30_billing.sql) | Invoice, Payment, RefundRequest và RefundTransaction |
| [sql/draft_40_constraints.sql](sql/draft_40_constraints.sql) | Các unique/index/FK conditional và template CHECK NO_SHOW |
| [sql/draft_50_validate_constraints.sql](sql/draft_50_validate_constraints.sql) | Validation candidate, chỉ chọn FK thực sự được cài |
| [sql/rollback_review_readonly.sql](sql/rollback_review_readonly.sql) | Bằng chứng rollback chỉ đọc; không có down migration xóa dữ liệu |
| [source-snapshot.json](source-snapshot.json) | SHA-256 các file được bảo vệ, không chứa nội dung secret |
| [validation-report.md](validation-report.md) | Kết quả kiểm tra tĩnh, coverage và hash; không thay thế rehearsal PostgreSQL |

## Cách dùng bản nháp

1. Đọc metadata và đối chiếu từng field. Bộ SQL chỉ đọc không được Codex thực thi; operator có quyền được phê duyệt chọn câu phù hợp. Không gửi password/token/secret hoặc function body có bí mật vào báo cáo.
2. SELECT kiểm tra chất lượng được sinh theo metadata có thể bị RLS che hàng; số 0 dưới role hạn chế không phải chứng minh dữ liệu sạch. Dùng role kiểm toán có quyền phù hợp và snapshot nhất quán khi đối soát.
3. Với từng DDL candidate: xác nhận live thiếu thật; nếu có sẵn thì so type/default/nullability/index definition, không bỏ qua bằng IF NOT EXISTS.
4. Chọn constraint theo business invariant, không chỉ vì repository trả Optional. Chốt các điều kiện được nêu trong dependency/risk docs.
5. Chạy trên PostgreSQL thử nghiệm có bản sao schema/data được kiểm soát, kiểm thử rollback, sau đó mới xin phê duyệt triển khai cụ thể.

Mọi file `draft_*.sql` có guard `RAISE EXCEPTION` ở đầu và kết thúc `ROLLBACK`, không có COMMIT. Guard cố ý chặn thực thi nhầm. Đây không phải script production có thể chạy ngay; việc bỏ guard/đưa vào pipeline là bước cần phê duyệt riêng. Không dùng candidate SQL cũ và candidate này nối đuôi nhau.

Chưa có DML backfill tự động, ALTER TYPE thời gian/length/numeric, reset sequence, thay PIN, xóa bảng/cột hay chính sách GRANT/RLS tự suy đoán. Các phần này bị hoãn có chủ đích do chưa đủ bằng chứng, không được coi đã xử lý sau additive DDL.

## Các cổng phê duyệt

| Gate | Điều kiện |
|---|---|
| G0 metadata | Chụp đúng DB/schema/role/version; tất cả field/type/length/default/check/FK/index/sequence/RLS/trigger được xác minh |
| G1 mô hình | Actor-facility của audit; UTC/instant; precision/scale; namespace reference, invoice cardinality và retry refund được thống nhất |
| G2 dữ liệu | Không orphan/duplicate chưa giải thích; không thiếu liên kết/giá/thời điểm ở giao dịch active cần workflow mới |
| G3 an toàn | Backup/restore thử được, cửa sổ lock và tạm dừng tất cả writer; ACL/RLS bảng mới được đưa vào cùng transaction trước commit |
| G4 PostgreSQL | Validate toàn bộ entity và test ghi/đọc/concurrency/rollback qua; artifact quay lui thực sự tương thích |

Không có gate nào được đánh dấu đạt chỉ bằng test H2 hoặc mở TCP thành công.

## Nguồn kỹ thuật đối chiếu

- [Hibernate ORM 6.5 — mapping type, nullability và thời gian](https://docs.hibernate.org/orm/6.5/userguide/html_single/).
- [PostgreSQL — ALTER TABLE, khóa và constraint validation](https://www.postgresql.org/docs/current/sql-altertable.html).
- [PostgreSQL — CREATE INDEX và CONCURRENTLY](https://www.postgresql.org/docs/17/sql-createindex.html).
- [PostgreSQL — timestamp/timezone](https://www.postgresql.org/docs/current/datatype-datetime.html).

Phiên bản PostgreSQL live chưa được xác minh; không dùng tính năng riêng của PostgreSQL 18 chỉ vì tài liệu hiện hành là 18. Metadata query dự kiến cho PostgreSQL hiện đại (12+); operator xác nhận version trước khi chọn câu.
