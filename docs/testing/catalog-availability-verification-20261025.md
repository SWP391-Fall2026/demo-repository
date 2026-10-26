# Kiểm thử số chỗ còn lại trong danh mục — 25/10/2026

## Kết quả

VERIFIED: danh mục và bước tạo đơn dùng cùng truy vấn đếm đơn giữ chỗ theo cơ sở + loại kho. Số kết quả trong danh mục không vượt `max(0, số Unit available - số đơn giữ chỗ chưa gán Unit)`. Không cập nhật trạng thái Unit khi chỉ đọc danh mục.

Đơn giữ chỗ gồm `RESERVED` chưa gán Unit và `PENDING_PAYMENT` chưa gán Unit có `created_at > now - pendingPaymentHold`. Đúng thời điểm hết hạn không còn chiếm chỗ, dù tác vụ hết hạn chưa chạy. Thời hạn lấy từ `ReservationHoldPolicy`, mặc định 5 phút. Đơn đã gán Unit, hủy, hết hạn hoặc hoàn thành không bị trừ thêm. Giới hạn số kết quả theo toàn bộ sức chứa của loại kho tại cơ sở, kể cả khi có bộ lọc giá/diện tích.

## Kiểm tra đã chạy

Môi trường: Windows PowerShell, Java 21, Maven 3.9.16, Node 24.15.0. Maven chạy offline với cache sẵn có. Sandbox chặn Java xử lý JAR trong cache ngoài workspace nên các lượt Maven hoàn tất được chạy với quyền ngoài sandbox. Không sửa dependency hoặc cấu hình riêng.

| Kiểm tra | Lệnh | Kết quả thực tế |
| --- | --- | --- |
| Frontend build, Vitest, contract | `& 'C:\Program Files\nodejs\npm.cmd' run check` | PASS: build; 12/12 frontend tests; 85 operations, 41 schemas, 74 frontend calls |
| Backend H2 và đóng gói | `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` | PASS: 55 tests thực thi, không failure/error; 8 mục của lớp Supabase opt-in bị bỏ qua trong lượt H2; BUILD SUCCESS |
| Supabase staging trực tiếp | `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=FacilityCatalogSupabaseTest" "-Dcatalog.supabase.enabled=true" "-Duser.timezone=UTC"` | PASS: 11 tests, 0 failure, 0 error, 0 skipped; BUILD SUCCESS lúc 22:53:20 giờ Việt Nam |
| Diff | `git diff --check` | PASS |

Các trường hợp dùng chung trong `CatalogAvailabilityChecks`:

- Kho cuối cùng bị giữ bởi đơn RESERVED chưa gán không xuất hiện; Unit vẫn giữ trạng thái database ban đầu.
- Pending còn hạn, đúng 5 phút và quá 5 phút; không phụ thuộc job dọn dẹp.
- CANCELLED, EXPIRED, CHECKED_IN, NO_SHOW không trừ chỗ (4 ca).
- Đơn đã gán kho không trừ hai lần.
- Nhiều đơn chỉ trừ đúng cơ sở và loại kho tương ứng.
- Bộ lọc diện tích/giá không làm mất chỗ có thể đặt khi còn sức chứa ngoài tập kết quả lọc.
- Nhiều đơn hơn số kho không tạo sức chứa âm; hủy đơn khôi phục sức chứa.
- Tạo đơn mới làm danh mục giảm chỗ; tạo vượt sức chứa bị 409; hủy rồi tạo lại được.

## Bằng chứng Supabase và bảo toàn dữ liệu

VERIFIED: test dùng PostgreSQL Session pooler của project staging `xnerbsgbwdpemvnatvuy`, database `postgres`, schema `public`, role `postgres`. Test kiểm tra project/host/database/schema/role trước khi tạo fixture; không dùng H2 thay thế ở lượt này. Spring nạp cấu hình chạy sẵn có; không xuất credential, OTP hoặc JWT.

Mỗi ca chạy trong transaction rollback với các mã `CATQA-<UUID>-*` riêng cho facility, unit, reservation và user tổng hợp. Sau từng transaction, `@AfterTransaction` mở kết nối kiểm tra độc lập và xác nhận tổng số fixture còn lại bằng 0. Không tạo dữ liệu thanh toán, không gửi email, không chạy migration, không đổi schema hoặc dữ liệu khách có sẵn. Hibernate chỉ `validate`; SQL init và scheduler bị tắt.

Giới hạn: đây là integration test service/repository với database thật; ActorContext, báo giá, phát hành hóa đơn và audit được mock. Không phải bằng chứng đăng nhập, thanh toán hoặc trình duyệt end-to-end. Chưa khởi động lại backend đang phục vụ giao diện; cần nạp bản build mới để phiên chạy đó nhận thay đổi. Danh mục là ảnh chụp tại lúc tải; bước tạo đơn vẫn kiểm tra lại trong khóa cơ sở khi có yêu cầu đồng thời.

## Pitfall và đề xuất AGENTS.md

Lượt đầu sau khi tách lớp test kế thừa có 3 assertion FAIL do các method kế thừa chưa được bao transaction. Đã khai báo `@Transactional` ngay trên lớp dùng chung, giữ nguyên assertion, rồi chạy lại toàn bộ H2 và Supabase đạt. Không thay đổi hoặc làm yếu test có sẵn.

Đề xuất một dòng, chưa sửa AGENTS.md: **Khi các test JPA kế thừa method từ lớp cơ sở, đặt `@Transactional` trên chính lớp cơ sở và xác minh rollback độc lập trước khi chạy với database dùng chung.**
