# Ánh xạ giao diện hiện tại sang React

31 panel của HTML hiện tại được ánh xạ đầy đủ. Đây là route frontend dự kiến; không phải đổi URL API hay khẳng định tương ứng 1–1 với 28 mã màn hình SRS.

| ID hiện tại | SRS tham chiếu | Vai trò | Chức năng | Route frontend dự kiến | React page |
| --- | --- | --- | --- | --- | --- |
| SCR-AUTH | SCR-02 | GUEST | Xác thực | /login; /register; /verify-otp | frontend/src/features/identity/pages/AuthPage.tsx |
| SCR-C00 | SCR-01 | PUBLIC | Trang chủ | / | frontend/src/features/facility/pages/LandingPage.tsx |
| SCR-C01 | SCR-03 | PUBLIC | Catalog | /storage | frontend/src/features/facility/pages/CatalogPage.tsx |
| SCR-C02 | SCR-04 | CUSTOMER | Đặt chỗ | /reservations/new | frontend/src/features/reservation/pages/CreateReservationPage.tsx |
| SCR-C03 | SCR-05 | CUSTOMER | Thanh toán | /invoices/:invoiceId/pay | frontend/src/features/billing/pages/InvoicePaymentPage.tsx |
| SCR-C04 | SCR-06 | CUSTOMER | Thẻ hẹn | /reservations/:reservationId/pass | frontend/src/features/reservation/pages/CheckinPassPage.tsx |
| SCR-C05 | SCR-07 | CUSTOMER | Kho đang thuê | /rentals | frontend/src/features/rental/pages/MyRentalsPage.tsx |
| SCR-C06 | SCR-09 | CUSTOMER | Hỗ trợ | /support | frontend/src/features/support/pages/CustomerSupportPage.tsx |
| SCR-S01 | SCR-10 | STAFF | Công việc | /facility/tasks/my | frontend/src/features/workforce/pages/StaffTaskBoardPage.tsx |
| SCR-S02 | SCR-11 | STAFF | Tra cứu đơn | /facility/reservations/lookup | frontend/src/features/reservation/pages/ReservationLookupPage.tsx |
| SCR-S03 | SCR-12 | STAFF | Bàn giao | /facility/handovers/:reservationId | frontend/src/features/rental/pages/HandoverPage.tsx |
| SCR-S04 | SCR-16 | STAFF | Trạng thái kho | /facility/units/status | frontend/src/features/facility/pages/UnitStatusPage.tsx |
| SCR-S05 | SCR-13 | STAFF | Nghiệm thu | /facility/inspections/:contractId | frontend/src/features/rental/pages/ReturnInspectionPage.tsx |
| SCR-S06 | SCR-14 | STAFF | Sự cố | /facility/incidents | frontend/src/features/support/pages/IncidentDeskPage.tsx |
| SCR-S07 | Mở rộng PIN mô phỏng | STAFF | PIN mô phỏng | /facility/access-simulator | frontend/src/features/rental/pages/AccessSimulatorPage.tsx |
| SCR-M01 | SCR-15 | FMANAGER | Tổng quan cơ sở | /facility/overview | frontend/src/features/reporting/pages/FacilityDashboardPage.tsx |
| SCR-M02 | SCR-16 | FMANAGER | Quản lý Unit | /facility/units | frontend/src/features/facility/pages/ManageUnitsPage.tsx |
| SCR-M03 | SCR-17 | FMANAGER | Gán phòng | /facility/reservations/assign | frontend/src/features/reservation/pages/AssignUnitPage.tsx |
| SCR-M04 | SCR-18 | FMANAGER | Phân công | /facility/tasks/assign | frontend/src/features/workforce/pages/StaffAssignmentPage.tsx |
| SCR-M05 | SCR-19 | FMANAGER | Hợp đồng cơ sở | /facility/contracts | frontend/src/features/rental/pages/FacilityContractsPage.tsx |
| SCR-M06 | SCR-20 | FMANAGER | Báo cáo cơ sở | /facility/reports | frontend/src/features/reporting/pages/FacilityReportPage.tsx |
| SCR-O01 | SCR-21 | OPS_MGR | Tổng quan chuỗi | /operations/overview | frontend/src/features/reporting/pages/ChainDashboardPage.tsx |
| SCR-O02 | SCR-22 | OPS_MGR | Chi nhánh | /operations/facilities | frontend/src/features/facility/pages/ManageFacilitiesPage.tsx |
| SCR-O03 | SCR-23 | OPS_MGR | Giá và phí | /operations/pricing | frontend/src/features/policy/pages/PricingPolicyPage.tsx |
| SCR-O04 | SCR-24 | OPS_MGR | Báo cáo chuỗi | /operations/reports | frontend/src/features/reporting/pages/ChainReportPage.tsx |
| SCR-O05 | SCR-23 | OPS_MGR | Chính sách thuê | /operations/policies | frontend/src/features/policy/pages/RentalPolicyPage.tsx |
| SCR-A01 | Dashboard bổ sung | ADMIN | Tổng quan quản trị | /admin/overview | frontend/src/features/reporting/pages/SystemDashboardPage.tsx |
| SCR-A02 | SCR-25 | ADMIN | Người dùng | /admin/users | frontend/src/features/identity/pages/UserManagementPage.tsx |
| SCR-A03 | SCR-25 | ADMIN | Vai trò | /admin/roles | frontend/src/features/identity/pages/RoleCatalogPage.tsx |
| SCR-A04 | SCR-26 | ADMIN | Gán cơ sở | /admin/staff-assignments | frontend/src/features/identity/pages/StaffFacilityAssignmentPage.tsx |
| SCR-A05 | SCR-27 + SCR-28 | ADMIN | Audit và login | /admin/activity | frontend/src/features/audit/pages/AuditAndLoginHistoryPage.tsx |

## Trang cần bổ sung theo quyết định mới

- NO_SHOW: cảnh báo, khách đã đến, gia hạn chờ và lịch được Manager duyệt.
- Customer gửi/hủy yêu cầu hoàn tiền; Staff tạo thay có căn cứ, thực hiện và tải bằng chứng.
- Manager duyệt/từ chối hoàn và xác nhận kết quả; hai thao tác cần tách người thực hiện.
- Staff báo vệ sinh hoàn tất; Manager duyệt Unit sẵn sàng.
- Gia hạn phải cho khách xác nhận giá mới; Manager cấu hình trần phí trễ.
- SCR-08 cần trang ReturnRequestPage riêng; hiện thao tác trả nằm trong panel kho đang thuê. Sau khi bổ sung trang này, bảng đối chiếu bao phủ đủ 28 mã SRS.
- SCR-S04 của Staff không có quyền chuyển Unit sang AVAILABLE trực tiếp; Staff ghi nhận vệ sinh và yêu cầu Manager duyệt. Đây là khác biệt cần sửa so với prototype.

Các trang mới là phần cần triển khai, chưa được tính là tính năng có sẵn.
