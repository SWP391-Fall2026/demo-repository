import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { routes } from "../router";
import { RoleGuard } from "../guards/RoleGuard";
import { useSession, sessionStore } from "../../features/identity/session";
export function AppShell() {
  const session = useSession(),
    location = useLocation();
  const auth = ["/login", "/register", "/verify-otp"].includes(
    location.pathname,
  );
  const menu = routes.filter((r) =>
    session
      ? r.roles.includes(session.user.role)
      : r.roles.length === 0 &&
        !r.path.includes("otp") &&
        !r.path.includes("register") &&
        !r.path.includes("login"),
  );
  const labels: Record<string, string> = {
    CUSTOMER: "Khách hàng",
    STAFF: "Nhân viên cơ sở",
    FMANAGER: "Quản lý cơ sở",
    OPS_MGR: "Vận hành toàn chuỗi",
    ADMIN: "Quản trị hệ thống",
  };
  if (auth)
    return (
      <Routes>
        {routes
          .filter((r) => !r.roles.length)
          .map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
      </Routes>
    );
  return (
    <div className={"app " + (session ? "with-sidebar" : "")}>
      <header className="topbar">
        <Link className="brand" to="/">
          ▦ STORAGE <small>KHO LƯU TRỮ TỰ PHỤC VỤ</small>
        </Link>
        <nav>
          <Link to="/storage">Tìm kho</Link>
          {session ? (
            <>
              <span className="role-label">{labels[session.user.role]}</span>
              <span className="avatar">{session.user.name?.slice(0, 1)}</span>
              <span>{session.user.name}</span>
              <button
                className="secondary"
                onClick={() => sessionStore.set(null)}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link className="button" to="/register">
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </header>
      {session && (
        <aside className="sidebar">
          <div className="branch-label">
            {session.user.facility ||
              session.user.facilityCode ||
              "Phạm vi hệ thống"}
          </div>
          <small>KHÔNG GIAN LÀM VIỆC</small>
          {menu.map((r) => (
            <NavLink key={r.path} to={r.path.replace(/:[^/]+/g, "all")}>
              ▦ <span>{r.title}</span>
            </NavLink>
          ))}
          <div className="sidebar-note">
            Hỗ trợ tại cơ sở
            <br />
            Thông tin và giao dịch theo quyền truy cập.
          </div>
        </aside>
      )}
      <main className="main">
        <Routes>
          {routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<RoleGuard roles={r.roles}>{r.element}</RoleGuard>}
            />
          ))}
          <Route
            path="*"
            element={
              <section className="card empty">
                <h1>Không tìm thấy trang</h1>
                <Link to="/">Về trang chủ</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        STORAGE · Self-Storage Facility Rental & Management
      </footer>
    </div>
  );
}
