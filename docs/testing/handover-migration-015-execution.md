# Migration 015 — Supabase staging, 26/10/2026

## Đã áp dụng và đọc kiểm lại

VERIFIED: migration `015_handover_review_and_cancellation.sql` đã COMMIT trên project staging `xnerbsgbwdpemvnatvuy`, Session pooler `aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`, schema public, role postgres. Người dùng cho phép rehearsal rollback rồi apply nếu đạt trong cuộc hội thoại này.

SHA-256 đã rehearsal và apply: `365b08cb92bfa8eb86dced80fd1ad0bea88c720f2d09b7eeb2e1dcac85aac89a`.

| Mốc | Kết quả | Giờ Việt Nam 26/10/2026 |
| --- | --- | --- |
| Inspect chỉ đọc | PASS: xác minh target, capture catalog/ACL/index/constraint và hash dữ liệu | 08:41:26 |
| Rehearsal hoàn tất | PASS: DDL + fixture trong transaction, validate 18 Entity, kiểm tra quyền/ràng buộc; rollback schema và dữ liệu về baseline | 08:45:46 |
| Apply hoàn tất | PASS: kiểm lại SHA/catalog khớp rehearsal, validate/fixtures rồi COMMIT; đọc kiểm sau COMMIT đạt | 08:46:46 |

Rehearsal có hai lượt chưa đạt, đều rollback trước COMMIT: lớp bọc Hibernate ban đầu chặn yêu cầu commit nội bộ khi validate; sau đó fixture thiếu các trường NOT NULL legacy của handover_records. Đã sửa harness/fixture, không sửa migration hoặc hạ assertion. Lượt rehearsal cuối cùng đạt trước apply.

## Phạm vi đã kiểm chứng

- Đủ 18 Entity Hibernate validate với schema sau migration, không dùng ddl-auto=update/create trên Supabase.
- Thêm 34 cột mapping tổng cộng: deadline handover, liên kết refund và hai bảng lịch sử/bằng chứng. Tất cả định nghĩa cột cũ được so sánh và giữ nguyên.
- Đủ sáu chỉ mục được migration khai báo; thử tạo hai yêu cầu PENDING cho cùng Contract bị PostgreSQL từ chối `23505`.
- CHECK status không hợp lệ bị từ chối `23514`; evidence tham chiếu review không tồn tại bị từ chối `23503`.
- Khoảng thời gian bàn giao/deadline trên timestamp thật là 86400 giây.
- Hai bảng mới không cấp SELECT/INSERT/UPDATE/DELETE trực tiếp cho PUBLIC, anon, authenticated hoặc service_role; backend dùng owner như target đã được phê duyệt. Điều này không thay thế kiểm thử Spring RBAC.
- Hash row dữ liệu của 10 bảng nghiệp vụ trước/sau giống nhau: handover_records, refund_requests, contracts, reservations, units, payments, invoices, daily_tasks, users, facilities. Giá trị được băm bên trong PostgreSQL; không xuất bản ghi hoặc credential. Các cột mới được loại khỏi hash so sánh lịch sử vì trước migration chưa tồn tại.
- Không backfill deadline hoặc tạo yêu cầu hủy cho biên bản lịch sử. Không chạy scheduler, seed hoặc tác vụ xử lý nghiệp vụ hàng loạt.

## Lệnh và bằng chứng

