import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { identityApi } from "../api/identity.api";
import { sessionStore } from "../session";
import { landingForRole } from "../lib/auth-navigation";
import { registrationError, registrationPayload } from "../lib/auth-validation";
import { facilityApi } from "../../facility/api/facility.api";
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
    const notification = location.state;
    useEffect(() => {
        setChallenge(undefined);
        setError("");
    }, [location.pathname]);
    useEffect(() => {
        if (!register)
            return;
        setFacilityError("");
        facilityApi.facilities()
            .then((items) => setFacilities(items.filter((item) => !item.status || String(item.status).toUpperCase() === "ACTIVE")))
            .catch((cause) => setFacilityError(cause instanceof Error ? cause.message : "Không tải được danh sách cơ sở."));
    }, [register]);
    useEffect(() => {
        if (!challenge)
            return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [challenge]);
    const wait = challenge
        ? Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000))
        : 0;
    async function submit(event) {
        event.preventDefault();
        if (busy)
            return;
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
                // FR-001: verification creates an account, not a login session.
                navigate("/login", { replace: true, state: { registered: true, email: result.data.email } });
            }
            else if (register) {
                const payload = registrationPayload(data);
                const invalid = registrationError(payload);
                if (invalid)
                    throw new Error(invalid);
                const response = await identityApi.sendOtp(payload);
                setChallenge(response.data);
                setNow(Date.now());
                form.reset();
            }
            else {
                const username = String(data.username ?? "").trim();
                const password = String(data.password ?? "");
                if (!username || !/\S/u.test(password))
                    throw new Error("Vui lòng nhập thông tin đăng nhập.");
                const result = await identityApi.login({ username, password });
                if (!result.token)
                    throw new Error("Máy chủ chưa cấp phiên đăng nhập.");
                const destination = landingForRole(result.data.role);
                sessionStore.set({ user: result.data, token: result.token });
                form.reset();
                navigate(destination, { replace: true });
            }
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không thể xử lý yêu cầu.");
        }
        finally {
            setBusy(false);
        }
    }
    async function resend() {
        if (!challenge || busy || wait > 0)
            return;
        setBusy(true);
        setError("");
        try {
            const result = await identityApi.resendOtp(challenge.email);
            setChallenge(result.data);
            setNow(Date.now());
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không gửi lại được mã.");
        }
        finally {
            setBusy(false);
        }
    }
    if (location.pathname === "/verify-otp" && !challenge) {
        return <main className="auth-page"><section className="card auth-card">
      <h1>Xác minh đăng ký</h1>
      <p>Vui lòng bắt đầu đăng ký để nhận phiên xác minh.</p>
      <Link to="/register">Đến trang đăng ký</Link>
    </section></main>;
    }
    return <main className="auth-page">
    <Link to="/" className="brand">▦ STORAGE</Link>
    <section className="card auth-card" aria-busy={busy}>
      <span className="eyebrow">KHO LƯU TRỮ TỰ PHỤC VỤ</span>
      <h1>{challenge ? "Xác minh tài khoản" : register ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
      <p>{challenge ? `Nhập mã đã gửi đến ${challenge.email}.` : "Quản lý không gian lưu trữ của bạn tại một nơi."}</p>
      {!register && notification?.registered && <p className="notice" role="status">
        Đăng ký thành công. Vui lòng đăng nhập.
      </p>}
      <form onSubmit={submit} className="form-grid" noValidate>
        {challenge ? <>
          <label>Mã xác minh
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus/>
          </label>
          <p className="notice" role="status">Mã xác minh đã được gửi đến email của bạn.</p>
          {now >= Date.parse(challenge.expiresAt) && <p className="error" role="alert">
            Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.
          </p>}
        </> : <>
          {register && <>
            <label>Họ và tên<input name="name" autoComplete="name" required/></label>
            <label>Email<input name="email" type="email" autoComplete="email" required/></label>
            <label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" required/></label>
            <label>CCCD<input name="cccd" inputMode="numeric" required/></label>
            <label>Cơ sở (không bắt buộc)
              <select name="facilityCode" defaultValue="">
                <option value="">
                  Không chọn cơ sở
                </option>
                {facilities.map((facility) => (<option key={String(facility.code)} value={String(facility.code)}>
                    {String(facility.name)} ({String(facility.code)})
                  </option>))}
              </select>
            </label>
            {facilityError && <p role="alert" className="error">{facilityError}</p>}
          </>}
          <label>{register ? "Tên đăng nhập" : "Tên đăng nhập hoặc email"}
            <input name="username" autoComplete="username" required defaultValue={!register ? notification?.email ?? "" : ""}/>
          </label>
          <label>Mật khẩu
            <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required/>
          </label>
          {register && <label>Nhập lại mật khẩu
            <input name="confirmPassword" type="password" autoComplete="new-password" required/>
          </label>}
        </>}
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" disabled={busy || Boolean(challenge && now >= Date.parse(challenge.expiresAt))}>
          {busy ? "Đang xử lý…" : challenge ? "Xác minh" : register ? "Đăng ký" : "Đăng nhập"}
        </button>
        {challenge && <button type="button" className="secondary" disabled={busy || wait > 0 || now >= Date.parse(challenge.expiresAt)} onClick={resend}>
          {wait > 0 ? `Gửi lại mã sau ${wait}s` : "Gửi lại mã"}
        </button>}
      </form>
      {challenge ? <button type="button" className="secondary" disabled={busy} onClick={() => { setChallenge(undefined); setError(""); }}>Đăng ký lại</button>
            : <p>{register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <Link to={register ? "/login" : "/register"}>{register ? "Đăng nhập" : "Đăng ký ngay"}</Link>
        </p>}
    </section>
  </main>;
}
