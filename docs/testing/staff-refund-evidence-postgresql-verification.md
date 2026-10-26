# Kiểm thử Staff tải bằng chứng và Facility Manager xem — PostgreSQL

Người dùng yêu cầu test lại đúng phần **Thực hiện hoàn tiền** sau phản hồi của khách. Target: Supabase staging `xnerbsgbwdpemvnatvuy`, PostgreSQL Session pooler đã dùng trước đó, schema public. Không migration/seed, không chuyển tiền thật.

## Tiêu chí và ca kiểm thử

Ca mới `staffUploadsOnlyForApprovedRequestAndManagerViewsAfterCustomerResponse` thực thi:

1. Staff lập yêu cầu hủy, Manager duyệt, khách gửi phản hồi; xác nhận customerRespondedAt đã lưu.
2. Dùng một RefundRequest PENDING tổng hợp riêng để kiểm thử guard: Staff upload vào yêu cầu chưa duyệt bị 409; hồ sơ vẫn PENDING và chưa có file.
3. Customer hoặc Manager thử upload bị 403; Staff khác cơ sở bị 403.
4. Staff đúng cơ sở upload vào yêu cầu APPROVED thành công; RefundTransaction gắn đúng refundRequestId/performedBy, yêu cầu chuyển EVIDENCE_SUBMITTED.
5. Staff thử tải file thay thế bị 409; Manager tải vẫn nhận đúng byte file ban đầu và application/pdf.
6. Manager khác cơ sở bị 404; Staff tự xác nhận hoàn tất bị 403.
7. Manager đúng cơ sở xem, xác nhận COMPLETED; vẫn tải đúng file sau khi hoàn tất. Yêu cầu PENDING dùng kiểm tra âm giữ nguyên trạng thái.

Chạy kèm hai ca luồng PDF/PNG đã có: `approvedRentRefundUsesExistingStaffEvidenceThenManagerConfirmation` và `customerViewsRefundImageFromOwnRequestAfterResponding`.

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HandoverReviewSupabaseTest#staffUploadsOnlyForApprovedRequestAndManagerViewsAfterCustomerResponse+approvedRentRefundUsesExistingStaffEvidenceThenManagerConfirmation+customerViewsRefundImageFromOwnRequestAfterResponding" "-Dhandover.supabase.enabled=true" "-Duser.timezone=UTC"
```

## Phạm vi bằng chứng

Controller, validation quyền/trạng thái, lưu file, JPA, transaction và các bảng nghiệp vụ dùng PostgreSQL thật. Request được gọi bằng MockMvc; principal dùng tài khoản synthetic với Spring Security Test, không phải đăng nhập JWT/browser live. Phần giao diện chỉ có upload cho Staff và Manager mở ảnh/PDF đã được kiểm riêng trong [báo cáo giao diện](refund-evidence-ui-verification.md); không suy ra test PostgreSQL chứng minh toàn bộ browser end-to-end.

Fixture riêng theo prefix đã ghi trước lần ghi đầu, tự cleanup sau từng ca; cuối lượt so hash 10 bảng nghiệp vụ trước/sau. Các file tổng hợp nằm trong target test, không phải chứng từ giao dịch thật. Không xử lý đơn/hoàn tiền người dùng hiện có hoặc bật scheduler trên database dùng chung.

## Kết quả thực tế

**PASS 3/3 tests, 0 failure, 0 error, 0 skipped**; BUILD SUCCESS lúc **10:56:53 ngày 26/10/2026 giờ Việt Nam**. Đã kiểm đúng đoạn sau phản hồi khách:

| Hành động | Kết quả PostgreSQL/API |
| --- | --- |
| Lưu phản hồi khách | 200; customerRespondedAt đã có |
| Staff tải bằng chứng vào yêu cầu chưa duyệt | 409, trạng thái PENDING không đổi, chưa có file |
| Customer/Manager tải bằng chứng thay Staff | 403 |
| Staff khác cơ sở tải bằng chứng | 403 |
| Staff đúng cơ sở tải vào APPROVED | 200; đúng refundRequestId/performedBy; chuyển EVIDENCE_SUBMITTED |
| Staff tải đè sau khi gửi | 409; Manager vẫn tải đúng file ban đầu |
| Manager đúng cơ sở xem bằng chứng | 200; đúng bytes, PDF/PNG và số tiền hồ sơ |
| Manager khác cơ sở xem file | 404 |
| Staff tự xác nhận hoàn tất | 403 |
| Manager xác nhận hoàn tất | 200; COMPLETED và file vẫn xem được |

PASS dọn fixture và đối soát hash 10 bảng nghiệp vụ lúc 10:56:53: `synthetic_fixture_cleanup_verified=true`, `historical_data_unchanged=true`. Không sửa/xóa hồ sơ khách thật. Audit identity sequence có thể tăng theo các event test đã ghi rồi dọn, không reset sequence.

Bằng chứng cục bộ: `.tmp/staff-refund-live/test-summary.txt`, `data-verification.json`. Code nghiệp vụ/frontend không thay đổi trong lượt này; chỉ thêm regression test âm/dương rõ hơn và báo cáo kết quả.

Regression cuối: `mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml verify "-Dspring.config.import="` PASS 78 tests H2, 0 failures/errors, 30 mục live/migration/setup opt-in không bật; BUILD SUCCESS lúc 10:58:36 giờ Việt Nam. Contract check PASS 92 operations/45 schemas/80 adapter calls; `git diff --check` PASS.
