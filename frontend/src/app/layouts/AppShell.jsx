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

    if (auth) {
        return (
            <div className="auth-shell">
                <main className="auth-main" style={{ padding: 0 }}>
                    <Routes>
                        {routes
                            .filter((r) => !r.roles.length)
                            .map((r) => (
                                <Route key={r.path} path={r.path} element={r.element} />
                            ))}
                    </Routes>
                </main>
            </div>
        );
    }

    const roleMenu = {
        CUSTOMER: [
            ["/storage", "Kho lưu trữ"],
            ["/rentals", "Kho đang thuê"],
            ["/support", "Hỗ trợ"],
            ["/reservations/new", "Đặt chỗ"],
            ["/invoices/all/pay", "Thanh toán"],
            ["/reservations/all/appointment", "Thẻ hẹn"],
            ["/reservations/all/pass", "Check-in"],
            ["/handover-reviews", "Bàn giao"],
            ["/refunds", "Hoàn tiền"]
        ],
        STAFF: [
            ["/facility/tasks/my", "Dashboard / Hàng đợi"],
            ["/facility/reservations/lookup", "Đơn đặt phòng"],
            ["/facility/handovers", "Check-in & Bàn giao"],
            ["/facility/inspections", "Trả kho & Nghiệm thu"],
            ["/facility/refunds/evidence", "Thực hiện hoàn tiền"],
            ["/facility/incidents", "Yêu cầu hỗ trợ"],
            ["/facility/units/status", "Kho / Unit"]
        ],
        FMANAGER: [
            ["/facility/overview", "Tổng quan cơ sở"],
            ["/facility/units", "Quản lý kho"],
            ["/facility/reservations/assign", "Phân bổ kho"],
            ["/facility/tasks/assign", "Nhân viên"],
            ["/facility/incidents", "Yêu cầu hỗ trợ"],
            ["/facility/contracts", "Hợp đồng"],
            ["/facility/return-inspection-reviews", "Khiếu nại nghiệm thu"],
            ["/facility/invoices", "Hóa đơn"],
            ["/facility/refunds/confirm", "Xác nhận hoàn tiền"],
            ["/facility/reports", "Báo cáo cơ sở"]
        ],
        OPS_MGR: [
            ["/operations/overview", "Tổng quan kinh doanh"],
            ["/operations/facilities", "Quản lý cơ sở"],
            ["/operations/pricing", "Giá & phí"],
            ["/operations/policies", "Chính sách thuê"],
            ["/operations/reports", "Báo cáo chuỗi"]
        ],
        ADMIN: [
            ["/admin/overview", "Tổng quan"],
            ["/admin/users", "Người dùng"],
            ["/admin/roles", "Vai trò & RBAC"],
            ["/admin/staff-assignments", "Phân công cơ sở"],
            ["/admin/activity", "Audit & Đăng nhập"]
        ],
    };

    const publicLinks = [
        ["/", "Trang chủ"],
        ["/storage", "Kho lưu trữ"],
        ["/storage", "Điều kiện thuê"],
        ["/storage", "Chính sách bảo mật"],
    ];

    const links = session ? (roleMenu[session.user.role] || []) : publicLinks;

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
        ADMIN: {
            title: "QUẢN TRỊ HỆ THỐNG",
            context: "Hệ thống toàn chuỗi",
            footer: "Phân hệ Quản trị Hệ thống · Kho Gọn Storage",
        },
    };

    const internalRole = session?.user?.role;
    const isBackoffice = internalRole && internalRole !== "CUSTOMER";
    const roleShell = isBackoffice ? roleShells[internalRole] : null;

    const pageRoutes = (
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
    );

    if (roleShell) {
        return (
            <div className={`app role-shell role-shell-${internalRole.toLowerCase()}`}>
                <header className="role-header">
                    <Link className="figma-brand" to={links[0]?.[0] || "/"}>
                        <span className="brand-logo-icon">▦</span>
                        <div className="brand-text">
                            <span className="brand-title">STORAGE</span>
                            <span className="brand-sub">HỆ THỐNG KHO TỰ QUẢN</span>
                        </div>
                    </Link>
                    <div className="role-header-context">
                        <span className="context-badge">{roleShell.title}</span>
                        <strong>{roleShell.context}</strong>
                    </div>
                    <div className="role-account">
                        <span className="avatar">{session.user.name?.slice(0, 1)}</span>
                        <div className="role-account-name">
                            <strong>{session.user.name || session.user.username}</strong>
                            <small>{labels[internalRole]}</small>
                        </div>
                        <button className="secondary" onClick={() => sessionStore.set(null)}>
                            Đăng xuất
                        </button>
                    </div>
                </header>
                <div className="role-layout">
                    <aside className="role-sidebar" aria-label="Điều hướng vai trò">
                        <span className="role-sidebar-label">BÀN LÀM VIỆC</span>
                        <nav>
                            {links.map(([path, title]) => (
                                <NavLink key={path} to={path}>
                                    {title}
                                </NavLink>
                            ))}
                        </nav>
                        <div className="role-sidebar-note">
                            <strong>{roleShell.context}</strong>
                            <small>
                                {internalRole === "STAFF"
                                    ? "Nhân sự vận hành trực cơ sở"
                                    : internalRole === "FMANAGER"
                                    ? "Quản trị cơ sở & khoang kho"
                                    : "Điều phối vận hành & dữ liệu"}
                            </small>
                        </div>
                    </aside>
                    <main className="role-main">
                        <div className="role-content">{pageRoutes}</div>
                        <footer className="role-footer">
                            {roleShell.footer} · Phiên làm việc an toàn
                        </footer>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="app figma-consumer-app">
            {/* FIGMA TOPBAR HEADER */}
            <header className="figma-topbar">
                <div className="topbar-container">
                    <Link className="figma-brand" to="/">
                        <span className="brand-logo-icon">▦</span>
                        <div className="brand-text">
                            <span className="brand-title">STORAGE</span>
                            <span className="brand-sub">KHO GỌN - HỆ THỐNG KHO TỰ QUẢN</span>
                        </div>
                    </Link>

                    <nav className="figma-navbar">
                        <div className="nav-menu">
                            {session ? (
                                links.map(([path, title]) => (
                                    <NavLink key={path} to={path}>
                                        {title}
                                    </NavLink>
                                ))
                            ) : (
                                <>
                                    <NavLink to="/" end>Trang chủ</NavLink>
                                    <NavLink to="/storage">Kho lưu trữ</NavLink>
                                    <Link to="/storage">Điều kiện thuê</Link>
                                    <Link to="/storage">Chính sách bảo mật</Link>
                                </>
                            )}
                        </div>

                        {session ? (
                            <div className="nav-account-logged">
                                <span className="user-badge">{labels[session.user.role]}</span>
                                <span className="avatar-circle">{session.user.name?.slice(0, 1)}</span>
                                <span className="user-name">{session.user.name || session.user.username}</span>
                                <button
                                    className="figma-btn figma-btn-outline btn-sm"
                                    onClick={() => sessionStore.set(null)}
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="nav-account-guest">
                                <Link className="guest-login-link" to="/login">
                                    Đăng nhập
                                </Link>
                                <Link className="figma-btn figma-btn-dark btn-sm" to="/register">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="figma-main-body">{pageRoutes}</main>

            {/* FIGMA FOOTER (DARK NAVY #0B192C) */}
            <footer className="figma-footer">
                <div className="footer-container">
                    <div className="footer-columns">
                        {/* Col 1: Brand Info */}
                        <div className="footer-col brand-col">
                            <div className="footer-brand">
                                <span className="brand-logo-icon light">▦</span>
                                <div className="brand-text light">
                                    <span className="brand-title">STORAGE</span>
                                    <span className="brand-sub">KHO GỌN THÔNG MINH</span>
                                </div>
                            </div>
                            <p className="footer-desc">
                                Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ an toàn, linh hoạt và tiện lợi hàng đầu Việt Nam.
                            </p>
                            <div className="footer-badges">
                                <span className="footer-pill">🛡️ Bảo vệ 24/7</span>
                                <span className="footer-pill">❄️ Kiểm soát nhiệt độ</span>
                                <span className="footer-pill">🔐 Khóa số bảo mật</span>
                            </div>
                        </div>

                        {/* Col 2: Hệ thống */}
                        <div className="footer-col">
                            <h4>Hệ thống</h4>
                            <ul>
                                <li><Link to="/">Trang chủ</Link></li>
                                <li><Link to="/storage">Kho lưu trữ</Link></li>
                                <li><Link to="/storage">Bảng giá dịch vụ</Link></li>
                                <li><Link to="/login">Đăng nhập tài khoản</Link></li>
                            </ul>
                        </div>

                        {/* Col 3: Chính sách & Pháp lý */}
                        <div className="footer-col">
                            <h4>Chính sách &amp; Pháp lý</h4>
                            <ul>
                                <li><a href="#rules">Tiêu chuẩn sử dụng</a></li>
                                <li><a href="#privacy">Chính sách bảo mật</a></li>
                                <li><a href="#terms">Quy định lưu trữ</a></li>
                                <li><a href="#insurance">Bảo hiểm tài sản</a></li>
                            </ul>
                        </div>

                        {/* Col 4: Hỗ trợ & Liên hệ */}
                        <div className="footer-col contact-col">
                            <h4>Hỗ trợ &amp; Liên hệ</h4>
                            <ul>
                                <li>📞 Hotline: <strong>1900 6868</strong></li>
                                <li>✉️ Email: <strong>hotro@storage.vn</strong></li>
                                <li>🕒 08:00 - 20:00 hàng ngày (Cả T7 &amp; CN)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 STORAGE RENTAL. Bản quyền thuộc về Hệ thống Cho thuê Kho Tự Quản Thông Minh.</p>
                        <span>Phiên bản 2.0 · Tiêu chuẩn chất lượng ISO 9001:2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
