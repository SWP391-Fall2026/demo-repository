import AuthPage from "../features/identity/pages/AuthPage";
import LandingPage from "../features/facility/pages/LandingPage";
import CatalogPage from "../features/facility/pages/CatalogPage";
import CreateReservationPage from "../features/reservation/pages/CreateReservationPage";
import InvoicePaymentPage from "../features/billing/pages/InvoicePaymentPage";
import FacilityInvoiceStatusPage from "../features/billing/pages/FacilityInvoiceStatusPage";
import PaymentResultPage from "../features/billing/pages/PaymentResultPage";
import PaymentHistoryPage from "../features/billing/pages/PaymentHistoryPage";
import CheckinPassPage from "../features/reservation/pages/CheckinPassPage";
import ReservationAppointmentPage from "../features/reservation/pages/ReservationAppointmentPage";
import ContractOfferPage from "../features/reservation/pages/ContractOfferPage";
import MyRentalsPage from "../features/rental/pages/MyRentalsPage";
import RentalContractDetailPage from "../features/rental/pages/RentalContractDetailPage";
import CustomerSupportPage from "../features/support/pages/CustomerSupportPage";
import StaffTaskBoardPage from "../features/workforce/pages/StaffTaskBoardPage";
import ReservationLookupPage from "../features/reservation/pages/ReservationLookupPage";
import HandoverPage from "../features/rental/pages/HandoverPage";
import HandoverReviewPage from "../features/rental/pages/HandoverReviewPage";
import UnitStatusPage from "../features/facility/pages/UnitStatusPage";
import ReturnInspectionPage from "../features/rental/pages/ReturnInspectionPage";
import IncidentDeskPage from "../features/support/pages/IncidentDeskPage";
import AccessSimulatorPage from "../features/rental/pages/AccessSimulatorPage";
import FacilityDashboardPage from "../features/reporting/pages/FacilityDashboardPage";
import ManageUnitsPage from "../features/facility/pages/ManageUnitsPage";
import AssignUnitPage from "../features/reservation/pages/AssignUnitPage";
import StaffAssignmentPage from "../features/workforce/pages/StaffAssignmentPage";
import FacilityContractsPage from "../features/rental/pages/FacilityContractsPage";
import FacilityReportPage from "../features/reporting/pages/FacilityReportPage";
import ChainDashboardPage from "../features/reporting/pages/ChainDashboardPage";
import ManageFacilitiesPage from "../features/facility/pages/ManageFacilitiesPage";
import PricingPolicyPage from "../features/policy/pages/PricingPolicyPage";
import ChainReportPage from "../features/reporting/pages/ChainReportPage";
import RentalPolicyPage from "../features/policy/pages/RentalPolicyPage";
import SystemDashboardPage from "../features/reporting/pages/SystemDashboardPage";
import UserManagementPage from "../features/identity/pages/UserManagementPage";
import RoleCatalogPage from "../features/identity/pages/RoleCatalogPage";
import StaffFacilityAssignmentPage from "../features/identity/pages/StaffFacilityAssignmentPage";
import AuditAndLoginHistoryPage from "../features/audit/pages/AuditAndLoginHistoryPage";
import ReturnRequestPage from "../features/rental/pages/ReturnRequestPage";
import RenewalQuotePage from "../features/rental/pages/RenewalQuotePage";
import CustomerRefundRequestsPage from "../features/billing/pages/CustomerRefundRequestsPage";
import RefundApprovalPage from "../features/billing/pages/RefundApprovalPage";
import RefundExecutionPage from "../features/billing/pages/RefundExecutionPage";
import RefundConfirmationPage from "../features/billing/pages/RefundConfirmationPage";
import UnitReadinessApprovalPage from "../features/facility/pages/UnitReadinessApprovalPage";
import NoShowReviewPage from "../features/reservation/pages/NoShowReviewPage";
import FacilityOverdueCapPage from "../features/policy/pages/FacilityOverdueCapPage";
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
        path: "/facility/inspections/:contractId",
        title: "Nghiệm thu",
        roles: ["STAFF"],
        element: <ReturnInspectionPage />,
        legacy: "SCR-S05",
    },
    {
        path: "/facility/incidents",
        title: "Sự cố",
        roles: ["STAFF"],
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
        roles: ["FMANAGER"],
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
