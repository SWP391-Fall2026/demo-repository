import { Link, useLocation } from "react-router-dom";
import { sessionStore } from "../../features/identity/session";
import logo from "../../assets/images/landing/brand-logo.png";
import "./internal-chrome.css";

const portals = {
  STAFF: {
    brand: "KHO GỌN", subtitle: "FACILITY OPS", category: "Nghiệp vụ cơ sở",
    title: "CỔNG VẬN HÀNH CƠ SỞ / FACILITY STAFF", role: "Nhân viên cơ sở (Facility Staff)",
    hotline: "Hỗ trợ nghiệp vụ cơ sở", extension: "1900 6868",
    links: [["/facility/tasks/my", "Dashboard / Hàng đợi", "queue"], ["/facility/reservations/lookup", "Đơn đặt phòng", "inventory_2"], ["/facility/tasks/my?type=CHECKIN", "Check-in & Bàn giao", "assignment_turned_in"], ["/facility/tasks/my?type=RETURN", "Trả kho & Nghiệm thu", "published_with_changes"], ["/facility/incidents", "Yêu cầu hỗ trợ", "support_agent"]],
    extra: [["/facility/units/status", "Trạng thái kho / Unit", "warehouse"], ["/facility/access-simulator", "Nhập mã PIN tại cửa kho", "dialpad"], ["/handover-reviews", "Yêu cầu bàn giao", "fact_check"], ["/facility/refunds/evidence", "Thực hiện hoàn tiền", "payments"], ["/payments", "Lịch sử thanh toán", "receipt_long"]],
  },
  FMANAGER: {
    brand: "KHO GỌN", subtitle: "Facility Admin", category: "Danh mục quản lý",
    title: "HỆ THỐNG QUẢN LÝ CƠ SỞ / FACILITY MANAGER", role: "Quản lý cơ sở (Facility Manager)",
    hotline: "Đường dây nóng quản lý", extension: "1900 6868 (Phím 8)",
    links: [["/facility/overview", "Tổng quan cơ sở", "analytics"], ["/facility/units", "Quản lý khoang & mặt bằng", "grid_view"], ["/facility/storage-types", "Quản lý loại kho", "inventory_2"], ["/facility/tasks/assign", "Phân công nhân viên", "badge"], ["/facility/overdue-cap", "Giá & chính sách cơ sở", "local_offer"], ["/facility/reports", "Báo cáo & Tổng quan hoạt động", "monitoring"]],
    extra: [["/facility/contracts", "Hợp đồng & Đơn thuê", "description"], ["/facility/invoices", "Hóa đơn cơ sở", "receipt_long"], ["/handover-reviews", "Yêu cầu bàn giao", "fact_check"], ["/facility/units/ready", "Duyệt kho sẵn sàng", "verified"], ["/facility/no-show", "Xử lý đơn không đến", "event_busy"], ["/facility/refunds/approve", "Duyệt hoàn tiền", "payments"], ["/facility/refunds/confirm", "Xác nhận hoàn tiền", "fact_check"]],
  },
  OPS_MGR: {
    brand: "ĐIỀU HÀNH KINH DOANH", subtitle: "Bộ phận chuyên trách", category: "Quy trình BOM (SCR-21 - SCR-24)",
    title: "CỔNG QUẢN TRỊ KINH DOANH & VẬN HÀNH CHUỖI (BOM PORTAL)", role: "Trưởng ban vận hành kinh doanh",
    hotline: "Hotline Điều Hành", extension: "1900 6868 (Phím 9)",
    links: [["/operations/overview", "Tổng quan kinh doanh", "query_stats"], ["/operations/facilities", "Quản lý cơ sở & mạng lưới", "apartment"], ["/operations/reports", "Báo cáo tổng hợp kinh doanh", "analytics"], ["/operations/settlement", "Quyết toán vận hành chuỗi", "account_balance_wallet"]],
    extra: [["/operations/pricing", "Quản lý giá & chính sách chuỗi", "sell"], ["/operations/policies", "Chính sách thuê", "policy"]],
  },
  ADMIN: {
    brand: "PHÂN HỆ QUẢN TRỊ HỆ THỐNG", subtitle: "", category: "",
    title: "HỆ THỐNG QUẢN TRỊ HỆ THỐNG (SYSTEM ADMINISTRATION PORTAL)", role: "Quản trị viên hệ thống",
    hotline: "Hỗ trợ quản trị hệ thống", extension: "1900 6868 (Phím 0)",
    links: [["/admin/overview", "Tổng quan hệ thống", "admin_panel_settings", "SCR-25"], ["/admin/users", "Quản trị người dùng & TK", "manage_accounts", "SCR-26"], ["/admin/roles", "Phân quyền & Vai trò", "verified_user", "SCR-27"], ["/admin/activity", "Nhật ký kiểm toán & Cấu hình", "history_edu", "SCR-28"]],
    extra: [["/admin/staff-assignments", "Gán cơ sở cho nhân viên", "domain"]],
  },
};

