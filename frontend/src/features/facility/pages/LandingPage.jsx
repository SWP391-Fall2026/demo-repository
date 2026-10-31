import { Link } from "react-router-dom";
import { useSession } from "../../identity/session";
import { landingForRole } from "../../identity/lib/auth-navigation";
import {
  LandingPricing,
  LandingFacilities,
} from "../components/LandingCatalogSections";
import {
  LandingGallery,
  LandingCta,
  LandingFooter,
} from "../components/LandingPresentationSections";
import heroStorage from "../../../assets/images/landing/gallery.jpg";
import brandLogo from "../../../assets/images/landing/brand-logo.png";
import "../components/landing.css";

const benefits = [
  [
    "grid_view",
    "Nhiều kích thước kho",
    "Đa dạng kích cỡ từ tủ đồ mini, kho cá nhân đến kho lưu trữ vật dụng gia đình và doanh nghiệp vừa.",
  ],
  [
    "local_shipping",
    "Vị trí thuận tiện",
    "Nằm tại các trục đường giao thông trọng điểm, xe tải và xe bán tải dễ dàng tiếp cận tận cửa sảnh.",
  ],
  [
    "fact_check",
    "Quy trình đặt kho rõ ràng",
    "Đặt chỗ trực tuyến minh bạch, hiển thị diện tích và giá niêm yết rõ ràng từng kho.",
  ],
  [
    "receipt_long",
    "Theo dõi kho thuê dễ dàng",
    "Xem thông tin hợp đồng thuê, ngày gia hạn và lịch sử thanh toán trên cổng khách hàng.",
  ],
];
const steps = [
  [
    "search",
    "Tìm kho",
    "Chọn loại kho, diện tích và chi nhánh kho phù hợp nhu cầu.",
  ],
  [
    "calendar_today",
    "Đặt giữ chỗ",
    "Đăng ký giữ chỗ kho trực tuyến với thông tin thời gian thuê dự kiến.",
  ],
  [
    "payments",
    "Thanh toán tiền cọc",
    "Hoàn tất xác nhận đơn đặt bằng thanh toán tiền cọc theo quy định.",
  ],
  [
    "vpn_key",
    "Nhận bàn giao",
    "Đến chi nhánh nhận bàn giao chìa khóa/mã mở kho và bắt đầu sử dụng.",
  ],
];
const metrics = [
  ["badge", "Kiểm soát", "Ra vào cá nhân hóa"],
  ["air", "Không gian", "Khô ráo thông thoáng"],
  ["aspect_ratio", "Kích thước", "Linh hoạt theo nhu cầu"],
];

function Icon({ children }) {
  return (
    <span aria-hidden="true" className="material-symbols-outlined">
      {children}
    </span>
  );
}

export default function LandingPage() {
  const session = useSession();
  const accountPath = session ? landingForRole(session.user.role) : "/login";

  return (
    <div className="landing-page" id="top">
      <a className="landing-skip" href="#landing-content">
        Đến nội dung chính
      </a>
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link className="landing-brand" to="/" aria-label="STORAGE trang chủ">
            <img
              className="landing-logo"
              src={brandLogo}
              alt="Storage Brand Logo"
            />
            <span>
              <strong>STORAGE</strong>
              <small>Kho Gọn - Hệ Thống Kho Tự Quản</small>
            </span>
          </Link>
          <nav className="landing-nav" aria-label="Điều hướng chính">
            <a className="active" href="#top" aria-current="page">
              Trang chủ
            </a>
            <Link to="/storage">Kho lưu trữ</Link>
            <Link to="/reservations">Đơn đặt của tôi</Link>
            <Link to="/rental-terms">Điều kiện thuê</Link>
            <Link to="/privacy-policy">Chính sách bảo mật</Link>
          </nav>
          <div className="landing-auth-actions">
            {session ? (
              <Link className="landing-register" to={accountPath}>
                Vào tài khoản
              </Link>
            ) : (
              <>
                <Link className="landing-login" to="/login">
                  Đăng nhập
                </Link>
                <Link className="landing-register" to="/register">
                  Đăng ký
                </Link>
              </>
            )}
            <Link
              className="landing-user"
              to={accountPath}
              aria-label={session ? "Mở tài khoản" : "Đăng nhập tài khoản"}
            >
              <Icon>person</Icon>
            </Link>
          </div>
        </div>
      </header>

      <main id="landing-content" className="landing-container">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <span className="landing-pill">
              <i />
              Dịch vụ kho tự quản tiêu chuẩn
            </span>
            <h1 id="landing-title">
              Kho lưu trữ tự phục vụ an toàn và linh hoạt
            </h1>
            <p>
              Giúp bạn dễ dàng tìm kho phù hợp nhu cầu, đặt giữ chỗ trực tuyến
              nhanh chóng, thanh toán tiền cọc minh bạch và chủ động quản lý kho
              thuê tự phục vụ.
            </p>
            <div className="landing-actions">
              <Link className="landing-button primary" to="/storage">
                Tìm kho lưu trữ<Icon>arrow_forward</Icon>
              </Link>
              <Link className="landing-button secondary" to={accountPath}>
                {session ? "Vào tài khoản" : "Đăng nhập"}
              </Link>
            </div>
            <div className="landing-metrics">
              {metrics.map(([icon, title, text]) => (
                <div key={title} className="landing-metric">
                  <Icon>{icon}</Icon>
                  <div>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-hero-visual">
            <img
              src={heroStorage}
              alt="Hành lang kho tự quản với dãy cửa cuốn và lối đi rộng rãi"
              fetchPriority="high"
              width="768"
              height="768"
            />
            <div className="landing-hero-gradient" />
            <div className="landing-telemetry">
              <span className="telemetry-dot" />
              <div>
                <strong>Hành lang kho Aisle 04</strong>
                <small>Hệ thống giám sát và chiếu sáng tự động</small>
              </div>
              <b>
                <Icon>verified</Icon>Đạt chuẩn
              </b>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="benefits-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Ưu thế dịch vụ</span>
            <h2 id="benefits-title">Trải nghiệm lưu trữ bài bản và tiện ích</h2>
            <p>
              Được thiết kế nhằm tối ưu hóa sự thuận tiện cho việc lưu giữ đồ
              gia đình lẫn hàng hoá kinh doanh.
            </p>
          </div>
          <div className="landing-benefit-grid">
            {benefits.map(([icon, title, text]) => (
              <article className="landing-card landing-benefit" key={title}>
                <span className="landing-icon-box">
                  <Icon>{icon}</Icon>
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <LandingPricing />

        <section
          id="process"
          className="landing-section landing-process"
          aria-labelledby="process-title"
        >
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Lộ trình sử dụng</span>
            <h2 id="process-title">Quy trình thuê kho</h2>
            <p>
              4 bước trực quan để bắt đầu thuê và sử dụng kho lưu trữ tự phục
              vụ.
            </p>
          </div>
          <ol className="landing-step-grid">
            {steps.map(([icon, title, text], index) => (
              <li key={title}>
                <div className="landing-step-symbol">
                  <span className="landing-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="landing-step-icon">
                    <Icon>{icon}</Icon>
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <LandingFacilities />
        <LandingGallery />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
