import { lazy } from "react";

const AuthPage = lazy(() => import("../features/identity/pages/AuthPage"));
const LandingPage = lazy(() => import("../features/facility/pages/LandingPage"));
const CatalogPage = lazy(() => import("../features/facility/pages/CatalogPage"));
const CreateReservationPage = lazy(() => import("../features/reservation/pages/CreateReservationPage"));
const InvoicePaymentPage = lazy(() => import("../features/billing/pages/InvoicePaymentPage"));
const FacilityInvoiceStatusPage = lazy(() => import("../features/billing/pages/FacilityInvoiceStatusPage"));
const PaymentResultPage = lazy(() => import("../features/billing/pages/PaymentResultPage"));
const PaymentHistoryPage = lazy(() => import("../features/billing/pages/PaymentHistoryPage"));
const CheckinPassPage = lazy(() => import("../features/reservation/pages/CheckinPassPage"));
const ReservationAppointmentPage = lazy(() => import("../features/reservation/pages/ReservationAppointmentPage"));
const ContractOfferPage = lazy(() => import("../features/reservation/pages/ContractOfferPage"));
const MyRentalsPage = lazy(() => import("../features/rental/pages/MyRentalsPage"));
const RentalContractDetailPage = lazy(() => import("../features/rental/pages/RentalContractDetailPage"));
const CustomerSupportPage = lazy(() => import("../features/support/pages/CustomerSupportPage"));
const StaffTaskBoardPage = lazy(() => import("../features/workforce/pages/StaffTaskBoardPage"));
const ReservationLookupPage = lazy(() => import("../features/reservation/pages/ReservationLookupPage"));
const HandoverPage = lazy(() => import("../features/rental/pages/HandoverPage"));
const HandoverReviewPage = lazy(() => import("../features/rental/pages/HandoverReviewPage"));
const UnitStatusPage = lazy(() => import("../features/facility/pages/UnitStatusPage"));
const ReturnInspectionPage = lazy(() => import("../features/rental/pages/ReturnInspectionPage"));
const ReturnInspectionReviewPage = lazy(() => import("../features/rental/pages/ReturnInspectionReviewPage"));
const IncidentDeskPage = lazy(() => import("../features/support/pages/IncidentDeskPage"));
const AccessSimulatorPage = lazy(() => import("../features/rental/pages/AccessSimulatorPage"));
const FacilityDashboardPage = lazy(() => import("../features/reporting/pages/FacilityDashboardPage"));
const ManageUnitsPage = lazy(() => import("../features/facility/pages/ManageUnitsPage"));
const AssignUnitPage = lazy(() => import("../features/reservation/pages/AssignUnitPage"));
const StaffAssignmentPage = lazy(() => import("../features/workforce/pages/StaffAssignmentPage"));
const FacilityContractsPage = lazy(() => import("../features/rental/pages/FacilityContractsPage"));
const FacilityReportPage = lazy(() => import("../features/reporting/pages/FacilityReportPage"));
const ChainDashboardPage = lazy(() => import("../features/reporting/pages/ChainDashboardPage"));
const ManageFacilitiesPage = lazy(() => import("../features/facility/pages/ManageFacilitiesPage"));
const PricingPolicyPage = lazy(() => import("../features/policy/pages/PricingPolicyPage"));
const ChainReportPage = lazy(() => import("../features/reporting/pages/ChainReportPage"));
const RentalPolicyPage = lazy(() => import("../features/policy/pages/RentalPolicyPage"));
const SystemDashboardPage = lazy(() => import("../features/reporting/pages/SystemDashboardPage"));
const UserManagementPage = lazy(() => import("../features/identity/pages/UserManagementPage"));
const RoleCatalogPage = lazy(() => import("../features/identity/pages/RoleCatalogPage"));
const StaffFacilityAssignmentPage = lazy(() => import("../features/identity/pages/StaffFacilityAssignmentPage"));
const AuditAndLoginHistoryPage = lazy(() => import("../features/audit/pages/AuditAndLoginHistoryPage"));
const ReturnRequestPage = lazy(() => import("../features/rental/pages/ReturnRequestPage"));
const RenewalQuotePage = lazy(() => import("../features/rental/pages/RenewalQuotePage"));
const CustomerRefundRequestsPage = lazy(() => import("../features/billing/pages/CustomerRefundRequestsPage"));
const RefundApprovalPage = lazy(() => import("../features/billing/pages/RefundApprovalPage"));
const RefundExecutionPage = lazy(() => import("../features/billing/pages/RefundExecutionPage"));
const RefundConfirmationPage = lazy(() => import("../features/billing/pages/RefundConfirmationPage"));
const UnitReadinessApprovalPage = lazy(() => import("../features/facility/pages/UnitReadinessApprovalPage"));
const NoShowReviewPage = lazy(() => import("../features/reservation/pages/NoShowReviewPage"));
const FacilityOverdueCapPage = lazy(() => import("../features/policy/pages/FacilityOverdueCapPage"));
const FacilityAccessLogsPage = lazy(() => import("../features/facility/pages/FacilityAccessLogsPage"));
export const routes = [
    {
        path: "/handover-reviews",
        title: "Yêu cầu bàn giao",
        roles: ["CUSTOMER", "STAFF", "FMANAGER"],
        element: <HandoverReviewPage />,
    },
    {
        path: "/payments",
        title: "Lịch sử thanh toán",
        roles: ["CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR"],
        element: <PaymentHistoryPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/login",
        title: "Xác thực",
        roles: [],
        element: <AuthPage />,
        legacy: "SCR-AUTH",
    },
    {
        path: "/",
        title: "Trang chủ",
        roles: [],
        element: <LandingPage />,
        legacy: "SCR-C00",
    },
    {
        path: "/storage",
        title: "Catalog",
        roles: [],
        element: <CatalogPage />,
        legacy: "SCR-C01",
    },
    {
        path: "/reservations/new",
        title: "Đặt chỗ",
        roles: ["CUSTOMER"],
        element: <CreateReservationPage />,
        legacy: "SCR-C02",
    },
    {
        path: "/invoices/:invoiceId/pay",
        title: "Thanh toán",
        roles: ["CUSTOMER"],
        element: <InvoicePaymentPage />,
        legacy: "SCR-C03",
    },
    {
        path: "/payment/result",
        title: "Kết quả thanh toán",
        roles: ["CUSTOMER"],
        element: <PaymentResultPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/reservations/:reservationId/contract-offer",
        title: "Xác nhận hợp đồng",
        roles: ["CUSTOMER"],
        element: <ContractOfferPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/reservations/:reservationId/appointment",
        title: "Thẻ hẹn",
        roles: ["CUSTOMER"],
        element: <ReservationAppointmentPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/reservations/:reservationId/pass",
        title: "Thẻ hẹn",
        roles: ["CUSTOMER"],
        element: <CheckinPassPage />,
        legacy: "SCR-C04",
    },
    {
        path: "/rentals",
        title: "Kho đang thuê",
        roles: ["CUSTOMER"],
        element: <MyRentalsPage />,
        legacy: "SCR-C05",
    },
    {
        path: "/rentals/:contractId",
        title: "Chi tiết hợp đồng",
        roles: ["CUSTOMER"],
        element: <RentalContractDetailPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/support",
        title: "Hỗ trợ",
        roles: ["CUSTOMER"],
        element: <CustomerSupportPage />,
        legacy: "SCR-C06",
    },
    {
        path: "/facility/tasks/my",
        title: "Công việc",
        roles: ["STAFF"],
        element: <StaffTaskBoardPage />,
        legacy: "SCR-S01",
    },
    {
        path: "/facility/reservations/lookup",
        title: "Tra cứu đơn",
        roles: ["STAFF"],
        element: <ReservationLookupPage />,
        legacy: "SCR-S02",
    },
    {
        path: "/facility/handovers",
        title: "Check-in & Bàn giao",
        roles: ["STAFF"],
        element: <HandoverPage />,
    },
    {
        path: "/facility/handovers/:reservationId",
        title: "Bàn giao",
        roles: ["STAFF"],
        element: <HandoverPage />,
        legacy: "SCR-S03",
    },
    {
        path: "/facility/units/status",
        title: "Trạng thái kho",
        roles: ["STAFF"],
        element: <UnitStatusPage />,
        legacy: "SCR-S04",
    },
    {
        path: "/facility/inspections",
        title: "Yêu cầu trả kho",
        roles: ["STAFF", "FMANAGER"],
        element: <ReturnInspectionPage />,
    },
    {
        path: "/facility/inspections/:contractId",
        title: "Nghiệm thu",
        roles: ["STAFF", "FMANAGER"],
        element: <ReturnInspectionPage />,
        legacy: "SCR-S05",
    },
    {
        path: "/facility/return-inspection-reviews",
        title: "Khiếu nại nghiệm thu",
        roles: ["FMANAGER"],
        element: <ReturnInspectionReviewPage />,
    },
    {
        path: "/facility/incidents",
        title: "Sự cố",
        roles: ["STAFF", "FMANAGER"],
        element: <IncidentDeskPage />,
        legacy: "SCR-S06",
    },
    {
        path: "/facility/access-simulator",
        title: "PIN mô phỏng",
        roles: ["STAFF"],
        element: <AccessSimulatorPage />,
        legacy: "SCR-S07",
    },
    {
        path: "/facility/access-logs",
        title: "Lịch sử ra vào cơ sở",
        roles: ["STAFF", "FMANAGER", "OPS_MGR", "ADMIN"],
        element: <FacilityAccessLogsPage />,
    },
    {
        path: "/facility/overview",
        title: "Tổng quan cơ sở",
        roles: ["FMANAGER"],
        element: <FacilityDashboardPage />,
        legacy: "SCR-M01",
    },
    {
        path: "/facility/invoices",
        title: "Trạng thái hóa đơn",
        roles: ["FMANAGER"],
        element: <FacilityInvoiceStatusPage />,
        legacy: "SCR-M06",
    },
    {
        path: "/facility/units",
        title: "Quản lý Unit",
        roles: ["FMANAGER"],
        element: <ManageUnitsPage />,
        legacy: "SCR-M02",
    },
    {
        path: "/facility/reservations/assign",
        title: "Gán phòng",
        roles: ["FMANAGER"],
        element: <AssignUnitPage />,
        legacy: "SCR-M03",
    },
    {
        path: "/facility/tasks/assign",
        title: "Phân công",
        roles: ["FMANAGER"],
        element: <StaffAssignmentPage />,
        legacy: "SCR-M04",
    },
    {
        path: "/facility/contracts",
        title: "Hợp đồng cơ sở",
        roles: ["FMANAGER", "STAFF"],
        element: <FacilityContractsPage />,
        legacy: "SCR-M05",
    },
    {
        path: "/facility/reports",
        title: "Báo cáo cơ sở",
        roles: ["FMANAGER"],
        element: <FacilityReportPage />,
        legacy: "SCR-M06",
    },
    {
        path: "/operations/overview",
        title: "Tổng quan chuỗi",
        roles: ["OPS_MGR"],
        element: <ChainDashboardPage />,
        legacy: "SCR-O01",
    },
    {
        path: "/operations/facilities",
        title: "Chi nhánh",
        roles: ["OPS_MGR"],
        element: <ManageFacilitiesPage />,
        legacy: "SCR-O02",
    },
    {
        path: "/operations/pricing",
        title: "Giá và phí",
        roles: ["OPS_MGR"],
        element: <PricingPolicyPage />,
        legacy: "SCR-O03",
    },
    {
        path: "/operations/reports",
        title: "Báo cáo chuỗi",
        roles: ["OPS_MGR"],
        element: <ChainReportPage />,
        legacy: "SCR-O04",
    },
    {
        path: "/operations/policies",
        title: "Chính sách thuê",
        roles: ["OPS_MGR"],
        element: <RentalPolicyPage />,
        legacy: "SCR-O05",
    },
    {
        path: "/admin/overview",
        title: "Tổng quan quản trị",
        roles: ["ADMIN"],
        element: <SystemDashboardPage />,
        legacy: "SCR-A01",
    },
    {
        path: "/admin/users",
        title: "Người dùng",
        roles: ["ADMIN"],
        element: <UserManagementPage />,
        legacy: "SCR-A02",
    },
    {
        path: "/admin/roles",
        title: "Vai trò",
        roles: ["ADMIN"],
        element: <RoleCatalogPage />,
        legacy: "SCR-A03",
    },
    {
        path: "/admin/staff-assignments",
        title: "Gán cơ sở",
        roles: ["ADMIN"],
        element: <StaffFacilityAssignmentPage />,
        legacy: "SCR-A04",
    },
    {
        path: "/admin/activity",
        title: "Audit và login",
        roles: ["ADMIN"],
        element: <AuditAndLoginHistoryPage />,
        legacy: "SCR-A05",
    },
    {
        path: "/register",
        title: "Đăng ký",
        roles: [],
        element: <AuthPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/verify-otp",
        title: "Xác minh",
        roles: [],
        element: <AuthPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/rentals/return",
        title: "Yêu cầu trả kho",
        roles: ["CUSTOMER"],
        element: <ReturnRequestPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/rentals/renew",
        title: "Báo giá gia hạn",
        roles: ["CUSTOMER"],
        element: <RenewalQuotePage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/refunds",
        title: "Yêu cầu hoàn tiền",
        roles: ["CUSTOMER"],
        element: <CustomerRefundRequestsPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/refunds/approve",
        title: "Duyệt hoàn tiền",
        roles: ["FMANAGER"],
        element: <RefundApprovalPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/refunds/evidence",
        title: "Bằng chứng hoàn tiền",
        roles: ["STAFF"],
        element: <RefundExecutionPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/refunds/confirm",
        title: "Xác nhận hoàn tiền",
        roles: ["FMANAGER"],
        element: <RefundConfirmationPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/units/ready",
        title: "Duyệt kho sẵn sàng",
        roles: ["FMANAGER"],
        element: <UnitReadinessApprovalPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/no-show",
        title: "Xử lý NO_SHOW",
        roles: ["STAFF", "FMANAGER"],
        element: <NoShowReviewPage />,
        legacy: "CONFIRMED",
    },
    {
        path: "/facility/overdue-cap",
        title: "Trần phí quá hạn",
        roles: ["FMANAGER"],
        element: <FacilityOverdueCapPage />,
        legacy: "CONFIRMED",
    },
];
