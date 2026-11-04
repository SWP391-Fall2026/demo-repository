import { Link } from "react-router-dom";
import hero from "../../../assets/images/hero_storage.jpg";
import cleanHallway from "../../../assets/images/facility_clean.jpg";
import tanBinhImg from "../../../assets/images/facility_tan_binh.jpg";
import quan7Img from "../../../assets/images/facility_quan_7.jpg";
import cauGiayImg from "../../../assets/images/facility_cau_giay.jpg";

export default function LandingPage() {
    return (
        <div className="landing-page-container">
            {/* 1. HERO SECTION */}
            <section className="figma-hero">
                <div className="figma-hero-content">
                    <div className="figma-pill-badge">
                        <span className="dot">●</span> DỊCH VỤ KHO TỰ QUẢN TIÊU CHUẨN
                    </div>
                    <h1 className="figma-hero-title">
                        Kho lưu trữ tự phục vụ an toàn và linh hoạt
                    </h1>
                    <p className="figma-hero-desc">
                        Giúp bạn dễ dàng tìm kho phù hợp nhu cầu, đặt giữ chỗ trực tuyến nhanh chóng,
                        thanh toán tiền cọc minh bạch và chủ động quản lý kho thuê tự phục vụ.
                    </p>
                    <div className="figma-hero-actions">
                        <Link className="figma-btn figma-btn-primary" to="/storage">
                            Tìm kho lưu trữ →
                        </Link>
                        <Link className="figma-btn figma-btn-outline" to="/login">
                            Đăng nhập
                        </Link>
                    </div>

                    <div className="figma-hero-pills">
                        <div className="figma-feature-pill">
                            <span className="pill-icon">🔐</span>
                            <div className="pill-text">
                                <small>Kiểm soát</small>
                                <strong>Ra vào cá nhân hóa</strong>
                            </div>
                        </div>
                        <div className="figma-feature-pill">
                            <span className="pill-icon">❄️</span>
                            <div className="pill-text">
                                <small>Không gian</small>
                                <strong>Khô ráo thông thoáng</strong>
                            </div>
                        </div>
                        <div className="figma-feature-pill">
                            <span className="pill-icon">📐</span>
                            <div className="pill-text">
                                <small>Kích thước</small>
                                <strong>Linh hoạt theo nhu cầu</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="figma-hero-media">
                    <div className="media-wrapper">
                        <img
                            src={hero}
                            alt="Hành lang hệ thống kho lưu trữ tự quản tiêu chuẩn"
                            className="hero-image"
                        />
                        <div className="hero-caption-card">
                            <div className="caption-text">
                                <span className="status-dot">●</span>
                                <div>
                                    <strong>Hành lang kho Aisle 04</strong>
                                    <small>Hệ thống giám sát và chiếu sáng tự động</small>
                                </div>
                            </div>
                            <span className="verified-badge">✓ Đạt chuẩn</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. SECTION: ƯU THẾ DỊCH VỤ */}
            <section className="figma-section text-center">
                <div className="figma-pill-badge center">
                    ƯU THẾ DỊCH VỤ
                </div>
                <h2 className="figma-section-title">
                    Trải nghiệm lưu trữ bài bản và tiện ích
                </h2>
                <p className="figma-section-desc">
                    Được thiết kế nhằm tối ưu hóa sự thuận tiện cho việc lưu giữ đồ gia đình lẫn hàng hoá kinh doanh.
                </p>

                <div className="figma-grid-4">
                    <div className="figma-card service-card">
                        <div className="card-icon-box">▦</div>
                        <h3>Nhiều kích thước kho</h3>
                        <p>
                            Đa dạng kích cỡ từ tủ đồ mini, kho cá nhân đến kho lưu trữ vật dụng gia đình và doanh nghiệp vừa.
                        </p>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">🚚</div>
                        <h3>Vị trí thuận tiện</h3>
                        <p>
                            Nằm tại các trục đường giao thông trọng điểm, xe tải và xe bán tải dễ dàng tiếp cận tận cửa sảnh.
                        </p>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">📋</div>
                        <h3>Quy trình đặt kho rõ ràng</h3>
                        <p>
                            Đặt chỗ trực tuyến minh bạch, hiển thị diện tích và giá niêm yết rõ ràng từng kho.
                        </p>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">📱</div>
                        <h3>Theo dõi kho thuê dễ dàng</h3>
                        <p>
                            Xem thông tin hợp đồng thuê, ngày gia hạn và lịch sử thanh toán trên cổng khách hàng.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. SECTION: PHÂN LOẠI & ĐỊNH GIÁ */}
            <section className="figma-section bg-subtle text-center">
                <div className="figma-pill-badge center">
                    PHÂN LOẠI &amp; ĐỊNH GIÁ
                </div>
                <h2 className="figma-section-title">
                    Các loại kho lưu trữ
                </h2>
                <p className="figma-section-desc">
                    Bảng giá niêm yết tham khảo công khai, không chi phí ẩn.
                </p>

                <div className="figma-grid-3 pricing-grid">
                    {/* Kho S */}
                    <div className="figma-card pricing-card">
                        <div className="pricing-card-header">
                            <span className="tier-tag">GÓI NHỎ</span>
                            <span className="tier-vol">Thể tích ~4 - 7m³</span>
                        </div>
                        <h3 className="tier-title">Kho S (Kích thước nhỏ)</h3>
                        <div className="tier-size">Diện tích ~1.5m² - 3m²</div>
                        <div className="tier-fit">
                            <strong>Phù hợp nhu cầu:</strong>
                            <p>Vali du lịch, tài liệu, thùng carton, đồ dùng cá nhân.</p>
                        </div>
                        <div className="tier-price">
                            <strong>650.000 đ</strong>
                            <span>/ tháng</span>
                        </div>
                        <Link className="figma-btn figma-btn-outline full-width" to="/storage?type=S">
                            Xem kho
                        </Link>
                    </div>

                    {/* Kho M (Featured) */}
                    <div className="figma-card pricing-card featured">
                        <div className="popular-badge">ĐƯỢC CHỌN NHIỀU</div>
                        <div className="pricing-card-header">
                            <span className="tier-tag highlight">GÓI TIÊU CHUẨN</span>
                            <span className="tier-vol">Thể tích ~10 - 20m³</span>
                        </div>
                        <h3 className="tier-title">Kho M (Kích thước vừa)</h3>
                        <div className="tier-size">Diện tích ~4m² - 8m²</div>
                        <div className="tier-fit">
                            <strong>Phù hợp nhu cầu:</strong>
                            <p>Đồ nội thất căn hộ 1-2 phòng ngủ, thiết bị gia dụng, hàng hóa kinh doanh online.</p>
                        </div>
                        <div className="tier-price">
                            <strong>1.450.000 đ</strong>
                            <span>/ tháng</span>
                        </div>
                        <Link className="figma-btn figma-btn-dark full-width" to="/storage?type=M">
                            Xem kho
                        </Link>
                    </div>

                    {/* Kho L */}
                    <div className="figma-card pricing-card">
                        <div className="pricing-card-header">
                            <span className="tier-tag">GÓI MỞ RỘNG</span>
                            <span className="tier-vol">Thể tích ~25 - 50m³</span>
                        </div>
                        <h3 className="tier-title">Kho L (Kích thước lớn)</h3>
                        <div className="tier-size">Diện tích ~10m² - 20m²</div>
                        <div className="tier-fit">
                            <strong>Phù hợp nhu cầu:</strong>
                            <p>Toàn bộ nội thất nhà phố, hàng tồn kho doanh nghiệp, thiết bị văn phòng.</p>
                        </div>
                        <div className="tier-price">
                            <strong>2.800.000 đ</strong>
                            <span>/ tháng</span>
                        </div>
                        <Link className="figma-btn figma-btn-outline full-width" to="/storage?type=L">
                            Xem kho
                        </Link>
                    </div>
                </div>
            </section>

            {/* 4. SECTION: QUY TRÌNH THUÊ KHO */}
            <section className="figma-section text-center">
                <div className="figma-pill-badge center">
                    LỘ TRÌNH SỬ DỤNG
                </div>
                <h2 className="figma-section-title">
                    Quy trình thuê kho
                </h2>
                <p className="figma-section-desc">
                    4 bước trực quan để bắt đầu thuê và sử dụng kho lưu trữ tự phục vụ.
                </p>

                <div className="figma-grid-4 steps-grid">
                    <div className="figma-card step-card">
                        <div className="step-header">
                            <span className="step-number">01</span>
                            <span className="step-icon">🔍</span>
                        </div>
                        <h3>Tìm kho</h3>
                        <p>Chọn loại kho, diện tích và chi nhánh kho phù hợp nhu cầu.</p>
                    </div>
                    <div className="figma-card step-card">
                        <div className="step-header">
                            <span className="step-number">02</span>
                            <span className="step-icon">📅</span>
                        </div>
                        <h3>Đặt giữ chỗ</h3>
                        <p>Đăng ký giữ chỗ kho trực tuyến với thông tin thời gian thuê dự kiến.</p>
                    </div>
                    <div className="figma-card step-card">
                        <div className="step-header">
                            <span className="step-number">03</span>
                            <span className="step-icon">💳</span>
                        </div>
                        <h3>Thanh toán tiền cọc</h3>
                        <p>Hoàn tất xác nhận đơn đặt bằng thanh toán tiền cọc theo quy định.</p>
                    </div>
                    <div className="figma-card step-card">
                        <div className="step-header">
                            <span className="step-number">04</span>
                            <span className="step-icon">🔑</span>
                        </div>
                        <h3>Nhận bàn giao</h3>
                        <p>Đến chi nhánh nhận bàn giao chìa khóa/mã mở kho và bắt đầu sử dụng.</p>
                    </div>
                </div>
            </section>

            {/* 5. SECTION: ĐỊA ĐIỂM LƯU TRỮ */}
            <section className="figma-section bg-subtle text-center">
                <div className="figma-pill-badge center">
                    MẠNG LƯỚI CƠ SỞ
                </div>
                <h2 className="figma-section-title">
                    Địa điểm lưu trữ
                </h2>
                <p className="figma-section-desc">
                    Hệ thống kho tại các vị trí trung tâm, đường xe tải thuận tiện.
                </p>

                <div className="figma-grid-3 facilities-grid">
                    {/* Tân Bình */}
                    <div className="figma-card facility-card">
                        <div className="facility-img-box">
                            <img src={tanBinhImg} alt="Cơ sở Tân Bình - TP. Hồ Chí Minh" />
                            <span className="city-tag">TP. HỒ CHÍ MINH</span>
                        </div>
                        <div className="facility-body">
                            <h3>Cơ sở Tân Bình – TP. Hồ Chí Minh</h3>
                            <p className="address">📍 Khu Công Nghiệp Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP HCM</p>
                            <ul className="checklist">
                                <li><span>✓</span> Sảnh đỗ xe tải rộng, tiếp cận tận cửa sảnh</li>
                                <li><span>✓</span> Thang máy nâng hàng tải trọng lớn</li>
                                <li><span>✓</span> Camera giám sát khu vực chung</li>
                            </ul>
                            <Link className="figma-btn figma-btn-outline full-width" to="/storage?facility=HCM-TB">
                                Xem kho
                            </Link>
                        </div>
                    </div>

                    {/* Quận 7 */}
                    <div className="figma-card facility-card">
                        <div className="facility-img-box">
                            <img src={quan7Img} alt="Cơ sở Quận 7 - TP. Hồ Chí Minh" />
                            <span className="city-tag">TP. HỒ CHÍ MINH</span>
                        </div>
                        <div className="facility-body">
                            <h3>Cơ sở Quận 7 – TP. Hồ Chí Minh</h3>
                            <p className="address">📍 Đường Nguyễn Thị Thập, P. Tân Phong, Quận 7, TP HCM</p>
                            <ul className="checklist">
                                <li><span>✓</span> Kho mát bảo quản tài liệu &amp; thiết bị</li>
                                <li><span>✓</span> Xe trung chuyển ra vào thuận lợi</li>
                                <li><span>✓</span> Cảm biến kiểm soát độ ẩm phòng kho</li>
                            </ul>
                            <Link className="figma-btn figma-btn-outline full-width" to="/storage?facility=HCM-Q7">
                                Xem kho
                            </Link>
                        </div>
                    </div>

                    {/* Cầu Giấy */}
                    <div className="figma-card facility-card">
                        <div className="facility-img-box">
                            <img src={cauGiayImg} alt="Cơ sở Cầu Giấy – Hà Nội" />
                            <span className="city-tag city-tag-hn">HÀ NỘI</span>
                        </div>
                        <div className="facility-body">
                            <h3>Cơ sở Cầu Giấy – Hà Nội</h3>
                            <p className="address">📍 Đường Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội</p>
                            <ul className="checklist">
                                <li><span>✓</span> Tiếp giáp các tòa nhà văn phòng trung tâm</li>
                                <li><span>✓</span> Khu lưu trữ sạch sẽ, thông thoáng</li>
                                <li><span>✓</span> Xe đẩy hàng sẵn có phục vụ miễn phí</li>
                            </ul>
                            <Link className="figma-btn figma-btn-outline full-width" to="/storage?facility=HN-CG">
                                Xem kho
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. SECTION: KHÔNG GIAN LƯU TRỮ TIÊU CHUẨN */}
            <section className="figma-section">
                <div className="text-center">
                    <div className="figma-pill-badge center">
                        CƠ SỞ VẬT CHẤT
                    </div>
                    <h2 className="figma-section-title">
                        Không gian lưu trữ tiêu chuẩn &amp; ngăn nắp
                    </h2>
                    <p className="figma-section-desc">
                        Hình ảnh thực tế ghi nhận từ hệ thống kho tự quản chuẩn quy hoạch.
                    </p>
                </div>

                <div className="standards-layout">
                    <div className="standards-photo-box">
                        <img src={cleanHallway} alt="Môi trường kho sạch sẽ, đạt chuẩn quốc tế" />
                        <div className="photo-overlay-card">
                            <span className="badge-live">● THỰC TẾ TẠI CƠ SỞ</span>
                            <h4>Môi trường kho sạch sẽ</h4>
                            <p>
                                Lối đi rộng rãi, sàn bê tông tăng cứng công nghiệp, hệ thống đèn LED chiếu sáng đầy đủ và kiểm soát bụi bẩn định kỳ.
                            </p>
                        </div>
                    </div>

                    <div className="standards-features">
                        <div className="figma-card standard-feature-card">
                            <div className="feat-header">
                                <span className="feat-icon">#</span>
                                <div>
                                    <h3>Đa dạng kích thước kho</h3>
                                    <p>
                                        Từng dãy kho có khoá cài các cỡ chuyên dụng, đánh số định danh rõ ràng, vách ngăn chống cháy bền chắc và độ an toàn cao.
                                    </p>
                                </div>
                            </div>
                            <div className="feat-tags">
                                <span>🔒 Khóa riêng biệt</span>
                                <span>🏷️ Mã kho định danh</span>
                            </div>
                        </div>

                        <div className="figma-card standard-feature-card">
                            <div className="feat-header">
                                <span className="feat-icon">🛒</span>
                                <div>
                                    <h3>Cơ sở vận hành ngăn nắp</h3>
                                    <p>
                                        Sắp xếp phân khu khoa học, xe đẩy hỗ trợ bốc xếp hàng hoá tại sảnh giúp khách hàng chuyển đồ thuận tiện và nhanh chóng.
                                    </p>
                                </div>
                            </div>
                            <div className="feat-tags">
                                <span>🛒 Xe đẩy miễn phí</span>
                                <span>📋 Sảnh xuất nhập đồ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. BANNER CTA ĐÁY TRANG */}
            <section className="figma-cta-banner">
                <div className="cta-inner">
                    <span className="cta-tag">ĐẶT KHO TRỰC TUYẾN TIỆN LỢI</span>
                    <h2 className="cta-title">Sẵn sàng tìm kho phù hợp?</h2>
                    <p className="cta-subtitle">
                        Khám phá ngay các kho lưu trữ còn trống tại chi nhánh gần bạn nhất hoặc liên hệ đội ngũ để được hướng dẫn chi tiết.
                    </p>
                    <div className="cta-buttons">
                        <Link className="figma-btn figma-btn-primary" to="/storage">
                            Tìm kho lưu trữ →
                        </Link>
                        <Link className="figma-btn figma-btn-white" to="/login">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
