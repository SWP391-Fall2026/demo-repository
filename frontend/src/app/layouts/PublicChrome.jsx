import { Link, NavLink, useLocation } from "react-router-dom";
import { useSession, sessionStore } from "../../features/identity/session";
import brandLogo from "../../assets/images/landing/brand-logo.png";
import "./public-chrome.css";

function Symbol({ children }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

export function PublicHeader({ auth = false, navigationState }) {
  const session = useSession();
  const location = useLocation();
  const catalog = location.pathname === "/storage";
  const accountName = session?.user?.name || session?.user?.username;
  const links = [["/", "Trang chủ"], ["/storage", "Kho lưu trữ"]];
  if (!catalog) links.push(["/reservations", "Đơn đặt của tôi"]);
  if (location.pathname.startsWith("/rentals") || location.pathname.startsWith("/support") || location.pathname.startsWith("/storage/")) links.push(["/rentals", "Kho đang thuê"]);
  if (location.pathname.startsWith("/support") || location.pathname.startsWith("/storage/")) links.push(["/support", "Hỗ trợ"]);

  return <header className={`public-header ${auth ? "public-header-auth" : ""} ${catalog ? "public-header-catalog" : ""}`}>
    <div className="public-header-inner">
      <Link className="public-brand" to="/" aria-label="Storage — Trang chủ"><img src={brandLogo} alt=""/><span><strong>STORAGE</strong><small>{auth || catalog ? "Kho Gọn - Hệ thống kho tự quản" : "Kho tự quản"}</small></span></Link>
      {!auth && <nav className="public-navigation" aria-label="Điều hướng chính">{links.map(([to, title]) => <NavLink key={to} to={to} end={to === "/"}>{title}</NavLink>)}<Link to="/rental-terms">Điều kiện thuê</Link><Link to="/#privacy-policy">Chính sách bảo mật</Link></nav>}
      <div className="public-account">
        {session && !auth ? <details className="public-account-menu"><summary><span className="public-account-name"><strong>{accountName}</strong><small>{session.user.username}</small></span><span className="public-avatar"><Symbol>person</Symbol></span></summary><nav aria-label="Tài khoản"><Link to="/reservations">Đơn đặt của tôi</Link><Link to="/rentals">Kho đang thuê</Link><Link to="/support">Yêu cầu hỗ trợ</Link><Link to="/invoices/all/pay">Thanh toán</Link><Link to="/reservations/all/pass">Thẻ check-in & bàn giao</Link><Link to="/rentals/access">Nhập PIN truy cập</Link><Link to="/handover-reviews">Yêu cầu bàn giao</Link><Link to="/refunds">Hoàn tiền của tôi</Link><button type="button" onClick={() => sessionStore.set(null)}><Symbol>logout</Symbol>Đăng xuất</button></nav></details> : <><Link className="public-login" to="/login" state={navigationState}>Đăng nhập</Link><Link className="public-register" to="/register" state={navigationState}>Đăng ký</Link><Link className="public-avatar" to="/login" state={navigationState} aria-label="Đăng nhập tài khoản"><Symbol>person</Symbol></Link></>}
      </div>
    </div>
  </header>;
}

export function PublicFooter() {
  return <footer className="public-footer"><div className="public-footer-inner">
    <div className="public-footer-grid">
      <div className="public-footer-about"><Link className="public-brand" to="/"><img src={brandLogo} alt=""/><span><strong>STORAGE</strong><small>Kho Gọn Thông Minh</small></span></Link><p>Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ an toàn, linh hoạt và tiện lợi hàng đầu Việt Nam.</p><div className="public-footer-badges"><span><Symbol>verified_user</Symbol>Bảo an 24/7</span><span><Symbol>thermostat</Symbol>Kiểm soát nhiệt độ</span><span><Symbol>lock</Symbol>Khóa số bảo mật</span></div></div>
      <div><h2>Hệ thống</h2><Link to="/">Trang chủ</Link><Link to="/storage">Kho lưu trữ</Link><Link to="/#pricing">Bảng giá dịch vụ</Link><Link to="/login">Đăng nhập tài khoản</Link></div>
      <div><h2>Chính sách &amp; Pháp lý</h2><Link to="/rental-terms">Điều khoản sử dụng</Link><Link to="/#privacy-policy">Chính sách bảo mật</Link><span>Quy định lưu trữ</span><span>Bảo hiểm tài sản</span></div>
      <div className="public-footer-contact"><h2>Hỗ trợ &amp; Liên hệ</h2><a href="tel:19006868"><Symbol>call</Symbol><span>Hotline: <strong>1900 6868</strong></span></a><a href="mailto:hotro@storage.vn"><Symbol>mail</Symbol><span>Email: hotro@storage.vn</span></a><span><Symbol>schedule</Symbol><span>08:00 - 20:00 hàng ngày (Cả T7 &amp; CN)</span></span></div>
    </div>
    <div className="public-footer-bottom"><span>© 2025 Storage. All rights reserved.</span><span>Cơ sở chính: KCN Tân Bình, TP. Hồ Chí Minh | Chi nhánh Cầu Giấy, Hà Nội</span></div>
  </div></footer>;
}
