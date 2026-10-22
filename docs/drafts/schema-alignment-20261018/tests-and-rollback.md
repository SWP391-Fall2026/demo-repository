# Kiểm thử PostgreSQL và kế hoạch rollback — chưa thực hiện

## Ma trận kiểm thử

| ID | Kiểm tra trên PostgreSQL thử nghiệm | Điều kiện đạt |
|---|---|---|
| PG-01 | Metadata đầy đủ và inventory 16 entity / 216 fields | So shape đúng, phân biệt public/search_path; không dựa REF thay live |
| PG-02 | Reproduce lỗi validate trên clone trước thay đổi | Xác nhận cùng mapping/config/runtime artifact; giữ validate |
| PG-03 | Review từng expansion draft sau bỏ guard trong bản được duyệt | Không có type/default/constraint tồn tại khác bị che bằng IF NOT EXISTS; không mất dữ liệu |
| PG-04 | Validate toàn bộ entity sau selected changes | SessionFactory tạo được; xử lý temporal/type thực tế, không chỉ thiếu cột đầu tiên |
| PG-05 | Legacy nullable reads + unmodeled columns | Đọc lịch sử audit và các entity; legacy columns/triggers/producers còn hoạt động |
| PG-06 | NOT NULL/default/long Unicode/numeric | Ghi đúng bắt buộc, không truncate/round ngoài policy; ORM NULL/default được kiểm chứng |
| PG-07 | Temporal round-trip UTC / Asia/Ho_Chi_Minh / session khác | Cùng instant khi model yêu cầu, lịch hẹn giữ đúng local business time; không dịch lịch sử |
| PG-08 | Audit actor/entity/facility/IP + Admin API | Không giả actor client; semantics đã chốt, Customer/Staff bị chặn đọc theo quyền hiện tại; NULL global hợp lệ |
| PG-09 | PK/sequence/ID/grants | Insert audit lấy ID không trùng; String ID/policy key không bị đổi; quyền sequence đúng; không reset sequence |
| PG-10 | NO_SHOW và state CHECK | Không còn old CHECK chặn NO_SHOW; state cũ khác được đối soát; thêm CHECK NOT VALID vẫn chặn new invalid writes |
| PG-11 | FK cycles/orphans/optional links | Insert reservation trước assign, handover sau contract; nullable links hợp lệ; không orphan mới, validate legacy sau reconciliation |
| PG-12 | Unique/collation/cardinality | Hai customer/cơ sở, exact/casefold duplicate tests; invoice theo kỳ/refund retries không bị constraint sai thiết kế |
| PG-13 | Refund quota đồng thời | Cùng payment: pending chiếm quota, cancel giải phóng, approval/evidence/completion không double count; hoàn không vượt tiền gốc |
| PG-14 | Payment/assignment concurrent | Same/different keys, thất bại rồi thử lại, callback lặp; không duplicate thu tiền hoặc overbook; timeout/deadlock xử lý được |
| PG-15 | Audit failure atomicity | Fault gây insert audit lỗi trong clone; không commit một phần nghiệp vụ tiền/kho |
| PG-16 | Active legacy workflow | Không active rental thiếu end_at/snapshot, PIN/no-show/expiry đúng sau cutover; không mất lịch sử khỏi scope |
| PG-17 | Reporting/ledger conservation | Count/sum thu/hoàn/cọc/quota trước-sau khớp chứng từ; FAILED không tạo receivable ảo hoặc counted thu |
| PG-18 | RLS/ACL/default privileges | Không lộ bảng tài chính qua direct API/roles; backend đủ quyền; query kiểm toán nhìn đầy đủ, không false zero do RLS |
| PG-19 | Lock/volume/index rehearsal | lock timeout/statement timeout, build/validate duration đạt cửa sổ; chọn normal hay concurrent index đúng transaction |
| PG-20 | Restore/rollback rehearsal | Artifact thực sự tương thích clone; rollback không xóa audit/payment/evidence phát sinh |

Không dùng DB_URL production cho test. Profile test hiện fixed H2 chỉ là kiểm thử logic; PostgreSQL harness riêng cần kiểm tra datasource/effective profile/secret resolution trước khi chạy. Không khởi động application với scheduler lên DB live để kiểm tra schema. Việc tạo fixtures/clone và chạy các test trên PostgreSQL là giai đoạn tương lai cần phê duyệt, không được thực hiện bởi bộ sinh tài liệu.

## Bằng chứng đối soát và backfill (chưa có DML)

