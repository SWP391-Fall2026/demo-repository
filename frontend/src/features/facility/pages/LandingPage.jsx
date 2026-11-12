import { useState } from "react";
import { Link } from "react-router-dom";
import hero from "../../../assets/images/hero_storage.jpg";
import cleanHallway from "../../../assets/images/facility_clean.jpg";
import tanBinhImg from "../../../assets/images/facility_tan_binh.jpg";
import quan7Img from "../../../assets/images/facility_quan_7.jpg";
import cauGiayImg from "../../../assets/images/facility_cau_giay.jpg";

export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

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

            {/* 2. SECTION: NHU CẦU LƯU TRỮ PHỔ BIẾN (USE CASES) */}
            <section className="figma-section text-center">
                <div className="figma-pill-badge center">
                    GIẢI PHÁP LƯU TRỮ
                </div>
                <h2 className="figma-section-title">
                    Không gian lưu trữ cho mọi nhu cầu
                </h2>
                <p className="figma-section-desc">
                    Giải pháp thuê kho tự quản thông minh, bảo mật mã PIN riêng và hỗ trợ ra vào tự do 24/7.
                </p>

                <div className="figma-grid-4">
                    <div className="figma-card service-card">
                        <div className="card-icon-box">🏠</div>
                        <h3>Đồ gia đình &amp; Dọn nhà</h3>
                        <p>
                            Bảo quản nội thất, sofa, nệm giường, đồ theo mùa hoặc đồ đạc khi sửa nhà, dọn nhà an toàn và khô ráo.
                        </p>
                        <Link className="card-link-action" to="/storage?type=M">
                            Xem kho phù hợp →
                        </Link>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">📂</div>
                        <h3>Hồ sơ &amp; Tài liệu doanh nghiệp</h3>
                        <p>
                            Lưu trữ chứng từ kế toán, hợp đồng, hồ sơ dự án định kỳ với hệ thống kiểm soát nhiệt độ và PCCC đạt chuẩn.
                        </p>
                        <Link className="card-link-action" to="/storage?type=S">
                            Xem kho phù hợp →
                        </Link>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">📦</div>
                        <h3>Hàng hóa kinh doanh Online</h3>
                        <p>
                            Khoang chứa đồ riêng tư cho shop online, chủ động xuất nhập hàng hóa bất cứ lúc nào, xe tải đỗ tận sảnh.
                        </p>
                        <Link className="card-link-action" to="/storage?type=M">
                            Xem kho phù hợp →
                        </Link>
                    </div>
                    <div className="figma-card service-card">
                        <div className="card-icon-box">🧳</div>
                        <h3>Hành lý &amp; Đồ cá nhân</h3>
                        <p>
                            Tủ kho mini tiện lợi lưu giữ vali, xe đạp, thiết bị thể thao, đồ cắm trại trong thời gian đi công tác hoặc du lịch.
                        </p>
                        <Link className="card-link-action" to="/storage?type=S">
                            Xem kho phù hợp →
                        </Link>
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
                            <img src={tanBinhImg} alt="Cơ sở Tân Bình - TP. Hồ Chí Minh" loading="lazy" decoding="async" />
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
                            <img src={quan7Img} alt="Cơ sở Quận 7 - TP. Hồ Chí Minh" loading="lazy" decoding="async" />
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
                            <img src={cauGiayImg} alt="Cơ sở Cầu Giấy – Hà Nội" loading="lazy" decoding="async" />
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
                        <img src={cleanHallway} alt="Môi trường kho sạch sẽ, đạt chuẩn quốc tế" loading="lazy" decoding="async" />
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

            {/* 7. SECTION: CÂU HỎI THƯỜNG GẶP (FAQS) */}
            <section className="figma-section bg-subtle text-center">
                <div className="figma-pill-badge center">
                    GIẢI ĐÁP THẮC MẮC
                </div>
                <h2 className="figma-section-title">
                    Câu hỏi thường gặp
                </h2>
                <p className="figma-section-desc">
                    Thông tin cần biết trước khi bắt đầu thuê kho tự quản tại hệ thống.
                </p>

                <div className="faq-section">
                    <div className="faq-list">
                        <div className={`faq-item ${openFaq === 0 ? "active" : ""}`}>
                            <button
                                type="button"
                                className="faq-question"
                                onClick={() => toggleFaq(0)}
                                aria-expanded={openFaq === 0}
                            >
                                <span>1. Tôi có thể ra vào kho vào ban đêm hoặc ngày nghỉ lễ không?</span>
                                <span className="faq-icon">{openFaq === 0 ? "▲" : "▼"}</span>
                            </button>
                            {openFaq === 0 && (
                                <div className="faq-answer">
                                    Có. Hệ thống kho tự quản ứng dụng công nghệ kiểm soát ra vào 24/7. Sau khi nhận bàn giao kho, bạn được cấp mã PIN điện tử riêng biệt để chủ động mở cửa và ra vào bất kỳ thời gian nào trong ngày.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openFaq === 1 ? "active" : ""}`}>
                            <button
                                type="button"
                                className="faq-question"
                                onClick={() => toggleFaq(1)}
                                aria-expanded={openFaq === 1}
                            >
                                <span>2. Thủ tục đặt kho và nhận kho mất bao lâu?</span>
                                <span className="faq-icon">{openFaq === 1 ? "▲" : "▼"}</span>
                            </button>
                            {openFaq === 1 && (
                                <div className="faq-answer">
                                    Chỉ mất từ 3-5 phút thực hiện trực tuyến. Bạn chọn buồng kho, đặt giữ chỗ, thanh toán tiền cọc và sẽ nhận ngay Thẻ Check-in QR điện tử cùng lịch hẹn nhận kho trực tiếp tại cơ sở.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openFaq === 2 ? "active" : ""}`}>
                            <button
                                type="button"
                                className="faq-question"
                                onClick={() => toggleFaq(2)}
                                aria-expanded={openFaq === 2}
                            >
                                <span>3. Những mặt hàng nào bị nghiêm cấm lưu trữ tại kho?</span>
                                <span className="faq-icon">{openFaq === 2 ? "▲" : "▼"}</span>
                            </button>
                            {openFaq === 2 && (
                                <div className="faq-answer">
                                    Vì lý do an toàn PCCC chung, hệ thống nghiêm cấm: chất dễ cháy nổ, vũ khí, hóa chất độc hại, động vật sống, và thực phẩm tươi sống dễ ôi thiu. Đồ khô đóng hộp và hàng hóa thương mại hợp pháp đều được phép lưu trữ.
                                </div>
                            )}
                        </div>

                        <div className={`faq-item ${openFaq === 3 ? "active" : ""}`}>
                            <button
                                type="button"
                                className="faq-question"
                                onClick={() => toggleFaq(3)}
                                aria-expanded={openFaq === 3}
                            >
                                <span>4. Khi kết thúc hợp đồng, tiền cọc được hoàn lại như thế nào?</span>
                                <span className="faq-icon">{openFaq === 3 ? "▲" : "▼"}</span>
                            </button>
                            {openFaq === 3 && (
                                <div className="faq-answer">
                                    Khi bạn tạo yêu cầu trả kho trên hệ thống, nhân viên cơ sở sẽ cùng bạn nghiệm thu hiện trạng buồng kho. Tiền cọc sẽ được hoàn trả tự động về tài khoản ngân hàng của bạn trong vòng 3-5 ngày làm việc.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. BANNER CTA ĐÁY TRANG */}
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