Từ repository root, Maven offline/Java 21, JVM UTC:

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverMigration015Test" "-Dhandover.migration.mode=inspect" "-Duser.timezone=UTC"
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverMigration015Test" "-Dhandover.migration.mode=rehearsal" "-Duser.timezone=UTC"
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverMigration015Test" "-Dhandover.migration.mode=apply" "-Duser.timezone=UTC"
```

Runner test riêng không được app startup gọi. Mặc định không chạy nếu không có cờ operation. Runtime Spring chỉ nạp cấu hình kết nối hiện có, không mở/in file riêng bằng công cụ đọc file hoặc xuất credential. Apply từ chối chạy lại nếu schema đã có phần bổ sung; không dùng runner cũ cho migration 002/003/004.

Bằng chứng cục bộ: `.tmp/handover-migration-015/inspect.json`, `rehearsal.json`, `apply.json` gồm target, metadata, hash dữ liệu, thời điểm và trạng thái commit; không chứa mật khẩu, JWT hoặc bản ghi nghiệp vụ.

## Kiểm thử sau apply

Bộ test `HandoverReviewSupabaseTest` tái sử dụng các assertion của H2, dùng PostgreSQL thật, MockMvc và tài khoản tổng hợp. Scheduler tắt. Phần timer chỉ gọi workflow cho đúng Contract fixture; job quét toàn bộ database được kiểm riêng bằng H2 để không tác động dữ liệu staging khác khi giả lập đồng hồ tương lai.

Lượt live đầu bị PostgreSQL `08006 / Connection reset` rồi treo đọc socket. Đã dừng đúng tiến trình test, bổ sung timeout socket/query và ghi prefix trước khi tạo fixture. Recovery chỉ xóa dữ liệu có mã và nội dung synthetic đã kiểm chứng, sau đó hash 10 bảng khớp baseline migration. Không xóa hồ sơ khách thật. Đây là lỗi kết nối của lượt chạy, không ghi thành PASS.

Kết quả live cuối cùng:

| Lượt | Kết quả | Hoàn tất giờ Việt Nam 26/10/2026 |
| --- | --- | --- |
| Toàn bộ luồng bàn giao/hủy/hoàn | PASS 16/16, 0 failure/error/skipped | 09:03:47 |
| Bổ sung lý do dài | PASS 1/1, lưu đầy đủ lý do trong hồ sơ và không vượt cột legacy của Refund/Audit | 09:07:30 |
| Dọn fixture và hash dữ liệu cũ | PASS sau mỗi lượt; `historical_data_unchanged=true`, `synthetic_fixture_cleanup_verified=true` | 09:07:29 |

17 ca gồm: đúng hạn 24 giờ, từ chối/cấp lại hạn và phản hồi khách, quyền theo vai trò/chi nhánh/chủ sở hữu, hủy trực tiếp bị chặn, duyệt và retry/đồng thời, hoàn đúng 50% RENT và không hoàn cọc, trạng thái Unit/Reservation/Contract/task, rollback khi dữ liệu/chứng từ sai, upload/tải bằng chứng, sửa biên bản vẫn giữ lịch sử, chuỗi Staff bằng chứng hoàn → Manager xác nhận COMPLETED, cùng lý do dài.

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverReviewSupabaseTest" "-Dhandover.supabase.enabled=true" "-Duser.timezone=UTC"
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverReviewSupabaseTest#preservesLongReasonsWithoutOverflowingLegacyRefundOrAuditColumns" "-Dhandover.supabase.enabled=true" "-Duser.timezone=UTC"
```

Lượt bổ sung đầu có assertion FAIL vì fixture kỳ vọng giữ khoảng trắng cuối, trong khi validation `Inputs.text` đã trim từ trước; đã sửa fixture không có khoảng trắng thừa và giữ nguyên assertion kiểm tra toàn bộ nội dung. Không bỏ test/skip assertion. Khi rà soát phát hiện lý do tối đa 4000 ký tự có thể vượt cột legacy varchar(255), đã sửa để lưu nguyên văn trong review, còn Refund/Audit dùng bản tóm tắt liên kết review; không đổi schema hoặc SHA migration.

Bộ live dùng MockMvc và `user(...)` của Spring Security Test để chọn principal; truy vấn, khóa đồng thời và transaction là PostgreSQL thật. Không phải chứng cứ đăng nhập JWT, trình duyệt kết nối backend mới hoặc giao dịch chuyển tiền ngân hàng thực. Không gửi email/OTP. Audit sequence có thể tăng do ca test đã commit rồi dọn; không reset sequence hoặc thay dữ liệu lịch sử.

Mọi test live/migration được opt-in, mặc định không chạy trong `mvn verify`. Cờ `handover.supabase.enabled` chỉ dùng cho staging đã xác nhận, với timeout truy vấn/socket hữu hạn. File chứng từ tổng hợp nằm trong target của test, không là chứng từ chuyển tiền thật.

Regression cuối trên H2: `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` PASS lúc 09:08:49, 76 tests thực thi, 0 failure/error; 27 mục live/migration/recovery opt-in không bật. `node scripts/check-contract.mjs` PASS: 92 operations, 45 schemas, 80 frontend calls. `git diff --check` PASS. Frontend không đổi trong lượt áp dụng migration này; kết quả build/12 tests từ lượt triển khai trước vẫn được ghi riêng.

Đề xuất AGENTS.md, chưa sửa khi chưa được đồng ý: **Test dùng database dùng chung phải đặt socket/query timeout, ghi prefix fixture trước lần ghi đầu, và kiểm tra cleanup/hash dữ liệu sau khi lỗi kết nối.**

## Vận hành và rollback

Schema staging đã có migration 015. Backend đang phục vụ giao diện chưa được restart trong thao tác migration. Cần dùng bản build mới và kiểm tra scheduler được bật cho vận hành khi triển khai ứng dụng; không tự bật các job trên dữ liệu hiện có trong kiểm thử này.

Rollback ứng dụng giữ nguyên schema bổ sung và mọi chứng từ/hồ sơ đã phát sinh; không DROP hoặc xóa dữ liệu để rollback. Capture trong lượt này là metadata + hash đối soát, không phải bản backup đầy đủ để phục hồi database. Migration additive không cập nhật/xóa dòng lịch sử; không tuyên bố đã kiểm chứng cơ chế PITR/backup của nhà cung cấp.