function Symbol({ children }) { return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>; }

export function InternalChrome({ session, children }) {
  const location = useLocation();
  const portal = portals[session.user.role];
  const facility = session.user.facility || session.user.facilityCode || "Cơ sở phụ trách";
  const globalScope = ["OPS_MGR", "ADMIN"].includes(session.user.role);
  const accountName = session.user.name || session.user.username;
  const active = path => {
    const [pathname, query] = path.split("?");
    if (!location.pathname.startsWith(pathname)) return false;
    if (query) return [...new URLSearchParams(query)].every(([key, value]) => new URLSearchParams(location.search).get(key) === value);
    return !(pathname === "/facility/tasks/my" && new URLSearchParams(location.search).has("type"));
  };
  const link = ([path, title, icon, code]) => <Link key={path} to={path} className={active(path) ? "active" : ""} aria-current={active(path) ? "page" : undefined}><Symbol>{icon}</Symbol><span>{title}</span>{code && <small>{code}</small>}</Link>;
  const extraActive = portal.extra.some(([path]) => active(path));

  return <div className={`app stitch-app stitch-${session.user.role.toLowerCase()} stitch-backoffice internal-chrome`}>
    <aside className="internal-sidebar">
      <Link className="internal-sidebar-brand" to="/">{session.user.role === "FMANAGER" && <img src={logo} alt=""/>}{["ADMIN", "OPS_MGR"].includes(session.user.role) && <i/>}<span><strong>{portal.brand}</strong>{portal.subtitle && <small>{portal.subtitle}</small>}</span></Link>
      {portal.category && <div className="internal-sidebar-category">{portal.category}</div>}
      <nav className="internal-sidebar-nav" aria-label="Điều hướng hệ thống">{portal.links.map(link)}<details className="internal-extra-nav" key={location.pathname + location.search} open={extraActive || undefined}><summary>Nghiệp vụ bổ sung<Symbol>expand_more</Symbol></summary>{portal.extra.map(link)}</details></nav>
      <div className="internal-sidebar-help"><span><Symbol>{session.user.role === "STAFF" ? "schedule" : "headset_mic"}</Symbol>{portal.hotline}</span><a href="tel:19006868">{portal.extension}</a><p>{globalScope ? "Hỗ trợ vận hành toàn hệ thống" : facility}</p></div>
    </aside>
    <div className="internal-workspace">
      <header className="internal-topbar"><div className="internal-topbar-brand">{session.user.role === "OPS_MGR" ? <span className="internal-warehouse"><Symbol>warehouse</Symbol></span> : <img src={logo} alt=""/>}<div><strong>KHO GỌN STORAGE</strong><small>{portal.title}</small></div><span className="internal-scope"><Symbol>{globalScope ? "public" : "store"}</Symbol>{globalScope ? session.user.role === "ADMIN" ? "Toàn hệ thống FMS Central" : "Tổng Công Ty / Head Office" : facility}</span></div><div className="internal-topbar-account"><a className="internal-hotline" href="tel:19006868"><Symbol>headset_mic</Symbol><span>Hotline nội bộ: 1900 6868</span></a><span className="internal-account-name"><strong>{accountName}</strong><small>{portal.role}</small></span><span className="internal-avatar"><Symbol>person</Symbol></span><button className="internal-logout" type="button" onClick={() => sessionStore.set(null)} aria-label="Đăng xuất"><Symbol>logout</Symbol><span>Đăng xuất</span></button></div></header>
      <main className="main stitch-main internal-main">{children}</main>
      <footer className="internal-footer"><span>KHO GỌN STORAGE · {portal.role}</span><span>{globalScope ? "Phạm vi toàn hệ thống" : facility}</span></footer>
    </div>
  </div>;
}
