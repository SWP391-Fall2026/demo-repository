import { useState, useRef, useEffect } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { routes } from "../router";
import { RoleGuard } from "../guards/RoleGuard";
import { useSession, sessionStore } from "../../features/identity/session";

export function AppShell() {
    const session = useSession(), location = useLocation();
    const [locationsOpen, setLocationsOpen] = useState(false);
    const [rentalsOpen, setRentalsOpen] = useState(false);
    const locationsRef = useRef(null);
    const rentalsRef = useRef(null);
    const locationsTimer = useRef(null);
    const rentalsTimer = useRef(null);

    const openLocations = () => {
        if (locationsTimer.current) clearTimeout(locationsTimer.current);
        setLocationsOpen(true);
    };
    const closeLocations = () => {
        if (locationsTimer.current) clearTimeout(locationsTimer.current);
        locationsTimer.current = setTimeout(() => {
            setLocationsOpen(false);
        }, 220);
    };

    const openRentals = () => {
        if (rentalsTimer.current) clearTimeout(rentalsTimer.current);
        setRentalsOpen(true);
    };
    const closeRentals = () => {
        if (rentalsTimer.current) clearTimeout(rentalsTimer.current);
        rentalsTimer.current = setTimeout(() => {
            setRentalsOpen(false);
        }, 220);
    };

    useEffect(() => {
        if (locationsTimer.current) clearTimeout(locationsTimer.current);
        if (rentalsTimer.current) clearTimeout(rentalsTimer.current);
        setLocationsOpen(false);
        setRentalsOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (locationsRef.current && !locationsRef.current.contains(event.target)) {
                setLocationsOpen(false);
            }
            if (rentalsRef.current && !rentalsRef.current.contains(event.target)) {
                setRentalsOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setLocationsOpen(false);
                setRentalsOpen(false);
            }
        }
        if (locationsOpen || rentalsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [locationsOpen, rentalsOpen]);

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
                            {/* 1. ĐỊA ĐIỂM KHO DROPDOWN (MyStorage Style) */}
                            <div
                                className="navbar-dropdown-wrapper"
                                ref={locationsRef}
                                onMouseEnter={openLocations}
                                onMouseLeave={closeLocations}
                            >
                                <button
                                    type="button"
                                    className={`navbar-dropdown-trigger ${locationsOpen ? "active" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocationsOpen((prev) => !prev);
                                    }}
                                    aria-expanded={locationsOpen}
                                >
                                    <span>Địa Điểm Kho</span>
                                    <svg
                                        className={`navbar-caret-icon ${locationsOpen ? "open" : ""}`}
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>

                                {locationsOpen && (
                                    <div className="navbar-dropdown-menu locations-dropdown">
                                        <div className="dropdown-section">
                                            <div className="dropdown-city-title">HÀ NỘI</div>
                                            <Link
                                                to="/storage?facility=HN-CG"
                                                className="dropdown-location-link"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                <span className="location-name">Kho Cầu Giấy</span>
                                                <span className="location-sub">15 Duy Tân, Q. Cầu Giấy</span>
                                            </Link>
                                            <a
                                                href="https://maps.google.com/?q=15+Duy+Tân+Cầu+Giấy+Hà+Nội"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dropdown-location-sublink"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                Bản đồ kho – 15 Duy Tân
                                            </a>
                                        </div>

                                        <div className="dropdown-section">
                                            <div className="dropdown-city-title">TP. HỒ CHÍ MINH</div>
                                            <Link
                                                to="/storage?facility=HCM-TB"
                                                className="dropdown-location-link"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                <span className="location-name">Kho Tân Bình</span>
                                                <span className="location-sub">45 Cộng Hòa, P. 4, Q. Tân Bình</span>
                                            </Link>
                                            <a
                                                href="https://maps.google.com/?q=45+Cộng+Hòa+Tân+Bình+Hồ+Chí+Minh"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="dropdown-location-sublink"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                Bản đồ kho – 45 Cộng Hòa
                                            </a>
                                            <Link
                                                to="/storage?facility=HCM-Q7"
                                                className="dropdown-location-link"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                <span className="location-name">Kho Quận 7</span>
                                                <span className="location-sub">128 Nguyễn Thị Thập, Q. 7</span>
                                            </Link>
                                            <Link
                                                to="/storage"
                                                className="dropdown-location-link"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                <span className="location-name">Tủ Locker Thủ Đức</span>
                                                <span className="location-sub">375 Võ Nguyên Giáp, TP. Thủ Đức</span>
                                            </Link>
                                        </div>

                                        <div className="dropdown-section-footer">
                                            <Link
                                                to="/storage"
                                                className="dropdown-view-all-link"
                                                onClick={() => setLocationsOpen(false)}
                                            >
                                                <span>👉 Xem tất cả chi nhánh &amp; bảng giá</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. TÌM KHO (Direct Catalog Link) */}
                            <NavLink to="/storage">
                                Tìm kho
                            </NavLink>

                            {/* 3. KHO HIỆN TẠI / DỊCH VỤ DROPDOWN */}
                            {session?.user?.role === "CUSTOMER" ? (
                                <div
                                    className="navbar-dropdown-wrapper"
                                    ref={rentalsRef}
                                    onMouseEnter={openRentals}
                                    onMouseLeave={closeRentals}
                                >
                                    <button
                                        type="button"
                                        className={`navbar-dropdown-trigger ${rentalsOpen ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRentalsOpen((prev) => !prev);
                                        }}
                                        aria-expanded={rentalsOpen}
                                    >
                                        <span>Kho Hiện Tại</span>
                                        <svg
                                            className={`navbar-caret-icon ${rentalsOpen ? "open" : ""}`}
                                            width="10"
                                            height="10"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>

                                    {rentalsOpen && (
                                        <div className="navbar-dropdown-menu rentals-dropdown">
                                            <div className="dropdown-section">
                                                <div className="dropdown-city-title">QUẢN LÝ KHO ĐANG THUÊ</div>
                                                <Link to="/rentals" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📦 Kho đang thuê &amp; Mã PIN</span>
                                                    <span className="location-sub">Mã PIN mở khóa điện tử 24/7 &amp; hợp đồng</span>
                                                </Link>
                                                <Link to="/reservations/all/pass" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">🔑 Thẻ Check-in điện tử</span>
                                                    <span className="location-sub">Mã QR và thẻ số ra vào cơ sở</span>
                                                </Link>
                                                <Link to="/reservations/all/appointment" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📅 Thẻ hẹn nhận kho</span>
                                                    <span className="location-sub">Lịch hẹn làm thủ tục nhận kho</span>
                                                </Link>
                                                <Link to="/handover-reviews" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">🤝 Biên bản bàn giao kho</span>
                                                    <span className="location-sub">Xác nhận hiện trạng buồng kho</span>
                                                </Link>
                                                <Link to="/rentals/return" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">↩️ Yêu cầu trả kho</span>
                                                    <span className="location-sub">Lập lịch bàn giao &amp; nghiệm thu</span>
                                                </Link>
                                            </div>

                                            <div className="dropdown-section">
                                                <div className="dropdown-city-title">DỊCH VỤ &amp; HỖ TRỢ</div>
                                                <Link to="/reservations/new" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📝 Đặt giữ chỗ mới</span>
                                                    <span className="location-sub">Tạo đơn đặt thuê khoang lưu trữ mới</span>
                                                </Link>
                                                <Link to="/payments" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">💳 Thanh toán &amp; Hóa đơn</span>
                                                    <span className="location-sub">Thanh toán tiền cọc và phí thuê kho</span>
                                                </Link>
                                                <Link to="/refunds" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">💰 Yêu cầu hoàn tiền</span>
                                                    <span className="location-sub">Theo dõi hồ sơ hoàn tiền &amp; cọc</span>
                                                </Link>
                                                <Link to="/support" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">🛠️ Hỗ trợ sự cố 24/7</span>
                                                    <span className="location-sub">Gửi báo cáo sự cố &amp; yêu cầu kỹ thuật</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : !session ? (
                                <div
                                    className="navbar-dropdown-wrapper"
                                    ref={rentalsRef}
                                    onMouseEnter={openRentals}
                                    onMouseLeave={closeRentals}
                                >
                                    <button
                                        type="button"
                                        className={`navbar-dropdown-trigger ${rentalsOpen ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRentalsOpen((prev) => !prev);
                                        }}
                                        aria-expanded={rentalsOpen}
                                    >
                                        <span>Dịch Vụ &amp; Tiện Ích</span>
                                        <svg
                                            className={`navbar-caret-icon ${rentalsOpen ? "open" : ""}`}
                                            width="10"
                                            height="10"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>

                                    {rentalsOpen && (
                                        <div className="navbar-dropdown-menu rentals-dropdown">
                                            <div className="dropdown-section">
                                                <div className="dropdown-city-title">GIẢI PHÁP LƯU TRỮ</div>
                                                <Link to="/storage" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">🏢 Kho lưu trữ cá nhân &amp; gia đình</span>
                                                    <span className="location-sub">Kích thước từ 2m² đến 10m²</span>
                                                </Link>
                                                <Link to="/storage" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📦 Kho lưu trữ hồ sơ doanh nghiệp</span>
                                                    <span className="location-sub">Bảo mật cao, kiểm soát nhiệt độ</span>
                                                </Link>
                                                <Link to="/reservations/new" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📝 Đặt giữ chỗ trực tuyến</span>
                                                    <span className="location-sub">Nhận buồng kho nhanh chóng</span>
                                                </Link>
                                            </div>

                                            <div className="dropdown-section">
                                                <div className="dropdown-city-title">HƯỚNG DẪN &amp; HỖ TRỢ</div>
                                                <Link to="/storage" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">📋 Quy định &amp; Điều kiện thuê kho</span>
                                                    <span className="location-sub">Chính sách bảo mật &amp; cam kết dịch vụ</span>
                                                </Link>
                                                <Link to="/support" className="dropdown-location-link" onClick={() => setRentalsOpen(false)}>
                                                    <span className="location-name">🛠️ Tổng đài hỗ trợ 24/7</span>
                                                    <span className="location-sub">Giải đáp thắc mắc và cứu hộ kho</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* RIGHT ACCOUNT AREA: Clean & Standard with Hotline & CTA */}
                        <div className="nav-actions-right">
                            <a href="tel:02877700117" className="navbar-hotline" title="Tổng đài tư vấn 24/7">
                                <span className="hotline-icon">📞</span>
                                <span className="hotline-text">028 7770 0117</span>
                            </a>
                            <Link to="/storage" className="navbar-cta-orange">
                                ĐẶT KHO NGAY
                            </Link>

                            {session ? (
                                <div className="nav-account-logged">
                                    <span className="user-badge">{labels[session.user.role]}</span>
                                    <span className="avatar-circle">{session.user.name?.slice(0, 1) || "K"}</span>
                                    <span className="user-name">{session.user.name || session.user.username}</span>
                                    <button
                                        type="button"
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
                        </div>
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
