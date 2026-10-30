import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { routes } from "../router";
import { RoleGuard } from "../guards/RoleGuard";
import { useSession, sessionStore } from "../../features/identity/session";
export function AppShell() {
    const session = useSession(), location = useLocation();
    const auth = ["/login", "/register", "/verify-otp"].includes(location.pathname);
    const labels = {
        CUSTOMER: "Khách hàng",
        STAFF: "Nhân viên cơ sở",
        FMANAGER: "Quản lý cơ sở",
        OPS_MGR: "Vận hành toàn chuỗi",
        ADMIN: "Quản trị hệ thống",
    };
    if (auth)
        return (<Routes>
        {routes
                .filter((r) => !r.roles.length)
                .map((r) => (<Route key={r.path} path={r.path} element={r.element}/>))}
      </Routes>);
    const roleMenu = {
        CUSTOMER: [["/storage", "Tìm kho & bảng giá"], ["/reservations/new", "Đặt giữ chỗ"], ["/invoices/all/pay", "Thanh toán cọc/phí"], ["/reservations/all/appointment", "Thẻ hẹn"], ["/reservations/all/pass", "Thẻ Check-in & bàn giao"], ["/rentals", "Kho đang thuê"], ["/handover-reviews", "Yêu cầu bàn giao"], ["/refunds", "Hoàn tiền của tôi"], ["/support", "Hỗ trợ"]],
        STAFF: [["/facility/tasks/my", "Công việc"], ["/facility/reservations/lookup", "Tra cứu đơn"], ["/facility/handovers/all", "Bàn giao"], ["/handover-reviews", "Yêu cầu bàn giao"], ["/facility/units/status", "Trạng thái kho"], ["/facility/incidents", "Sự cố"], ["/facility/refunds/evidence", "Thực hiện hoàn tiền"], ["/payments", "Lịch sử thanh toán"]],
        FMANAGER: [["/facility/overview", "Tổng quan cơ sở"], ["/facility/tasks/assign", "Phân công task"], ["/facility/units", "Quản lý kho"], ["/facility/invoices", "Hóa đơn"], ["/facility/contracts", "Hợp đồng"], ["/handover-reviews", "Yêu cầu bàn giao"], ["/facility/reports", "Báo cáo"], ["/facility/refunds/confirm", "Xác nhận hoàn tiền"]],
        OPS_MGR: [["/operations/overview", "Tổng quan chuỗi"], ["/operations/facilities", "Cơ sở"], ["/operations/pricing", "Giá & phí"], ["/operations/policies", "Chính sách"], ["/operations/reports", "Báo cáo"]],
        ADMIN: [["/admin/overview", "Tổng quan"], ["/admin/users", "Người dùng"], ["/admin/roles", "Vai trò"], ["/admin/staff-assignments", "Gán cơ sở"], ["/admin/activity", "Audit & login"]],
    };
    const links = session ? roleMenu[session.user.role] || [] : [["/storage", "Tìm kho"]];
    return (<div className="app">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">S</span><span>SelfStorage <b>PRO</b></span>
        </Link>
        <nav className="app-navbar">
          <div className="nav-links">{links.map(([path, title]) => <NavLink key={path} to={path}>{title}</NavLink>)}</div>
          {session ? (<div className="nav-account">
              <span className="role-label">{labels[session.user.role]}</span>
              <span className="avatar">{session.user.name?.slice(0, 1)}</span>
              <span>{session.user.name}</span>
              <button className="secondary" onClick={() => sessionStore.set(null)}>
                Đăng xuất
              </button>
            </div>) : (<div className="nav-account">
              <Link to="/login">Đăng nhập</Link>
              <Link className="button" to="/register">
                Đăng ký
              </Link>
            </div>)}
        </nav>
      </header>
      <main className="main">
        <Routes>
          {routes.map((r) => (<Route key={r.path} path={r.path} element={<RoleGuard roles={r.roles}>{r.element}</RoleGuard>}/>))}
          <Route path="*" element={<section className="card empty">
                <h1>Không tìm thấy trang</h1>
                <Link to="/">Về trang chủ</Link>
              </section>}/>
        </Routes>
      </main>
      <footer className="footer">
        STORAGE · Self-Storage Facility Rental & Management
      </footer>
    </div>);
}
