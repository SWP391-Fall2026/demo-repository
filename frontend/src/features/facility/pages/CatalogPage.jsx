import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { facilityApi } from "../api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { useSession } from "../../identity/session";
import { facilityFilterForSession } from "../lib/catalog-filters";
import { display, money } from "../../../shared/lib/format";
import imgCauGiay from "../../../assets/images/facility_cau_giay.jpg";
import imgQuan7 from "../../../assets/images/facility_quan_7.jpg";
import imgTanBinh from "../../../assets/images/facility_tan_binh.jpg";
import imgClean from "../../../assets/images/facility_clean.jpg";

function getUnitImage(unit) {
    if (unit.imageUrl) return String(unit.imageUrl);
    const code = String(unit.code || unit.facilityCode || "").toUpperCase();
    if (code.includes("CG") || code.includes("HN")) return imgCauGiay;
    if (code.includes("Q7")) return imgQuan7;
    if (code.includes("TB")) return imgTanBinh;
    return imgClean;
}

export default function CatalogPage() {
    const session = useSession();
    const [searchParams] = useSearchParams();
    const urlFacility = searchParams.get("facility") || "";
    const customerFacilityCode = urlFacility || facilityFilterForSession(session?.user?.role, session?.user?.facilityCode);
    const [filters, setFilters] = useState({ facilityCode: customerFacilityCode, minSize: "", maxSize: "", minPrice: "", maxPrice: "" });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [facilities, setFacilities] = useState([]);
    const { data, error, busy, reload } = useRemote(() => facilityApi.units(appliedFilters));
    const units = Array.isArray(data) ? data : [];

    useEffect(() => {
        const activeFacility = urlFacility || customerFacilityCode;
        setFilters((current) => ({ ...current, facilityCode: activeFacility }));
        setAppliedFilters((current) => ({ ...current, facilityCode: activeFacility }));
        reload();
    }, [urlFacility, customerFacilityCode, reload]);

    useEffect(() => {
        facilityApi.facilities().then(setFacilities).catch(() => setFacilities([]));
    }, []);

    function update(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }

    function submitFilters(event) {
        event.preventDefault();
        setAppliedFilters(filters);
        reload();
    }

    function clearFilters() {
        const empty = { facilityCode: "", minSize: "", maxSize: "", minPrice: "", maxPrice: "" };
        setFilters(empty);
        setAppliedFilters(empty);
        reload();
    }

    return (
        <div className="catalog-page-wrapper">
            {/* Top Heading */}
            <header className="catalog-header-bar">
                <div className="header-text">
                    <span className="eyebrow-pill">HỆ THỐNG KHO TỰ PHỤC VỤ 24/7</span>
                    <h1 className="catalog-main-title">Danh mục cơ sở &amp; kích thước kho lưu trữ</h1>
                    <p className="catalog-subtitle">
                        Lưu trữ an toàn, bảo mật bằng mã PIN điện tử, camera an ninh 24/7 và kiểm soát nhiệt độ đạt chuẩn.
                    </p>
                </div>

                <form className="facility-quick-picker" onSubmit={submitFilters}>
                    <label className="sr-only" htmlFor="catalog-facility">Chọn cơ sở</label>
                    <div className="select-container">
                        <select
                            id="catalog-facility"
                            value={filters.facilityCode}
                            onChange={(e) => update("facilityCode", e.target.value)}
                        >
                            <option value="">Tất cả các cơ sở</option>
                            {facilities.filter((f) => !f.status || String(f.status).toUpperCase() === "ACTIVE").map((f) => (
                                <option key={String(f.code)} value={String(f.code)}>
                                    {String(f.name)} ({String(f.code)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-figma btn-primary-dark">
                        Tìm kho
                    </button>
                </form>
            </header>

            {/* Filter Panel */}
            <form className="clean-card catalog-filters-panel" onSubmit={submitFilters}>
                <div className="filters-header">
                    <div className="filter-title-group">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        <h3>Bộ lọc tìm kiếm</h3>
                    </div>
                    <span className="filter-hint">Lọc theo diện tích buồng kho và khoảng giá thuê</span>
                </div>

                <div className="filters-grid">
                    <div className="filter-field">
                        <label>Diện tích từ (m²)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="vd: 2"
                            value={filters.minSize}
                            onChange={(e) => update("minSize", e.target.value)}
                        />
                    </div>
                    <div className="filter-field">
                        <label>Đến (m²)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="vd: 10"
                            value={filters.maxSize}
                            onChange={(e) => update("maxSize", e.target.value)}
                        />
                    </div>
                    <div className="filter-field">
                        <label>Giá từ (VNĐ/tháng)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="vd: 500000"
                            value={filters.minPrice}
                            onChange={(e) => update("minPrice", e.target.value)}
                        />
                    </div>
                    <div className="filter-field">
                        <label>Đến (VNĐ/tháng)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="vd: 3000000"
                            value={filters.maxPrice}
                            onChange={(e) => update("maxPrice", e.target.value)}
                        />
                    </div>
                    <div className="filter-actions-group">
                        <button type="submit" className="btn-figma btn-accent-blue">
                            Áp dụng
                        </button>
                        <button type="button" className="btn-figma btn-outline" onClick={clearFilters}>
                            Xóa lọc
                        </button>
                    </div>
                </div>
            </form>

            {/* Results Grid */}
            <section className="catalog-results-area">
                <div className="results-toolbar">
                    <div className="results-count">
                        <h2>Khoang kho khả dụng</h2>
                        <span className="count-badge">{units.length} kho</span>
                    </div>
                    <button type="button" className="btn-figma btn-outline btn-sm" onClick={reload}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Làm mới
                    </button>
                </div>

                {error ? (
                    <div className="clean-card empty-state error-state" role="alert">
                        <div className="state-icon">⚠️</div>
                        <h4>Không thể tải danh sách</h4>
                        <p>{error}</p>
                        <button className="btn-figma btn-outline btn-sm" onClick={reload}>Thử lại</button>
                    </div>
                ) : busy ? (
                    <div className="clean-card empty-state" aria-live="polite">
                        <div className="loading-spinner"></div>
                        <p>Đang đồng bộ dữ liệu kho trực tiếp từ hệ thống…</p>
                    </div>
                ) : !units.length ? (
                    <div className="clean-card empty-state">
                        <div className="state-icon">📦</div>
                        <h4>Không có kho phù hợp</h4>
                        <p>Thử điều chỉnh lại bộ lọc diện tích, khoảng giá hoặc chọn cơ sở khác.</p>
                        <button className="btn-figma btn-outline btn-sm" onClick={clearFilters}>Đặt lại bộ lọc</button>
                    </div>
                ) : (
                    <div className="units-catalog-grid">
                        {units.map((unit) => (
                            <article className="clean-card unit-showcase-card" key={String(unit.code)}>
                                <div className="unit-card-media">
                                    <img
                                        src={getUnitImage(unit)}
                                        alt={String(unit.imageAltText || `Ảnh khoang lưu trữ ${unit.code}`)}
                                        loading="lazy"
                                        onError={(event) => { event.currentTarget.src = imgClean; }}
                                    />
                                    <span className="available-pill">
                                        <span className="green-dot"></span> Còn trống
                                    </span>
                                </div>

                                <div className="unit-card-content">
                                    <div className="unit-type-header">
                                        <span className="unit-badge-type">Loại {display(unit.type)}</span>
                                        <span className="unit-code-id">{display(unit.code)}</span>
                                    </div>

                                    <h3 className="unit-card-title">
                                        Kho {display(unit.type)} · {display(unit.sizeSqm)} m²
                                    </h3>
                                    <p className="unit-card-desc">
                                        Không gian lưu trữ an toàn, sạch sẽ, có mã PIN số riêng biệt mở cửa 24/7.
                                    </p>

                                    <div className="unit-perks-row">
                                        <span className="perk-chip">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            </svg>
                                            {display(unit.sizeSqm)} m²
                                        </span>
                                        <span className="perk-chip">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                            {display(unit.facilityCode)}
                                        </span>
                                    </div>

                                    <div className="unit-card-footer">
                                        <div className="unit-pricing-display">
                                            <strong>{money(unit.pricePerMonth)}</strong>
                                            <small>/ tháng</small>
                                        </div>
                                        <Link
                                            className="btn-figma btn-accent-blue"
                                            to={`/reservations/new?facility=${encodeURIComponent(String(unit.facilityCode))}&type=${encodeURIComponent(String(unit.type))}&unit=${encodeURIComponent(String(unit.code))}&size=${encodeURIComponent(String(unit.sizeSqm))}&price=${encodeURIComponent(String(unit.pricePerMonth))}`}
                                        >
                                            Đặt giữ chỗ
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
