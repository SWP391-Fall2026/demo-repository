import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { facilityApi } from "../api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { useSession } from "../../identity/session";
import { facilityFilterForSession } from "../lib/catalog-filters";
import { display, money } from "../../../shared/lib/format";
export default function CatalogPage() {
    const session = useSession();
    const customerFacilityCode = facilityFilterForSession(session?.user.role, session?.user.facilityCode);
    const [filters, setFilters] = useState({ facilityCode: customerFacilityCode, minSize: "", maxSize: "", minPrice: "", maxPrice: "" });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [facilities, setFacilities] = useState([]);
    const { data, error, busy, reload } = useRemote(() => facilityApi.units(appliedFilters));
    const units = Array.isArray(data) ? data : [];
    useEffect(() => {
        setFilters((current) => ({ ...current, facilityCode: customerFacilityCode }));
        setAppliedFilters((current) => ({ ...current, facilityCode: customerFacilityCode }));
        reload();
    }, [customerFacilityCode, reload]);
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
    return (<>
      <header className="catalog-heading">
        <div><span className="eyebrow">HỆ THỐNG KHO TỰ PHỤC VỤ 24/7</span><h1>Danh mục cơ sở &amp; kích thước kho lưu trữ</h1><p>Lưu trữ an toàn, bảo mật bằng mã PIN điện tử, camera an ninh 24/7.</p></div>
        <form className="catalog-location" onSubmit={submitFilters}>
          <label className="sr-only" htmlFor="catalog-facility">Chọn cơ sở</label>
          <select id="catalog-facility" value={filters.facilityCode} onChange={(e) => update("facilityCode", e.target.value)}>
            <option value="">Tất cả cơ sở</option>
            {facilities.filter((f) => !f.status || String(f.status).toUpperCase() === "ACTIVE").map((f) => <option key={String(f.code)} value={String(f.code)}>{String(f.name)} ({String(f.code)})</option>)}
          </select>
          <button type="submit">Tìm kiếm kho</button>
        </form>
      </header>
      <form className="catalog-filters" onSubmit={submitFilters}>
        <div className="catalog-filter-label"><h2>Bộ lọc kho</h2><span>Lọc theo diện tích và khoảng giá</span></div>
        <div className="catalog-range-fields">
          <label>Diện tích từ (m²)<input type="number" min="0" value={filters.minSize} onChange={(e) => update("minSize", e.target.value)}/></label>
          <label>Đến (m²)<input type="number" min="0" value={filters.maxSize} onChange={(e) => update("maxSize", e.target.value)}/></label>
          <label>Giá từ / tháng<input type="number" min="0" value={filters.minPrice} onChange={(e) => update("minPrice", e.target.value)}/></label>
          <label>Đến / tháng<input type="number" min="0" value={filters.maxPrice} onChange={(e) => update("maxPrice", e.target.value)}/></label>
          <button type="submit">Áp dụng lọc</button>
          <button type="button" className="secondary" onClick={clearFilters}>Xóa lọc</button>
        </div>
      </form>
      <section className="catalog-results">
        <header className="page-heading">
          <div><h2>Kho còn trống <span className="count">{units.length}</span></h2></div>
          <button type="button" className="secondary" onClick={reload}>Làm mới</button>
        </header>
        {error ? <div className="empty error" role="alert">{error}</div>
            : busy ? <div className="empty" aria-live="polite">Đang tải dữ liệu…</div>
                : !units.length ? <div className="empty"><h3>Không có kho phù hợp</h3><p>Thử thay đổi cơ sở, diện tích hoặc khoảng giá.</p></div>
                    : <div className="catalog-grid">{units.map((unit) => <article className="catalog-unit-card" key={String(unit.code)}>
                  <div className="catalog-unit-image">
                    {unit.imageUrl ? <img src={String(unit.imageUrl)} alt={String(unit.imageAltText || `Ảnh kho ${unit.code}`)} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}/> : <span aria-hidden="true">▦</span>}
                    <span className="availability"><i /> Còn trống</span>
                  </div>
                  <div className="catalog-unit-body">
                    <div className="unit-meta"><span>{display(unit.type)} · {display(unit.facilityCode)}</span><span>{display(unit.code)}</span></div>
                    <h3>Kho {display(unit.type)} · {display(unit.sizeSqm)} m²</h3>
                    <p>Không gian lưu trữ an toàn, phù hợp nhu cầu cá nhân và doanh nghiệp.</p>
                    <div className="unit-facts"><span>⌗ {display(unit.sizeSqm)} m²</span><span>⌖ Cơ sở {display(unit.facilityCode)}</span></div>
                    <div className="catalog-unit-footer"><strong>{money(unit.pricePerMonth)} <small>/ tháng</small></strong>
                      <Link className="button" to={`/reservations/new?facility=${encodeURIComponent(String(unit.facilityCode))}&type=${encodeURIComponent(String(unit.type))}&unit=${encodeURIComponent(String(unit.code))}&size=${encodeURIComponent(String(unit.sizeSqm))}&price=${encodeURIComponent(String(unit.pricePerMonth))}`}>Đặt giữ chỗ</Link>
                    </div>
                  </div>
                </article>)}</div>}
      </section>
    </>);
}
