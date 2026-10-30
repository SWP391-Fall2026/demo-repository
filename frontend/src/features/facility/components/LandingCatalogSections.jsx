import { Link } from "react-router-dom";
import tanBinh from "../../../assets/images/landing/tan-binh.jpg";
import quan7 from "../../../assets/images/landing/quan-7.jpg";
import cauGiay from "../../../assets/images/landing/cau-giay.jpg";
import "./LandingCatalogSections.css";

// Reference prices describe plans; the linked catalog shows current offers.
const PLANS = [
  {
    type: "S",
    label: "Gói nhỏ",
    volume: "Thể tích ~4 - 7m³",
    title: "Kho S (Kích thước nhỏ)",
    area: "Diện tích ~1.5m² - 3m²",
    description: "Vali du lịch, tài liệu, thùng carton, đồ dùng cá nhân.",
    price: "650.000 đ",
  },
  {
    type: "M",
    label: "Gói tiêu chuẩn",
    volume: "Thể tích ~10 - 20m³",
    title: "Kho M (Kích thước vừa)",
    area: "Diện tích ~4m² - 8m²",
    description:
      "Đồ nội thất căn hộ 1-2 phòng ngủ, thiết bị gia dụng, hàng hóa kinh doanh online.",
    price: "1.450.000 đ",
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
    price: "2.800.000 đ",
  },
];

const FACILITIES = [
  {
    code: "HCM-TB",
    city: "TP. Hồ Chí Minh",
    name: "Cơ sở Tân Bình - TP. Hồ Chí Minh",
    address: "Khu Công Nghiệp Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM",
    photo: tanBinh,
    photoAlt:
      "Cơ sở kho Tân Bình với sân bãi xe tải rộng rãi và cửa cuốn màu cam",
    features: [
      "Sảnh đỗ xe tải rộng, tiếp cận tận cửa sảnh",
      "Thang máy nâng hàng tải trọng lớn",
      "Camera giám sát khu vực chung",
    ],
  },
  {
    code: "HCM-Q7",
    city: "TP. Hồ Chí Minh",
    name: "Cơ sở Quận 7 - TP. Hồ Chí Minh",
    address: "Đường Nguyễn Thị Thập, P. Tân Phong, Quận 7, TP.HCM",
    photo: quan7,
    photoAlt: "Khu kho Quận 7 với hệ thống điều hòa và dãy cửa cuốn xanh dương",
    features: [
      "Kho mát bảo quản tài liệu & thiết bị",
      "Xe trung chuyển ra vào thuận lợi",
      "Cảm biến kiểm soát độ ẩm phòng kho",
    ],
  },
  {
    code: "HN-CG",
    city: "Hà Nội",
    name: "Cơ sở Cầu Giấy - Hà Nội",
    address: "Đường Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội",
    photo: cauGiay,
    photoAlt:
      "Cơ sở Cầu Giấy với lối đi thông thoáng và cửa kho đánh số rõ ràng",
    features: [
      "Tiếp giáp các tòa nhà văn phòng trung tâm",
      "Khu lưu trữ sạch sẽ, thông thoáng",
      "Xe đẩy hàng sẵn có phục vụ miễn phí",
    ],
  },
];

function Icon({ children }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      {children}
    </span>
  );
}

export function LandingPricing() {
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
      <div className="landing-pricing-grid">
        {PLANS.map((plan) => (
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
                <strong>{plan.price}</strong>
                <span>/ tháng</span>
              </div>
              <Link
                className={`landing-button${plan.featured ? " primary" : " secondary"}`}
                to={`/storage?type=${plan.type}`}
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

export function LandingFacilities() {
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
      <div className="landing-facilities-grid">
        {FACILITIES.map((facility) => (
          <article className="landing-facility-card" key={facility.code}>
            <div className="landing-facility-image">
              <img
                src={facility.photo}
                alt={facility.photoAlt}
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
                {facility.features.map((feature) => (
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