- Chụp schema + backup được restore thử; thống kê row count, số tiền theo invoice type/status, refund hoàn và pending quota trên snapshot nhất quán. Giữ chứng từ/nguồn và mapping quyết định cho từng batch tương lai, bao gồm trước-sau nếu được phép sửa lịch sử.
- Payment owner/facility có thể đề xuất từ đúng reservation/contract khi link gốc duy nhất, hai nguồn không mâu thuẫn và đối chiếu chứng từ. Không tên customer/email/giá hiện hành làm khóa kết nối.
- Không tạo một Invoice trên mỗi Payment attempt. Phải nhận diện nghĩa vụ thu gốc, kỳ, loại và các attempt PAID/FAILED trước gán invoice_id. Nếu không có chứng cứ, giữ NULL và chặn cutover luồng liên quan.
- Snapshot giá từ báo giá/hợp đồng/hóa đơn gốc có hiệu lực; không tính lại bằng policy/unit hiện tại. Thời gian từ lịch hẹn/hợp đồng chính thức có zone; không đoán từ ngày hoặc display string.
- Audit/renewal/no-show/extension/incident không có chứng cứ thì NULL, không false/0/default now(). Hoàn thủ công lịch sử không có chứng từ không sinh proof/reference hoặc approval actor giả.
- Không tự động gộp, xóa, truncate, normalize hay sửa dòng duplicate/orphan; từng trường hợp cần quyết định nghiệp vụ và rollback riêng.

## Rollback theo giai đoạn

| Giai đoạn | Trước commit | Sau commit (nếu được duyệt triển khai sau này) |
|---|---|---|
| Expansion D10/D20/D30 | PostgreSQL DDL trong transaction có thể rollback; kiểm tra session đã hết transaction/lock | Giữ cột/bảng mới; dùng code đã chứng minh tương thích. Không tự drop hay xóa dữ liệu phát sinh |
| Index/FK/CHECK D40 | Rollback transaction nếu chưa commit; giữ exact old constraint definition trong backup review | Không hoàn tác hàng loạt constraint. Cần script điều chỉnh constraint được duyệt dựa trên trạng thái hiện tại, maintenance và dữ liệu mới |
| FK validation D50 | Hủy/rollback validation khi timeout/fail; không giả orphan đã được giải quyết | Giữ trạng thái được xác minh; không drop FK chỉ để app chạy. Dừng writer nếu invariant không còn đảm bảo |
| Backfill tương lai | Batch có bằng chứng và kế hoạch đảo chính xác; chưa có DML trong bộ này | Không blanket UPDATE NULL hoặc tính lại tiền. Chỉ đảo các row/version có before-image và chưa phát sinh phụ thuộc, qua phê duyệt |
| Cutover app | Chưa chuyển traffic nếu thiếu gate | Tạm dừng writer/scheduler, giữ data; chuyển sang artifact đã qua rehearsal. Nếu không có artifact tương thích thì maintenance, không copy entity cũ tùy tiện |

Hiện chưa có release PostgreSQL/rollback artifact nào được chứng minh tương thích toàn bộ schema live. Baseline ZIP có các mismatch lịch sử khác (ví dụ LoginHistory), nên không thể hứa “checkout commit cũ là rollback an toàn”. Rollback schema không đồng nghĩa rollback nghiệp vụ hoặc hoàn tác chuyển tiền thủ công.

Sequence ID có thể có khoảng trống vì cache/transaction rollback; sequence không có cùng tính rollback với row transaction. Không setval(max(id)) trong môi trường có writer, không tái sử dụng ID đã cấp. SQL chứng cứ rollback chỉ đọc sequence/catalog.

Sau sự cố không restore toàn database cũ đè lên giao dịch tiền/audit mới trừ khi có kế hoạch phục hồi được phê duyệt và đối soát. Bằng chứng hoàn tiền là file ngoài DB cũng cần backup/retention; backup DB một mình không khôi phục attachment.

## Tiêu chí dừng / chưa đủ để triển khai

- Thiếu metadata live, privileges hoặc không có quyền xem đủ dữ liệu.
- Temporal mapping chưa chốt/validate chưa qua, có active row thiếu field cần workflow.
- Có duplicate/orphan/ledger imbalance chưa giải thích; không có nguồn backfill.
- Chưa chốt invoice/refund cardinality, reference namespace, actor/event facility.
- Chưa có ACL/RLS bảng mới, cửa sổ lock, maintenance/scheduler plan hoặc restore/rollback rehearsal.

Chỉ khi G0–G4 trong README đều đạt mới chuẩn bị bản migration production/version ledger và xin phê duyệt thực thi riêng.
