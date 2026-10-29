import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { identityApi } from "../api/identity.api";
import { sessionStore } from "../session";
import { authNavigationState, landingForRole, returnToForRole } from "../lib/auth-navigation";
import { registrationError, registrationPayload } from "../lib/auth-validation";
import { facilityApi } from "../../facility/api/facility.api";
import { AuthHeader, Icon } from "../../customer/components/StitchCustomer";
import { PublicFooter } from "../../../app/layouts/PublicChrome";
import "./auth-stitch.css";

const emptyProfile = { name: "", email: "", password: "", confirmPassword: "", username: "", phone: "", cccd: "", facilityCode: "" };
function AuthField({ name, label, icon, password = false, error, ...props }) {
  const [visible, setVisible] = useState(false);
  const id = `auth-${name}`;
  return <div className={`auth-field ${error ? "has-error" : ""} ${password ? "auth-password-field" : ""}`}>
    <label htmlFor={id}>{label}{props.required && <em aria-hidden="true">*</em>}</label>
    <div className="auth-input"><Icon>{icon}</Icon><input {...props} id={id} name={name} type={password ? visible ? "text" : "password" : props.type || "text"} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${id}-error` : undefined}/>{password && <button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`} aria-pressed={visible}><Icon>{visible ? "visibility_off" : "visibility"}</Icon></button>}{error && <span className="auth-input-error"><Icon>error</Icon></span>}</div>
    {error && <p className="auth-field-error" id={`${id}-error`}><Icon>cancel</Icon>{error}</p>}
  </div>;
}
function ErrorBanner({ error, register }) {
  return error ? <div className="auth-error-banner" role="alert"><Icon>warning</Icon><div><strong>{register ? "Chưa thể hoàn tất đăng ký" : "Xác thực không thành công"}</strong><p>{error}</p></div></div> : null;
}
function ProfileDialog({ draft, setDraft, facilities, facilityError, fields, busy, error, onClose, onSubmit }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; ref.current?.showModal(); return () => { ref.current?.close(); previous?.focus?.(); }; }, []);
  const change = event => setDraft(value => ({ ...value, [event.target.name]: event.target.value }));
  return <dialog ref={ref} className="auth-profile-dialog" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }} aria-labelledby="profile-title"><header><div><span>THÔNG TIN KHÁCH HÀNG</span><h2 id="profile-title">Hoàn tất hồ sơ</h2></div><button type="button" onClick={onClose} disabled={busy} aria-label="Đóng"><Icon>close</Icon></button></header><p>Bổ sung thông tin để xác thực tài khoản và sử dụng dịch vụ thuê kho.</p><ErrorBanner error={error} register/><form onSubmit={onSubmit} noValidate>
    <AuthField name="username" label="Tên đăng nhập" icon="person" required autoComplete="username" value={draft.username} onChange={change} placeholder="nguyenvana" error={fields.username}/>
    <AuthField name="phone" label="Số điện thoại" icon="call" required type="tel" autoComplete="tel" value={draft.phone} onChange={change} placeholder="0901234567" error={fields.phone}/>
    <AuthField name="cccd" label="CCCD" icon="badge" required inputMode="numeric" maxLength={12} value={draft.cccd} onChange={change} placeholder="Nhập 12 chữ số" error={fields.cccd}/>
    <div className="auth-field"><label htmlFor="auth-facilityCode">Cơ sở ưu tiên <small>(không bắt buộc)</small></label><select id="auth-facilityCode" name="facilityCode" value={draft.facilityCode} onChange={change}><option value="">Không chọn cơ sở</option>{facilities.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select>{facilityError && <p className="auth-field-error" role="status">{facilityError}</p>}</div>
    <button className="auth-submit" disabled={busy}>{busy ? "Đang gửi mã xác minh…" : "Gửi mã xác minh"}<Icon>arrow_forward</Icon></button>
  </form></dialog>;
}
function AuthenticationSuccess({ email, navigationState }) {
  return <div className="auth-success-screen"><section className="auth-card auth-success-card"><div className="auth-success-check"><Icon>check</Icon></div><h1>Đăng ký thành công</h1><p>Tài khoản của bạn đã được tạo thành công. Bạn đã có thể bắt đầu sử dụng dịch vụ và quản lý kho lưu trữ thông minh.</p><div className="auth-account-summary"><div><span><Icon>mail</Icon>Tài khoản</span><strong title={email}>{email}</strong></div><div><span><Icon>verified_user</Icon>Trạng thái</span><b><i/>Đã xác minh</b></div><div><span><Icon>lock</Icon>Bảo mật tài khoản</span><em><Icon>mark_email_read</Icon>Email đã xác thực</em></div></div><div className="auth-success-actions"><Link className="auth-submit" to="/login" state={{ ...navigationState, email }}>Đăng nhập ngay<Icon>arrow_forward</Icon></Link><Link to="/"><Icon>chevron_left</Icon>Về trang chủ</Link></div><div className="auth-trust"><span><Icon>lock</Icon>Mã hóa 256-bit</span><span>•</span><span><Icon>verified</Icon>Xác thực chính chủ</span></div></section><p className="auth-success-help">Cần trợ giúp kích hoạt? Gọi ngay tổng đài <a href="tel:19006868">1900 6868</a> (24/7)</p></div>;
}
export default function AuthPage() {
  const location = useLocation(), navigate = useNavigate();
  const register = location.pathname === "/register", success = location.pathname === "/registration-success";
  const navigationState = authNavigationState(location.state);
  const [challenge, setChallenge] = useState();
  const [error, setError] = useState(""), [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false), [now, setNow] = useState(Date.now());
  const [draft, setDraft] = useState(emptyProfile), [profileOpen, setProfileOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false), [facilities, setFacilities] = useState([]), [facilityError, setFacilityError] = useState("");
  useEffect(() => { setChallenge(undefined); setError(""); setFields({}); setProfileOpen(false); setForgotOpen(false); setDraft(emptyProfile); }, [location.pathname]);
  useEffect(() => {
    if (!register) return;
    let cancelled = false;
    facilityApi.facilities().then(items => { if (!cancelled) setFacilities(items.filter(item => !item.status || String(item.status).toUpperCase() === "ACTIVE")); }).catch(cause => { if (!cancelled) setFacilityError(cause.message || "Chưa tải được danh sách cơ sở."); });
    return () => { cancelled = true; };
  }, [register]);
  useEffect(() => { if (!challenge) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [challenge]);
  const wait = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000)) : 0;
  const expired = challenge && now >= Date.parse(challenge.expiresAt);
  const change = event => { setDraft(value => ({ ...value, [event.target.name]: event.target.value })); setFields(value => ({ ...value, [event.target.name]: "" })); };
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setError(""); setFields({});
    const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
    if (register && !challenge) {
      const next = {};
      if (draft.name.trim().length < 2 || draft.name.trim().length > 50 || !/^[\p{L}\p{M}\s]+$/u.test(draft.name.trim())) next.name = "Họ và tên phải gồm 2–50 ký tự chữ.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) next.email = "Email không hợp lệ.";
      if (!/\S/u.test(draft.password) || draft.password.length < 6) next.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      if (draft.password !== draft.confirmPassword) next.confirmPassword = "Mật khẩu xác nhận không khớp.";
      if (Object.keys(next).length) { setFields(next); setError("Vui lòng kiểm tra lại thông tin đăng ký."); return; }
      setProfileOpen(true); return;
    }
    if (!challenge) {
      const next = {};
      if (!String(data.username || "").trim()) next.username = "Vui lòng nhập thông tin.";
      if (!/\S/u.test(String(data.password || ""))) next.password = "Vui lòng nhập mật khẩu.";
      if (Object.keys(next).length) { setFields(next); setError("Vui lòng nhập thông tin đăng nhập."); return; }
    }
    setBusy(true);
    try {
      if (challenge) {
        if (!/^[0-9]{6}$/.test(String(data.code || ""))) { setFields({ code: "Mã xác minh phải có 6 chữ số." }); throw new Error("Vui lòng kiểm tra mã xác minh."); }
        if (expired) throw new Error("Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.");
        const result = await identityApi.verifyOtp({ email: challenge.email, code: String(data.code) });
        if (!result.data.registered) throw new Error("Chưa thể hoàn tất đăng ký.");
        setChallenge(undefined);
        navigate("/registration-success", { replace: true, state: { ...navigationState, registered: true, email: result.data.email } });
      } else {
        const result = await identityApi.login({ username: String(data.username).trim(), password: String(data.password) });
        if (!result.token) throw new Error("Máy chủ chưa cấp phiên đăng nhập.");
        const destination = returnToForRole(navigationState, result.data.role) || landingForRole(result.data.role);
        sessionStore.set({ user: result.data, token: result.token }); form.reset(); navigate(destination, { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý yêu cầu.");
      if (!challenge && cause.status === 401) setFields({ username: "Thông tin đăng nhập không hợp lệ.", password: "Email hoặc mật khẩu không chính xác." });
    } finally { setBusy(false); }
  }
  async function completeProfile(event) {
    event.preventDefault(); if (busy) return;
    const payload = registrationPayload(draft), invalid = registrationError(payload);
    if (invalid) {
      const key = invalid.startsWith("Tên đăng nhập") ? "username" : invalid.startsWith("Số điện thoại") ? "phone" : invalid.startsWith("CCCD") ? "cccd" : invalid.startsWith("Email") ? "email" : invalid.startsWith("Họ") ? "name" : invalid.includes("xác nhận") ? "confirmPassword" : "password";
      setFields({ [key]: invalid }); setError(invalid);
      if (["name", "email", "password", "confirmPassword"].includes(key)) setProfileOpen(false);
      return;
    }
    setBusy(true); setError(""); setFields({});
    try { const response = await identityApi.sendOtp(payload); setChallenge(response.data); setNow(Date.now()); setDraft(emptyProfile); setProfileOpen(false); }
    catch (cause) { setError(cause.message || "Không gửi được mã xác minh."); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (!challenge || busy || wait > 0 || expired) return;
    setBusy(true); setError("");
    try { const result = await identityApi.resendOtp(challenge.email); setChallenge(result.data); setNow(Date.now()); }
    catch (cause) { setError(cause.message || "Không gửi lại được mã."); }
    finally { setBusy(false); }
  }
  if (success && !location.state?.registered) return <Navigate to="/register" replace/>;
  const verifyUnavailable = location.pathname === "/verify-otp" && !challenge;
  return <div className={`auth-page ${register && !challenge ? "auth-register-page" : ""}`}><AuthHeader navigationState={navigationState}/><main className="auth-main">
    {success ? <AuthenticationSuccess email={location.state.email} navigationState={navigationState}/> : <div className={`auth-screen ${register && !challenge ? "auth-register-screen" : ""}`}>
      <div className="auth-category"><span><Icon>{challenge || verifyUnavailable ? "mark_email_read" : register ? "person_add" : "lock"}</Icon>{challenge || verifyUnavailable ? "XÁC MINH TÀI KHOẢN" : register ? "TẠO TÀI KHOẢN MỚI" : "XÁC THỰC KHÁCH HÀNG"}</span></div>
      {!profileOpen && <ErrorBanner error={error} register={register}/>}
      <section className={`auth-card ${register && !challenge ? "auth-register-card" : ""}`} aria-busy={busy}>
        <header className="auth-title"><div><h1>{challenge || verifyUnavailable ? "Xác minh tài khoản" : register ? "Đăng ký tài khoản" : "Đăng nhập"}</h1><p>{challenge ? `Nhập mã đã gửi đến ${challenge.email}.` : verifyUnavailable ? "Vui lòng bắt đầu đăng ký để nhận phiên xác minh." : register ? "Tạo tài khoản để bắt đầu sử dụng dịch vụ." : "Đăng nhập để quản lý đơn đặt và kho đang thuê."}</p></div>{!register && <span><Icon>{verifyUnavailable ? "mark_email_read" : "shield_person"}</Icon></span>}</header>
        {verifyUnavailable ? <Link className="auth-submit" to="/register" state={navigationState}>Đến trang đăng ký<Icon>arrow_forward</Icon></Link> : <form className="auth-form" onSubmit={submit} noValidate>
          {challenge ? <><AuthField name="code" label="Mã xác minh" icon="pin" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="Nhập 6 chữ số" error={fields.code}/><div className="auth-information"><Icon>mail</Icon><p>Mã xác minh đã được gửi đến email của bạn. Kiểm tra cả thư rác nếu chưa thấy email.</p></div>{expired && <div className="auth-error-banner" role="alert"><Icon>timer_off</Icon><p>Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.</p></div>}</> : register ? <>
            <AuthField name="name" label="Họ và tên" icon="badge" required autoComplete="name" value={draft.name} onChange={change} placeholder="Nguyễn Văn A" error={fields.name}/>
            <AuthField name="email" label="Email" icon="alternate_email" required type="email" autoComplete="email" value={draft.email} onChange={change} placeholder="ten@example.com" error={fields.email}/>
            <AuthField name="password" label="Mật khẩu" icon="lock" password required autoComplete="new-password" value={draft.password} onChange={change} placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" error={fields.password}/>
            <AuthField name="confirmPassword" label="Xác nhận mật khẩu" icon="lock_reset" password required autoComplete="new-password" value={draft.confirmPassword} onChange={change} placeholder="Nhập lại mật khẩu" error={fields.confirmPassword}/>
          </> : <>
            <AuthField name="username" label="Email / Tài khoản" icon="mail" required autoComplete="username" defaultValue={location.state?.email || ""} placeholder="ten@example.com" error={fields.username}/>
            <AuthField name="password" label="Mật khẩu" icon="key" password required autoComplete="current-password" placeholder="••••••••" error={fields.password}/>
            <div className="auth-meta"><label><input type="checkbox" name="remember"/>Ghi nhớ đăng nhập</label><button type="button" onClick={() => setForgotOpen(!forgotOpen)}>Quên mật khẩu?</button></div>
            {forgotOpen && <div className="auth-information" role="status"><Icon>support_agent</Icon><p>Liên hệ <a href="tel:19006868">1900 6868</a> hoặc <a href="mailto:hotro@storage.vn">hotro@storage.vn</a> để được hỗ trợ khôi phục tài khoản.</p></div>}
          </>}
          <button type="submit" className="auth-submit" disabled={busy || Boolean(expired)}>{busy ? challenge ? "Đang xác minh…" : "Đang xác thực…" : challenge ? "Xác minh" : register ? "Đăng ký" : "Đăng nhập"}<Icon>{busy ? "progress_activity" : "arrow_forward"}</Icon></button>
          {challenge && <button className="auth-resend" type="button" disabled={busy || wait > 0 || expired} onClick={resend}>{wait > 0 ? `Gửi lại mã sau ${wait}s` : "Gửi lại mã"}</button>}
        </form>}
        {!register && !verifyUnavailable && <div className="auth-guarantee"><Icon>verified_user</Icon><p>Dữ liệu kết nối được mã hóa TLS 1.3 bảo mật chuẩn ngân hàng.</p></div>}
        {!verifyUnavailable && <div className="auth-transition">{challenge ? <button type="button" onClick={() => { setChallenge(undefined); setError(""); setFields({}); }} disabled={busy}>Đăng ký lại</button> : <>{register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}<Link to={register ? "/login" : "/register"} state={navigationState}>{register ? "Đăng nhập" : "Đăng ký"}</Link></>}</div>}
      </section>
      {register && !challenge ? <div className="auth-assurances">{[["shield", "Bảo mật cao"], ["bolt", "Kích hoạt nhanh"], ["lock_clock", "Truy cập 24/7"]].map(([icon, title]) => <span key={title}><Icon>{icon}</Icon><strong>{title}</strong></span>)}</div> : <div className="auth-help"><a href="tel:19006868"><Icon>support_agent</Icon>Tổng đài: 1900 6868</a><span>•</span><Link to="/#rental-terms">Điều khoản dịch vụ</Link></div>}
    </div>}
  </main><PublicFooter/>{profileOpen && <ProfileDialog draft={draft} setDraft={setDraft} facilities={facilities} facilityError={facilityError} fields={fields} error={error} busy={busy} onClose={() => { if (!busy) setProfileOpen(false); }} onSubmit={completeProfile}/>}</div>;
}
