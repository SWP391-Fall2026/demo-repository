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
        STAFF: [["/facility/tasks/my", "Dashboard / Hàng đợi"], ["/facility/reservations/lookup", "Đơn đặt phòng"], ["/facility/handovers", "Check-in & Bàn giao"], ["/facility/inspections", "Trả kho & Nghiệm thu"], ["/facility/refunds/evidence", "Thực hiện hoàn tiền"], ["/facility/incidents", "Yêu cầu hỗ trợ"], ["/facility/units/status", "Kho / Unit"]],
        FMANAGER: [["/facility/overview", "Tổng quan cơ sở"], ["/facility/units", "Quản lý kho"], ["/facility/reservations/assign", "Phân bổ kho"], ["/facility/tasks/assign", "Nhân viên"], ["/facility/contracts", "Hợp đồng"], ["/facility/return-inspection-reviews", "Khiếu nại nghiệm thu"], ["/facility/invoices", "Hóa đơn"], ["/facility/refunds/confirm", "Xác nhận hoàn tiền"], ["/facility/reports", "Báo cáo cơ sở"]],
        OPS_MGR: [["/operations/overview", "Tổng quan kinh doanh"], ["/operations/facilities", "Quản lý cơ sở"], ["/operations/pricing", "Giá & phí"], ["/operations/policies", "Chính sách thuê"], ["/operations/reports", "Báo cáo"]],
        ADMIN: [["/admin/overview", "Tổng quan"], ["/admin/users", "Người dùng"], ["/admin/roles", "Vai trò"], ["/admin/staff-assignments", "Gán cơ sở"], ["/admin/activity", "Audit & login"]],
    };
    const links = session ? roleMenu[session.user.role] || [] : [["/storage", "Tìm kho"]];
    const roleShells = {
        STAFF: {
            title: "CỔNG VẬN HÀNH CƠ SỞ",
            context: session?.user?.facility || session?.user?.facilityCode || "Cơ sở được phân công",
            footer: "Phân hệ Vận hành Cơ sở · Kho Gọn Storage",
        },
        FMANAGER: {
            title: "QUẢN LÝ CƠ SỞ",
            context: session?.user?.facility || session?.user?.facilityCode || "Phạm vi cơ sở",
            footer: "Phân hệ Quản lý Cơ sở · Kho Gọn Storage",
        },
        OPS_MGR: {
            title: "ĐIỀU HÀNH KINH DOANH",
            context: "Phạm vi toàn chuỗi",
            footer: "Phân hệ Điều hành Kinh doanh · Kho Gọn Storage",
        },
    };
    const internalRole = session?.user?.role;
    const roleShell = roleShells[internalRole];
    const pageRoutes = <Routes>
      {routes.map((r) => (<Route key={r.path} path={r.path} element={<RoleGuard roles={r.roles}>{r.element}</RoleGuard>}/>))}
      <Route path="*" element={<section className="card empty">
            <h1>Không tìm thấy trang</h1>
            <Link to="/">Về trang chủ</Link>
          </section>}/>
    </Routes>;
    if (roleShell) {
        return <div className={`app role-shell role-shell-${internalRole.toLowerCase()}`}>
          <header className="role-header">
            <Link className="brand" to={links[0]?.[0] || "/"}>
              <span className="brand-mark">S</span><span>KHO GỌN <b>STORAGE</b></span>
            </Link>
            <div className="role-header-context">
              <span>{roleShell.title}</span>
              <strong>{roleShell.context}</strong>
            </div>
            <div className="role-account">
              <span className="avatar">{session.user.name?.slice(0, 1)}</span>
              <span className="role-account-name"><strong>{session.user.name || session.user.username}</strong><small>{labels[internalRole]}</small></span>
              <button className="secondary" onClick={() => sessionStore.set(null)}>Đăng xuất</button>
            </div>
          </header>
          <div className="role-layout">
            <aside className="role-sidebar" aria-label="Điều hướng vai trò">
              <span className="role-sidebar-label">KHÔNG GIAN LÀM VIỆC</span>
              <nav>
                {links.map(([path, title]) => <NavLink key={path} to={path}>{title}</NavLink>)}
              </nav>
              <div className="role-sidebar-note">
                <strong>{roleShell.context}</strong>
                <small>{internalRole === "STAFF" ? "Vận hành tại cơ sở" : internalRole === "FMANAGER" ? "Quản trị hoạt động cơ sở" : "Phạm vi toàn chuỗi"}</small>
              </div>
            </aside>
            <main className="role-main">
              <div className="role-content">{pageRoutes}</div>
              <footer className="role-footer">{roleShell.footer} · Phiên làm việc an toàn</footer>
            </main>
          </div>
        </div>;
    }
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
        {pageRoutes}
      </main>
      <footer className="footer">
        STORAGE · Self-Storage Facility Rental & Management
      </footer>
    </div>);
}
