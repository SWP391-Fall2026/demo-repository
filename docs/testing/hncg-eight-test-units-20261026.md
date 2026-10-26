# Thêm 8 kho HN-CG cho kiểm thử PostgreSQL

Theo yêu cầu người dùng, đã INSERT và COMMIT 8 Unit trên Supabase staging project `xnerbsgbwdpemvnatvuy`, database PostgreSQL đang sử dụng, lúc 09:28:48 ngày 26/10/2026 giờ Việt Nam. Không tạo schema/migration mới.

| Mã kho | Loại | Diện tích | Giá/tháng |
| --- | --- | --- | --- |
| HN-CG-TEST-20261026-01 đến 03 | S | 3 m² | 800.000 VND |
| HN-CG-TEST-20261026-04 đến 06 | M | 5 m² | 1.450.000 VND |
| HN-CG-TEST-20261026-07 đến 08 | L | 10 m² | 2.800.000 VND |

VERIFIED: cơ sở HN-CG ACTIVE; toàn bộ 8 dòng mới có status available, floor 0, không PIN, tenant hoặc held_by_reservation_id. Diện tích dựa trên mẫu kho sẵn có; giá được giới hạn theo price/min/max trong business_policies, dùng fallback giống PolicyService khi thiếu giá min/max. Không dùng giá demo 900.000/1.800.000 ngoài giới hạn hiện tại.

Số kho HN-CG tăng từ 20 lên 28. Hash của các Unit cũ và 9 bảng nghiệp vụ liên quan không đổi. Không sửa dữ liệu đơn/hợp đồng/thanh toán hoặc kho cũ. Đọc kiểm sau commit xác nhận đủ 8 dòng.

PASS lệnh opt-in (1/1):

```powershell
mvn -o -B "-Dmaven.repo.local=C:\Users\phuct\.m2\repository" -f backend/pom.xml test "-Dtest=HnCgTestUnitsSetupTest" "-Dhncg.units.mode=create" "-Duser.timezone=UTC"
```

Đã kiểm tra HTTP GET `/api/facilities/units?facilityCode=HN-CG`: success=true, có kho mới trong kết quả. Danh mục có thể trả ít hơn 8 kho mới vì đã trừ chỗ đang được giữ theo cơ sở/loại kho; điều đó không có nghĩa INSERT thiếu. Snapshot ngay sau tạo: 7 mã mới hiển thị, tổng danh mục HN-CG 11 kho.

Các kho này được giữ lại để người dùng chạy trực tiếp; không auto-cleanup. Helper mặc định không chạy trong kiểm thử thường và không ghi đè khi mã đã tồn tại. Bằng chứng chi tiết cục bộ: `.tmp/hncg-test-units/create.json`. Không lưu credential hoặc tạo PIN mặc định. Không cần build lại/restart để API đọc các dòng mới; dùng Làm mới ở danh mục.
