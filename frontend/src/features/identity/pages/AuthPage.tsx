import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { identityApi } from "../api/identity.api";
import { sessionStore } from "../session";
import type { Row } from "../../../shared/types/api";
export default function AuthPage() {
  const location = useLocation(),
    navigate = useNavigate();
  const register = location.pathname === "/register";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<Row>(),
    [demoCode, setDemoCode] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      if (register && !pending) {
        const r = await identityApi.sendOtp(data);
        setPending(data);
        setDemoCode(String(r.code ?? r.data?.code ?? ""));
      } else {
        const r = pending
          ? await identityApi.verifyOtp({
              email: pending.email,
              code: data.code,
            })
          : await identityApi.login(data);
        if (!r.token)
          throw new Error("Máy chủ chưa cấp phiên đăng nhập hợp lệ.");
        sessionStore.set({ user: r.data, token: r.token });
        navigate("/");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Link to="/" className="brand">
        ▦ STORAGE
      </Link>
      <section className="card auth-card">
        <span className="eyebrow">KHO LƯU TRỮ TỰ PHỤC VỤ</span>
        <h1>
          {pending
            ? "Xác minh tài khoản"
            : register
              ? "Tạo tài khoản"
              : "Chào mừng trở lại"}
        </h1>
        <p>
          {pending
            ? "Nhập mã xác minh để hoàn tất đăng ký."
            : "Quản lý không gian lưu trữ của bạn tại một nơi."}
        </p>
        <form onSubmit={submit} className="form-grid">
          {pending ? (
            <>
              <label>
                Mã xác minh
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </label>
              {demoCode && <p className="notice">OTP mô phỏng: {demoCode}</p>}
            </>
          ) : (
            <>
              {register && (
                <>
                  <label>
                    Họ và tên
                    <input name="name" required />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" required />
                  </label>
                  <label>
                    Số điện thoại
                    <input name="phone" required />
                  </label>
                  <label>
                    CCCD
                    <input name="cccd" required />
                  </label>
                  <label>
                    Ngày sinh
                    <input name="dob" type="date" required />
                  </label>
                  <label>
                    Giới tính
                    <select name="gender">
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </select>
                  </label>
                </>
              )}
              <label>
                Tên đăng nhập
                <input name="username" autoComplete="username" required />
              </label>
              <label>
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                />
              </label>
              {register && (
                <label>
                  Nhập lại mật khẩu
                  <input name="confirmPassword" type="password" required />
                </label>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button disabled={busy}>
            {busy
              ? "Đang xử lý…"
              : pending
                ? "Xác minh"
                : register
                  ? "Đăng ký"
                  : "Đăng nhập"}
          </button>
        </form>
        <p>
          {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <Link
            to={register ? "/login" : "/register"}
            onClick={() => {
              setPending(undefined);
              setError("");
            }}
          >
            {register ? "Đăng nhập" : "Đăng ký ngay"}
          </Link>
        </p>
      </section>
    </main>
  );
}
