# Luồng khách xem bằng chứng hoàn tiền trên PostgreSQL staging

Nguồn: người dùng yêu cầu kiểm thử trực tiếp sau khi bỏ form tạo/ngoại lệ và hủy yêu cầu khỏi trang khách. Môi trường được sử dụng tiếp: Supabase staging project `xnerbsgbwdpemvnatvuy`, Session pooler PostgreSQL, schema public. Không chạy migration, seed môi trường hoặc chuyển tiền thật trong lượt này.

## Luồng kiểm tra

Hai test dùng chung giữa H2/PostgreSQL:

- `approvedRentRefundUsesExistingStaffEvidenceThenManagerConfirmation`: Staff ghi hồ sơ hủy → Manager phê duyệt → khách gửi phản hồi → Staff tải PDF chứng từ tổng hợp → Manager và khách chủ hồ sơ tải đúng nội dung → chặn khách/Manager khác và anonymous → Manager xác nhận COMPLETED → khách tiếp tục xem được.
- `customerViewsRefundImageFromOwnRequestAfterResponding`: cùng luồng với ảnh PNG hợp lệ; danh sách `/api/refunds` của khách chỉ có hồ sơ đúng user, hiển thị EVIDENCE_SUBMITTED; khách/Manager tải đúng byte ảnh và content-type; khách khác không thấy yêu cầu trong danh sách và không mở file được; Manager xác nhận rồi khách vẫn tải đúng ảnh, số tiền hoàn 1.350.000 VND (50% RENT 2.700.000), DEPOSIT không có khoản hoàn.

Lệnh thực thi từ repository root:

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverReviewSupabaseTest#approvedRentRefundUsesExistingStaffEvidenceThenManagerConfirmation+customerViewsRefundImageFromOwnRequestAfterResponding" "-Dhandover.supabase.enabled=true" "-Duser.timezone=UTC"
```

## Bảo toàn dữ liệu và giới hạn

Test xác minh project/host/database/role trước ghi, dùng mã fixture `HR<UUID8>` riêng, scheduler/SQL init/DDL tắt. Mỗi ca dọn đúng dữ liệu tổng hợp liên quan; cuối lượt so hash 10 bảng nghiệp vụ với baseline ngay trước test. File tải lên nằm trong thư mục target kiểm thử, không là chứng từ ngân hàng thật.

Các request dùng MockMvc để chạy controller/Spring Security/service/JPA/transaction trên PostgreSQL thật. Principal được cấp bằng `user(...)` của Spring Security Test; đây không là kiểm thử đăng nhập JWT hoặc browser kết nối backend. Giao diện chỉ đọc và việc không còn hai form đã được kiểm riêng bằng trình duyệt ở lượt trước. Không gửi OTP/email và không thao tác hoàn tiền khách thật.

## Kết quả thực tế

PASS: 2 tests, 0 failures, 0 errors, 0 skipped. Maven BUILD SUCCESS lúc **10:49:24 ngày 26/10/2026 giờ Việt Nam**. Cả ảnh PNG và PDF đều tải đúng byte/content-type; trạng thái đổi APPROVED → EVIDENCE_SUBMITTED → COMPLETED; Staff không có quyền xác nhận hoàn tất; khách khác và Manager khác cơ sở không mở được file. Khách chủ yêu cầu vẫn xem được sau COMPLETED.

PASS kiểm tra dọn dữ liệu: `historical_data_unchanged=true`, `synthetic_fixture_cleanup_verified=true` lúc 10:49:24. Hash đối soát lấy trước lượt test hiện tại, bao gồm cả các kho thử HN-CG người dùng đã yêu cầu tạo; không dùng lại baseline cũ trước khi có các kho đó. Fixture của hai test đã được dọn khỏi database, không thay đổi dữ liệu người dùng hiện có. Audit identity sequence có thể tăng do thao tác tổng hợp rồi dọn, không reset sequence.

Bằng chứng cục bộ: `.tmp/customer-refund-live/test-summary.txt` và `data-verification.json`. Đây là kết quả API/transaction với PostgreSQL thật; không thay cho kiểm thử browser/JWT hoặc chứng từ ngân hàng thật.

Regression sau bổ sung test: `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` PASS 77 tests H2, 0 failures/errors, 29 mục live/migration/setup opt-in không bật; BUILD SUCCESS lúc 10:51:07 giờ Việt Nam. `node scripts/check-contract.mjs` và `git diff --check` PASS. Không sửa code nghiệp vụ hoặc frontend trong lượt kiểm thử này.
