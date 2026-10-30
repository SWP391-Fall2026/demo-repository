import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { routes } from "../router";
import { RoleGuard } from "../guards/RoleGuard";
import { useSession, sessionStore } from "../../features/identity/session";
import "./stitch-shell.css";
import { PublicHeader, PublicFooter } from "./PublicChrome";
import { InternalChrome } from "./InternalChrome";
import "./internal-chrome.css";

const labels = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên cơ sở",
  FMANAGER: "Quản lý cơ sở",
  OPS_MGR: "Vận hành toàn chuỗi",
  ADMIN: "Quản trị hệ thống",
};

const backOfficeMenus = {
  STAFF: [["/facility/tasks/my", "Hàng đợi công việc", "queue"], ["/facility/reservations/lookup", "Đơn đặt phòng", "assignment"], ["/facility/tasks/my?type=CHECKIN", "Check-in & bàn giao", "meeting_room"], ["/handover-reviews", "Yêu cầu bàn giao", "fact_check"], ["/facility/tasks/my?type=RETURN", "Trả kho & nghiệm thu", "assignment_returned"], ["/facility/units/status", "Trạng thái kho", "inventory_2"], ["/facility/incidents", "Sự cố vận hành", "report_problem"], ["/facility/refunds/evidence", "Thực hiện hoàn tiền", "payments"], ["/payments", "Lịch sử thanh toán", "receipt_long"]],
  FMANAGER: [["/facility/overview", "Tổng quan cơ sở", "dashboard"], ["/facility/units", "Quản lý khoang & mặt bằng", "grid_view"], ["/facility/storage-types", "Quản lý loại kho", "category"], ["/facility/contracts", "Hợp đồng & đơn thuê", "description"], ["/facility/tasks/assign", "Phân công nhân sự", "assignment_ind"], ["/facility/invoices", "Hóa đơn cơ sở", "receipt_long"], ["/handover-reviews", "Yêu cầu bàn giao", "fact_check"], ["/facility/reports", "Báo cáo cơ sở", "analytics"], ["/facility/refunds/confirm", "Duyệt hoàn tiền", "payments"]],
  OPS_MGR: [["/operations/overview", "Tổng quan chuỗi", "query_stats"], ["/operations/facilities", "Cơ sở & mạng lưới", "hub"], ["/operations/pricing", "Giá & phí", "sell"], ["/operations/policies", "Chính sách thuê", "policy"], ["/operations/reports", "Báo cáo kinh doanh", "bar_chart"], ["/operations/settlement", "Quyết toán vận hành", "account_balance_wallet"]],
  ADMIN: [["/admin/overview", "Tổng quan hệ thống", "admin_panel_settings"], ["/admin/users", "Người dùng & tài khoản", "manage_accounts"], ["/admin/roles", "Vai trò & quyền", "lock"], ["/admin/staff-assignments", "Gán cơ sở", "domain"], ["/admin/activity", "Audit & hoạt động", "history"]],
};

const customerLinks = [["/", "Trang chủ"], ["/storage", "Kho lưu trữ"], ["/reservations", "Đơn đặt của tôi"], ["/rentals", "Kho đang thuê"], ["/support", "Hỗ trợ"]];

function AppRoutes() {
  return <Routes>
    {routes.map((r) => <Route key={r.path} path={r.path} element={<RoleGuard roles={r.roles}>{r.element}</RoleGuard>} />)}
    <Route path="*" element={<section className="card empty"><h1>Không tìm thấy trang</h1><Link to="/">Về trang chủ</Link></section>} />
  </Routes>;
}

export function AppShell() {
  const session = useSession();
  const location = useLocation();
  const auth = ["/login", "/register", "/verify-otp", "/registration-success"].includes(location.pathname);
  if (auth) {
    return <Routes>{routes.filter((r) => !r.roles.length).map((r) => <Route key={r.path} path={r.path} element={r.element} />)}</Routes>;
  }
  if (location.pathname === "/") {
    return <div className="landing-app"><Routes><Route path="/" element={routes.find((route) => route.path === "/")?.element} /></Routes></div>;
  }

  const role = session?.user?.role || "PUBLIC";
  const menu = backOfficeMenus[role] || [];
  const backOffice = menu.length > 0;
  const heading = { STAFF: "FACILITY OPS", FMANAGER: "FACILITY MANAGER", OPS_MGR: "BUSINESS OPERATIONS", ADMIN: "SYSTEM ADMINISTRATION" }[role] || "STORAGE";
  const facility = session?.user?.facility || "Cổng vận hành";
  const accountName = session?.user?.name || session?.user?.username || "Khách hàng";

  if (backOffice) {
    return <InternalChrome session={session}><AppRoutes /></InternalChrome>;
  }

  return <div className={`app stitch-app stitch-${role.toLowerCase()} stitch-customer`}>
    <PublicHeader />
    <main className="main stitch-main stitch-customer-main public-app-main"><AppRoutes /></main>
    <PublicFooter />
  </div>;
}
