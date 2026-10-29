import { Link } from "react-router-dom";
import { useSession } from "../../identity/session";
import { landingForRole } from "../../identity/lib/auth-navigation";
import gallery from "../../../assets/images/landing/gallery.jpg";
import brandLogo from "../../../assets/images/landing/brand-logo.png";
import "./LandingPresentationSections.css";

function Icon({ children }) {
  return (
    <span aria-hidden="true" className="material-symbols-outlined">
      {children}
    </span>
  );
}

export function LandingGallery() {
  return (
    <section
      className="landing-presentation-section landing-presentation-gallery"
      aria-labelledby="landing-gallery-title"
    >
      <div className="landing-presentation-heading">
        <span className="landing-presentation-eyebrow">CƠ SỞ VẬT CHẤT</span>
        <h2 id="landing-gallery-title">
          Không gian lưu trữ tiêu chuẩn &amp; ngăn nắp
        </h2>
        <p>
          Hình ảnh thực tế ghi nhận từ hệ thống kho tự quản chuẩn quy hoạch.
        </p>
      </div>
      <div className="landing-presentation-gallery-grid">
        <article className="landing-presentation-gallery-feature">
          <img
            src={gallery}
            loading="lazy"
            alt="Hành lang lưu trữ rộng rãi và sạch sẽ với hai dãy cửa cuốn màu cam và xanh dương ngăn nắp"
          />
          <div className="landing-presentation-gallery-overlay" />
          <div className="landing-presentation-gallery-copy">
            <span className="landing-presentation-gallery-label">
              <Icon>verified</Icon>Thực tế tại cơ sở
            </span>
            <h3>Môi trường kho sạch sẽ</h3>
            <p>
              Lối đi rộng rãi, sàn bê tông đánh bóng công nghiệp, hệ thống đèn
              LED chiếu sáng đầy đủ và kiểm soát bụi bẩn định kỳ.
            </p>
          </div>
        </article>
        <div className="landing-presentation-gallery-stacks">
          <article className="landing-presentation-feature-card">
            <div className="landing-presentation-feature-content">
              <span className="landing-presentation-icon-box">
                <Icon>tag</Icon>
              </span>
              <div>
                <h3>Đa dạng kích thước kho</h3>
                <p>
                  Từng dãy kho có khóa cửa cuốn chuyên dụng, đánh số định danh
                  rõ ràng, vách ngăn chống cháy bền chắc và độ an toàn cao.
                </p>
              </div>
            </div>
            <div className="landing-presentation-feature-meta">
              <span>
                <Icon>lock</Icon>Khóa riêng biệt
              </span>
              <span>
                <Icon>numbers</Icon>Mã kho định danh
              </span>
            </div>
          </article>
          <article className="landing-presentation-feature-card">
            <div className="landing-presentation-feature-content">
              <span className="landing-presentation-icon-box">
                <Icon>inventory_2</Icon>
              </span>
              <div>
                <h3>Cơ sở vận hành ngăn nắp</h3>
                <p>
                  Sắp xếp phân khu khoa học, xe đẩy hỗ trợ bốc xếp hàng hóa tại
                  sảnh giúp khách hàng chuyển đồ thuận tiện và nhanh chóng.
                </p>
              </div>
            </div>
            <div className="landing-presentation-feature-meta">
              <span>
                <Icon>shopping_cart</Icon>Xe đẩy miễn phí
              </span>
              <span>
                <Icon>meeting_room</Icon>Sảnh xuất nhập đồ
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  const session = useSession();
  const accountPath = session ? landingForRole(session.user.role) : "/login";
  const accountLabel = session ? "Vào tài khoản" : "Đăng nhập";
  return (
    <section
      className="landing-presentation-cta-section"
      aria-labelledby="landing-cta-title"
    >
      <div className="landing-presentation-cta">
        <div className="landing-presentation-cta-copy">
          <span className="landing-presentation-cta-label">
            ĐẶT KHO TRỰC TUYẾN TIỆN LỢI
          </span>
          <h2 id="landing-cta-title">Sẵn sàng tìm kho phù hợp?</h2>
          <p>
            Khám phá ngay các kho lưu trữ còn trống tại chi nhánh gần bạn nhất
            hoặc liên hệ đội ngũ để được hướng dẫn chi tiết.
          </p>
        </div>
        <div className="landing-presentation-cta-actions">
          <Link
            className="landing-presentation-button landing-presentation-button-primary"
            to="/storage"
          >
            Tìm kho lưu trữ <Icon>arrow_forward</Icon>
          </Link>
          <Link
            className="landing-presentation-button landing-presentation-button-light"
            to={accountPath}
          >
            {accountLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const session = useSession();
  const accountPath = session ? landingForRole(session.user.role) : "/login";
  const accountLabel = session ? "Vào tài khoản" : "Đăng nhập tài khoản";
  return (
    <footer id="footer" className="landing-presentation-footer">
      <div className="landing-presentation-container">
        <div className="landing-presentation-footer-grid">
          <div className="landing-presentation-footer-about">
            <a
              className="landing-presentation-footer-brand"
              href="#top"
              aria-label="STORAGE trang chủ"
            >
              <img
                className="landing-presentation-footer-logo"
                src={brandLogo}
                alt="Storage Brand Logo"
              />
              <span>
                <strong>STORAGE</strong>
                <small>Kho Gọn Thông Minh</small>
              </span>
            </a>
            <p>
              Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ an toàn, linh
              hoạt và tiện lợi hàng đầu Việt Nam.
            </p>
            <div className="landing-presentation-footer-badges">
              <span>
                <Icon>verified_user</Icon>Bảo an 24/7
              </span>
              <span>
                <Icon>thermostat</Icon>Kiểm soát nhiệt độ
              </span>
              <span>
                <Icon>lock</Icon>Khóa số bảo mật
              </span>
            </div>
          </div>
          <div>
            <h3>Hệ thống</h3>
            <Link to="/">Trang chủ</Link>
            <Link to="/storage">Kho lưu trữ</Link>
            <a href="#pricing">Bảng giá dịch vụ</a>
            <Link to={accountPath}>{accountLabel}</Link>
          </div>
          <div>
            <h3>Chính sách &amp; Pháp lý</h3>
            <span id="rental-terms">Điều khoản sử dụng</span>
            <span id="privacy-policy">Chính sách bảo mật</span>
            <span>Quy định lưu trữ</span>
            <span>Bảo hiểm tài sản</span>
          </div>
          <div>
            <h3>Hỗ trợ &amp; Liên hệ</h3>
            <a href="tel:19006868">
              <Icon>call</Icon>
              <span>
                Hotline: <strong>1900 6868</strong>
              </span>
            </a>
            <a href="mailto:hotro@storage.vn">
              <Icon>mail</Icon>
              <span>Email: hotro@storage.vn</span>
            </a>
            <span>
              <Icon>schedule</Icon>
              <span>08:00 - 20:00 hàng ngày (Cả T7 &amp; CN)</span>
            </span>
          </div>
        </div>
        <div className="landing-presentation-footer-bottom">
          <span>© 2025 Storage. All rights reserved.</span>
          <span>
            Cơ sở chính: KCN Tân Bình, TP. Hồ Chí Minh | Chi nhánh Cầu Giấy, Hà
            Nội
          </span>
        </div>
      </div>
    </footer>
  );
}
