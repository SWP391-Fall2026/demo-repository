import { Link } from "react-router-dom";
import { useMemo } from "react";
import tanBinh from "../../../assets/images/landing/tan-binh.jpg";
import quan7 from "../../../assets/images/landing/quan-7.jpg";
import cauGiay from "../../../assets/images/landing/cau-giay.jpg";
import heroStorage from "../../../assets/images/landing/gallery.jpg";
import { facilityApi } from "../api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { money } from "../../../shared/lib/format";
import "./LandingCatalogSections.css";

const PLANS = [
  {
    type: "S",
    label: "Gói nhỏ",
    volume: "Thể tích ~4 - 7m³",
    title: "Kho S (Kích thước nhỏ)",
    area: "Diện tích ~1.5m² - 3m²",
    description: "Vali du lịch, tài liệu, thùng carton, đồ dùng cá nhân.",
  },
  {
    type: "M",
    label: "Gói tiêu chuẩn",
    volume: "Thể tích ~10 - 20m³",
    title: "Kho M (Kích thước vừa)",
    area: "Diện tích ~4m² - 8m²",
    description:
      "Đồ nội thất căn hộ 1-2 phòng ngủ, thiết bị gia dụng, hàng hóa kinh doanh online.",
    featured: true,
  },
  {
    type: "L",
    label: "Gói mở rộng",
    volume: "Thể tích ~25 - 50m³",
    title: "Kho L (Kích thước lớn)",
    area: "Diện tích ~10m² - 20m²",
    description:
      "Toàn bộ nội thất nhà phố, hàng tồn kho doanh nghiệp, thiết bị văn phòng.",
  },
  {
    type: "CLIMATE",
    label: "Gói kho mát",
    volume: "Kiểm soát nhiệt độ",
    title: "Kho CLIMATE (Kho mát)",
    area: "Diện tích ~8m²",
    description:
      "Tài liệu, thiết bị điện tử và hàng hóa cần môi trường lưu trữ ổn định.",
  },
];

const facilityPhotos = { "HCM-TB": tanBinh, "HCM-Q7": quan7, "HN-CG": cauGiay };

function Icon({ children }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {children}
    </span>
  );
}

export function LandingPricing() {
  const remote = useRemote(() => facilityApi.units({}));
  const units = Array.isArray(remote.data) ? remote.data : [];
  return (
    <section
      id="pricing"
      className="landing-section landing-pricing"
      aria-labelledby="landing-pricing-title"
    >
      <div className="landing-section-heading">
        <span className="landing-eyebrow">Phân loại &amp; Định giá</span>
        <h2 id="landing-pricing-title">Các loại kho lưu trữ</h2>
        <p>Bảng giá niêm yết tham khảo công khai, không chi phí ẩn.</p>
      </div>
      {remote.error && <p role="status" className="landing-data-message">Không tải được bảng giá trực tiếp từ hệ thống.</p>}
      <div className="landing-pricing-grid">
        {PLANS.map((plan) => {
          const rows = units.filter((unit) => String(unit.type).toUpperCase() === plan.type);
          const prices = rows.map((unit) => Number(unit.pricePerMonth)).filter(Number.isFinite);
          const price = prices.length ? money(Math.min(...prices)) : remote.busy ? "Đang tải…" : "Liên hệ";
          return (
          <article
            className={`landing-pricing-card${plan.featured ? " is-featured" : ""}`}
            key={plan.type}
          >
            {plan.featured && (
              <span className="landing-featured-label">Được chọn nhiều</span>
            )}
            <div className="landing-pricing-card-head">
              <span className="landing-chip">{plan.label}</span>
              <span className="landing-card-volume">{plan.volume}</span>
            </div>
            <h3>{plan.title}</h3>
            <p className="landing-card-area">{plan.area}</p>
            <div className="landing-pricing-note">
              <p>Phù hợp nhu cầu:</p>
              <p>{plan.description}</p>
            </div>
            <div className="landing-pricing-card-footer">
              <div className="landing-price">
                <strong>{price}</strong>
                <span>/ tháng</span>
              </div>
              <small>{rows.length} kho đang có thể đặt trên toàn hệ thống</small>
              <Link
                className={`landing-button${plan.featured ? " primary" : " secondary"}`}
                to={`/storage?type=${plan.type}`}
              >
                Xem kho
              </Link>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

export function LandingFacilities() {
  const facilitiesRemote = useRemote(facilityApi.facilities);
  const unitsRemote = useRemote(() => facilityApi.units({}));
  const facilities = Array.isArray(facilitiesRemote.data) ? facilitiesRemote.data.filter((facility) => !facility.status || String(facility.status).toUpperCase() === "ACTIVE") : [];
  const units = Array.isArray(unitsRemote.data) ? unitsRemote.data : [];
  const unitsByFacility = useMemo(() => units.reduce((result, unit) => {
    const key = unit.facilityCode;
    if (key) result[key] = (result[key] || 0) + 1;
    return result;
  }, {}), [units]);
  return (
    <section
      id="locations"
      className="landing-section landing-facilities"
      aria-labelledby="landing-facilities-title"
    >
      <div className="landing-section-heading">
        <span className="landing-eyebrow">Mạng lưới cơ sở</span>
        <h2 id="landing-facilities-title">Địa điểm lưu trữ</h2>
        <p>Hệ thống kho tại các vị trí trung tâm, đường xe tải thuận tiện.</p>
      </div>
      {(facilitiesRemote.error || unitsRemote.error) && <p role="status" className="landing-data-message">Không tải được danh sách cơ sở trực tiếp từ hệ thống.</p>}
      <div className="landing-facilities-grid">
        {facilities.map((facility) => (
          <article className="landing-facility-card" key={facility.code}>
            <div className="landing-facility-image">
              <img
                src={facilityPhotos[facility.code] || heroStorage}
                alt={`Hình ảnh ${facility.name}`}
                loading="lazy"
                width="768"
                height="768"
              />
              <span className="landing-city-badge">{facility.city}</span>
            </div>
            <div className="landing-facility-body">
              <h3>{facility.name}</h3>
              <p className="landing-facility-address">
                <Icon>pin_drop</Icon>
                {facility.address}
              </p>
              <ul className="landing-facility-facts">
                {[
                  `${facility.totalUnits ?? 0} kho thuộc cơ sở`,
                  `${unitsByFacility[facility.code] ?? 0} kho đang có thể đặt`,
                  facility.hotline ? `Hotline: ${facility.hotline}` : "Thông tin liên hệ cập nhật theo hệ thống",
                ].map((feature) => (
                  <li key={feature}>
                    <Icon>check</Icon>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                className="landing-button secondary"
                to={`/storage?facility=${facility.code}`}
              >
                Xem kho
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
