import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { identityApi } from "../api/identity.api";
import { sessionStore } from "../session";
import { landingForRole } from "../lib/auth-navigation";
import { registrationError, registrationPayload } from "../lib/auth-validation";
import { facilityApi } from "../../facility/api/facility.api";
import heroStorageImage from "../../../assets/images/hero_storage.jpg";

export default function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const register = location.pathname === "/register";

    const [challenge, setChallenge] = useState();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [facilities, setFacilities] = useState([]);
    const [facilityError, setFacilityError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [activeDemoRole, setActiveDemoRole] = useState("");

    // Controlled inputs for quick demo fill
    const notification = location.state;
    const [username, setUsername] = useState(notification?.email ?? "");
    const [password, setPassword] = useState("");

    const demoAccounts = [
        { role: "CUSTOMER", label: "Khách hàng", username: "customer", password: "Demo123!" },
        { role: "FMANAGER", label: "Quản lý cơ sở", username: "manager", password: "Demo123!" },
        { role: "STAFF", label: "Nhân viên cơ sở", username: "staff", password: "Demo123!" },
        { role: "OPS_MGR", label: "Điều hành chuỗi", username: "business", password: "Demo123!" },
        { role: "ADMIN", label: "Quản trị viên", username: "admin", password: "Demo123!" },
    ];

    function selectDemoAccount(acc) {
        setUsername(acc.username);
        setPassword(acc.password);
        setActiveDemoRole(acc.role);
        setError("");
    }

    useEffect(() => {
        setChallenge(undefined);
        setError("");
        setActiveDemoRole("");
        if (location.pathname === "/login") {
            setUsername(notification?.email ?? "");
            setPassword("");
        }
    }, [location.pathname, notification?.email]);

    useEffect(() => {
        if (!register) return;
        setFacilityError("");
        facilityApi.facilities()
            .then((items) =>
                setFacilities(
                    items.filter(
                        (item) => !item.status || String(item.status).toUpperCase() === "ACTIVE"
                    )
                )
            )
            .catch((cause) =>
                setFacilityError(
                    cause instanceof Error ? cause.message : "Không tải được danh sách cơ sở."
                )
            );
    }, [register]);

    useEffect(() => {
        if (!challenge) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [challenge]);

    const wait = challenge
        ? Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000))
        : 0;

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setBusy(true);
        setError("");
        try {
            if (challenge) {
                if (!/^[0-9]{6}$/.test(String(data.code ?? "")))
                    throw new Error("Mã xác minh phải có 6 chữ số.");
                const result = await identityApi.verifyOtp({
                    email: challenge.email,
                    code: String(data.code ?? ""),
                });
                if (!result.data.registered)
                    throw new Error("Chưa thể hoàn tất đăng ký.");
                form.reset();
                setChallenge(undefined);
                navigate("/login", {
                    replace: true,
                    state: { registered: true, email: result.data.email },
                });
            } else if (register) {
                const payload = registrationPayload(data);
                const invalid = registrationError(payload);
                if (invalid) throw new Error(invalid);
                const response = await identityApi.sendOtp(payload);
                setChallenge(response.data);
                setNow(Date.now());
                form.reset();
            } else {
                const enteredUser = String(data.username ?? "").trim();
                const enteredPass = String(data.password ?? "");
                if (!enteredUser || !/\S/u.test(enteredPass))
                    throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu.");
                const result = await identityApi.login({
                    username: enteredUser,
                    password: enteredPass,
                });
                if (!result.token)
                    throw new Error("Máy chủ chưa cấp phiên đăng nhập.");
                const destination = landingForRole(result.data.role);
                sessionStore.set({ user: result.data, token: result.token });
                form.reset();
                navigate(destination, { replace: true });
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không thể xử lý yêu cầu.");
        } finally {
            setBusy(false);
        }
    }

    async function resend() {
        if (!challenge || busy || wait > 0) return;
        setBusy(true);
        setError("");
        try {
            const result = await identityApi.resendOtp(challenge.email);
            setChallenge(result.data);
            setNow(Date.now());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không gửi lại được mã.");
        } finally {
            setBusy(false);
        }
    }

    if (location.pathname === "/verify-otp" && !challenge) {
        return (
            <div className="auth-split-wrapper">
                <div className="auth-form-side" style={{ justifyContent: "center" }}>
                    <div className="auth-form-card" style={{ textAlign: "center" }}>
                        <span className="auth-eyebrow-pill">XÁC MINH BẢO MẬT</span>
                        <h1 className="auth-title">Xác minh đăng ký</h1>
                        <p className="auth-subtitle">
                            Vui lòng bắt đầu đăng ký tài khoản để nhận phiên xác thực mã OTP.
                        </p>
                        <Link to="/register" className="auth-btn-submit" style={{ textDecoration: "none" }}>
                            Đến trang đăng ký →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-split-wrapper">
            {/* LEFT COLUMN: FORM & DEMO PICKER */}
            <div className="auth-form-side">
                {/* Top Nav with Brand & Back to Home */}
                <div className="auth-top-nav">
                    <Link className="figma-brand" to="/">
                        <span className="brand-logo-icon" aria-hidden="true">
                            <svg viewBox="0 0 32 32" fill="none" focusable="false">
                                <rect x="5" y="5" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
                                <path d="M11 5v22M21 5v22M5 12h22M5 20h22" stroke="currentColor" strokeWidth="1.7" />
                            </svg>
                        </span>
                        <div className="brand-text">
                            <span className="brand-title">STORAGE</span>
                            <span className="brand-sub">HỆ THỐNG KHO TỰ QUẢN</span>
                        </div>
                    </Link>
                    <Link to="/" className="auth-back-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Về trang chủ</span>
                    </Link>
                </div>

                {/* Form Body */}
                <div className="auth-form-card">
                    <div className="auth-eyebrow-pill">
                        <span style={{ fontSize: "8px" }}>●</span>
                        <span>{challenge ? "XÁC MINH OTP" : register ? "ĐĂNG KÝ TỰ PHỤC VỤ" : "CỔNG ĐĂNG NHẬP HỆ THỐNG"}</span>
                    </div>

                    <h1 className="auth-title">
                        {challenge ? "Xác minh tài khoản" : register ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
                    </h1>
                    <p className="auth-subtitle">
                        {challenge
                            ? `Nhập mã xác minh 6 chữ số đã gửi đến email ${challenge.email}.`
                            : register
                            ? "Điền thông tin để đăng ký kho lưu trữ thông minh và nhận phòng ngay."
                            : "Quản lý hợp đồng, mã PIN mở kho và giao dịch trực tuyến tiện lợi tại một nơi."}
                    </p>

                    {/* Quick Demo Accounts Helper (Only on Login) */}
                    {import.meta.env.DEV && !register && !challenge && (
                        <div className="demo-accounts-box">
                            <div className="demo-accounts-title">
                                <span>⚡ Tài khoản thử nghiệm (1-click):</span>
                                <small style={{ color: "#94A3B8" }}>Demo123!</small>
                            </div>
                            <div className="demo-chips-grid">
                                {demoAccounts.map((acc) => (
                                    <button
                                        key={acc.role}
                                        type="button"
                                        className={`demo-chip-btn ${activeDemoRole === acc.role ? "active" : ""}`}
                                        onClick={() => selectDemoAccount(acc)}
                                    >
                                        <span>{acc.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!register && notification?.registered && (
                        <div
                            className="alert-banner alert-success"
                            role="status"
                            style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Đăng ký thành công! Vui lòng đăng nhập với tài khoản vừa tạo.</span>
                        </div>
                    )}

                    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {challenge ? (
                            <>
                                <div>
                                    <label htmlFor="auth-code" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                        Mã xác minh (6 số)
                                    </label>
                                    <div className="input-icon-wrapper">
                                        <span className="input-icon-prefix">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                        <input
                                            id="auth-code"
                                            name="code"
                                            className="input-with-icon"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            placeholder="Nhập 6 chữ số OTP"
                                            required
                                            autoFocus
                                            style={{ letterSpacing: "4px", fontSize: "18px", fontWeight: 700 }}
                                        />
                                    </div>
                                    <p style={{ fontSize: "12.5px", color: "#64748B", margin: "6px 0 0" }}>
                                        Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra hộp thư đến hoặc Spam.
                                    </p>
                                    {now >= Date.parse(challenge.expiresAt) && (
                                        <div className="alert-banner alert-error" role="alert" style={{ marginTop: "12px" }}>
                                            Phiên xác minh đã hết hạn. Vui lòng thực hiện đăng ký lại.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {register && (
                                    <>
                                        <div className="auth-register-grid">
                                            <div>
                                                <label htmlFor="auth-name" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                                    Họ và tên
                                                </label>
                                                <input id="auth-name" name="name" className="input-with-icon" style={{ paddingLeft: "14px" }} placeholder="Nguyễn Văn A" autoComplete="name" required />
                                            </div>
                                            <div>
                                                <label htmlFor="auth-phone" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                                    Số điện thoại
                                                </label>
                                                <input id="auth-phone" name="phone" type="tel" className="input-with-icon" style={{ paddingLeft: "14px" }} placeholder="0901234567" autoComplete="tel" required />
                                            </div>
                                        </div>

                                        <div className="auth-register-grid">
                                            <div>
                                                <label htmlFor="auth-email" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                                    Email
                                                </label>
                                                <input id="auth-email" name="email" type="email" className="input-with-icon" style={{ paddingLeft: "14px" }} placeholder="example@email.com" autoComplete="email" required />
                                            </div>
                                            <div>
                                                <label htmlFor="auth-cccd" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                                    Số CCCD / CMND
                                                </label>
                                                <input id="auth-cccd" name="cccd" className="input-with-icon" style={{ paddingLeft: "14px" }} placeholder="12 số căn cước" inputMode="numeric" required />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="auth-facility" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                                Cơ sở gần bạn nhất (không bắt buộc)
                                            </label>
                                            <select id="auth-facility" name="facilityCode" defaultValue="" className="input-with-icon" style={{ paddingLeft: "14px" }}>
                                                <option value="">-- Chọn chi nhánh quan tâm --</option>
                                                {facilities.map((facility) => (
                                                    <option key={String(facility.code)} value={String(facility.code)}>
                                                        {String(facility.name)} ({String(facility.code)})
                                                    </option>
                                                ))}
                                            </select>
                                            {facilityError && <p style={{ fontSize: "12px", color: "#DC2626", margin: "4px 0 0" }}>{facilityError}</p>}
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="auth-username" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                        {register ? "Tên đăng nhập" : "Tên đăng nhập hoặc email"}
                                    </label>
                                    <div className="input-icon-wrapper">
                                        <span className="input-icon-prefix">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </span>
                                        <input
                                            id="auth-username"
                                            name="username"
                                            className="input-with-icon"
                                            autoComplete="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="ví dụ: customer hoặc email@domain.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="auth-password" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                        Mật khẩu
                                    </label>
                                    <div className="input-icon-wrapper">
                                        <span className="input-icon-prefix">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </span>
                                        <input
                                            id="auth-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            className="input-with-icon"
                                            autoComplete={register ? "new-password" : "current-password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {register && (
                                    <div>
                                        <label htmlFor="auth-confirm-password" style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                            Nhập lại mật khẩu
                                        </label>
                                        <div className="input-icon-wrapper">
                                            <span className="input-icon-prefix">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </span>
                                            <input
                                                id="auth-confirm-password"
                                                name="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                className="input-with-icon"
                                                autoComplete="new-password"
                                                placeholder="Xác nhận lại mật khẩu"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="alert-banner alert-error" role="alert" style={{ marginTop: "4px" }}>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-btn-submit"
                            disabled={busy || Boolean(challenge && now >= Date.parse(challenge.expiresAt))}
                        >
                            {busy ? (
                                "Đang xử lý…"
                            ) : challenge ? (
                                "Xác minh mã OTP →"
                            ) : register ? (
                                "Đăng ký tài khoản →"
                            ) : (
                                "Đăng nhập ngay →"
                            )}
                        </button>

                        {challenge && (
                            <button
                                type="button"
                                className="figma-btn figma-btn-outline"
                                style={{ width: "100%", height: "46px", marginTop: "4px" }}
                                disabled={busy || wait > 0 || now >= Date.parse(challenge.expiresAt)}
                                onClick={resend}
                            >
                                {wait > 0 ? `Gửi lại mã OTP sau ${wait}s` : "Gửi lại mã OTP qua Email"}
                            </button>
                        )}
                    </form>

                    <div className="auth-switch-link">
                        {challenge ? (
                            <button
                                type="button"
                                style={{ background: "none", border: "none", color: "#0066FF", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                                disabled={busy}
                                onClick={() => {
                                    setChallenge(undefined);
                                    setError("");
                                }}
                            >
                                ← Quay lại đăng ký tài khoản khác
                            </button>
                        ) : (
                            <>
                                <span>{register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}</span>
                                <Link to={register ? "/login" : "/register"}>
                                    {register ? "Đăng nhập ngay" : "Đăng ký tài khoản mới"}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Security Note */}
                <div className="auth-footer-security">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Thông tin tài khoản chỉ dùng để quản lý dịch vụ kho của bạn.</span>
                </div>
            </div>

            {/* RIGHT COLUMN: VISUAL SHOWCASE */}
            <div
                className="auth-showcase-side"
                style={{ backgroundImage: `url(${heroStorageImage})` }}
            >
                <div className="auth-showcase-overlay" />
                <div className="auth-showcase-content">
                    <div className="auth-glass-card">
                        <div className="auth-glass-tag">✓ HỆ THỐNG KHO TỰ QUẢN TIÊU CHUẨN</div>
                        <h2 className="auth-glass-title">
                            Quản lý việc thuê kho thuận tiện tại một nơi
                        </h2>

                        <div className="auth-glass-features">
                            <div className="auth-glass-feature-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Theo dõi kho đang thuê và thông tin ra vào trong tài khoản.</span>
                            </div>
                            <div className="auth-glass-feature-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Xem hợp đồng, hóa đơn và lịch sử thanh toán trực tuyến.</span>
                            </div>
                            <div className="auth-glass-feature-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Gửi yêu cầu trả kho, hỗ trợ và hoàn tiền theo từng bước.</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
