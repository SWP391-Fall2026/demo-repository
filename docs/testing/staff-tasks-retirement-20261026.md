# Xóa bảng legacy staff_tasks — 26/10/2026

## Kết quả

VERIFIED: không có Java Entity, SQL/query hoặc cấu hình backend runtime tham chiếu `staff_tasks`. `DailyTask` ánh xạ `daily_tasks`; TaskController/TaskService dùng DailyTaskRepository.

Theo yêu cầu trực tiếp của người dùng “nếu không [ánh xạ] thì xóa bảng đó đi”, đã COMMIT migration 016 trên Supabase staging project `xnerbsgbwdpemvnatvuy` lúc **11:15:35 ngày 26/10/2026 giờ Việt Nam**. Đọc kiểm sau commit: public.staff_tasks không còn, public.daily_tasks giữ nguyên. Không có cascade.

## Preflight và bảo toàn dữ liệu

- Bảng trước xóa có 0 dòng; không mất dữ liệu task lịch sử.
- Không có FK từ bảng khác trỏ vào, view phụ thuộc hoặc routine public có source tham chiếu tên staff_tasks; không thuộc publication.
- Backup cấu trúc, defaults, constraints/index, trigger, policy, grants/owner và RLS được tạo tại file riêng Git-ignored `var/staff-tasks-retirement/restore-staff_tasks.private.sql`. Không in nội dung backup lên terminal hoặc đưa vào Git.
- SHA-256 backup: `1b745c0717e3584a4eb1d69988c8a9e7811bf257d76d834b6dfbe174c451d1fe`.
- Rehearsal: DROP RESTRICT → Hibernate validate 18 Entity → phục hồi từ backup → so cột/index/CHECK/ACL và hash dữ liệu → ROLLBACK, hoàn tất 11:14:39. PASS.
- Apply: kiểm lại backend/dependency/data hash và SHA khớp rehearsal, DROP RESTRICT, validate 18 Entity, so hash 10 bảng nghiệp vụ trước COMMIT rồi đọc kiểm sau. PASS; daily_tasks và các bảng nghiệp vụ không thay đổi.
- Migration SHA-256: `9aeed11fc4b3930525d590c66769a34ebe93b981268ed64688254ab5b9080945`.

Lượt inspect đầu dừng trước backup/drop do so sánh cách PostgreSQL hiển thị regclass (`staff_tasks` thay vì `public.staff_tasks`); đã sửa harness và chạy lại đạt. Không có DDL commit trong lượt thất bại.

## Lệnh thực thi

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=RetireStaffTasksStagingTest" "-Dstaff.tasks.retire.mode=inspect" "-Duser.timezone=UTC"
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=RetireStaffTasksStagingTest" "-Dstaff.tasks.retire.mode=rehearsal" "-Duser.timezone=UTC"
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=RetireStaffTasksStagingTest" "-Dstaff.tasks.retire.mode=apply" "-Duser.timezone=UTC"
```

Cả ba operation cuối đạt 1/1 PASS. Runner chỉ chạy với cờ opt-in, không nằm trong app startup. Không chạy schema reference hoặc migration cũ để tạo lại bảng. Bằng chứng riêng: `var/staff-tasks-retirement/{inspect,rehearsal,apply}.json`.

Phục hồi nếu cần: dùng bản restore riêng đã rehearsal trong transaction trên đúng target sau kiểm tra public.staff_tasks chưa tồn tại; không ghi đè daily_tasks và không chạy schema legacy toàn bộ. Bản sao hiện tại có 0 dòng nhưng giữ cấu trúc/quyền để phục hồi theo snapshot. Không sửa các schema reference lịch sử chỉ để che việc bảng đã từng tồn tại.

Postcheck trực tiếp PostgreSQL PASS 2/2 lúc 11:17:38: `DailyTasksSupabaseReadTest` xác nhận staff_tasks không còn, mapping và truy vấn theo cơ sở của DailyTaskRepository vẫn chạy; `SupabaseMigrationCoverageTest` xác nhận effects 002–016 có đủ, missing=[] và 18 Entity validate đạt. Lệnh:

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=SupabaseMigrationCoverageTest,DailyTasksSupabaseReadTest" "-Dmigration.coverage.enabled=true" "-Ddaily.tasks.supabase.read=true" "-Duser.timezone=UTC"
```

Postcheck chỉ đọc; không chạy scheduler hoặc tạo task thử trên dữ liệu khách. Chưa kiểm ứng dụng ngoài repository này; bằng chứng không có phụ thuộc dựa trên backend hiện tại, catalog PostgreSQL và DROP RESTRICT thực tế. File backup riêng tiếp tục được giữ để phục hồi nếu cần.

Regression cuối: `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` PASS 78 tests H2 thực thi, 0 failure/error; 33 mục live/migration/setup/audit opt-in không bật; BUILD SUCCESS lúc 11:19:22. Contract check 92 operations/45 schemas/80 adapter calls và `git diff --check` PASS. Không thay code nghiệp vụ backend trong task này.
