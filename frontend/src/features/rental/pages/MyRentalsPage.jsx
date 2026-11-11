import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDate, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
import ReturnInspectionResponse from "../components/ReturnInspectionResponse";
const activeStatuses = ["ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"];
const statusLabels = {
    ACTIVE: "Đang thuê",
    EXPIRING_SOON: "Sắp hết hạn",
    OVERDUE: "Tạm khóa nợ cước",
    CHECKOUT_REQUESTED: "Đã yêu cầu trả kho",
    TERMINATED: "Đã kết thúc",
};
const inspectionLabels = {
    PENDING_CONFIRM: "Chờ xác nhận",
    PENDING_MANAGER: "Chờ quản lý xem xét",
    PENDING_CUSTOMER: "Chờ khách xác nhận đề xuất",
    CUSTOMER_ACCEPTED: "Chờ nhân viên hoàn tất",
    CONFIRMED: "Hoàn tất",
    COMPLETED: "Hoàn tất",
};
export default function MyRentalsPage() {
    const loadRentals = () => rentalApi.list().then((rows) => rows.filter((row) => activeStatuses.includes(String(row.status))));
    const { data, error: rentalsError, busy: rentalsBusy, reload } = useRemote(loadRentals);
    const { data: reviews, reload: reloadReviews } = useRemote(rentalApi.returnInspectionReviews);
    const [visible, setVisible] = useState(null);
    const [search, setSearch] = useState("");
    const reloadAll = () => {
        reload();
        reloadReviews();
    };
    const rentals = Array.isArray(data) ? data : [];
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rentals;
        return rentals.filter((c) => [c.id, c.unitCode, c.facilityCode, statusLabels[String(c.status)]].some((v) => String(v || "").toLowerCase().includes(q)));
    }, [rentals, search]);
    return (<main className="page-content">
      <header className="page-heading">
        <div>
          <span className="eyebrow">STORAGE / DỊCH VỤ CỦA TÔI</span>
          <h1>Kho đang thuê và hợp đồng</h1>
          <p>Theo dõi thời hạn thuê, mã PIN mở kho 24/7 và thao tác trả kho hoặc gia hạn trực tiếp trên từng hợp đồng.</p>
        </div>
        <div className="heading-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Link className="btn-figma btn-outline btn-sm" to="/rentals/return">Yêu cầu trả kho</Link>
          <Link className="btn-figma btn-primary-dark btn-sm" to="/rentals/renew">Gia hạn hợp đồng</Link>
          <button type="button" className="btn-figma btn-outline btn-sm" onClick={reloadAll} disabled={rentalsBusy}>Làm mới</button>
        </div>
      </header>
      <section className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã hợp đồng, mã kho hoặc cơ sở…"
          style={{ flex: "1 1 280px", padding: "9px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
        />
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Đang hiển thị {filtered.length} / {rentals.length} hợp đồng</span>
      </section>
      {rentalsError && <section className="card error" role="alert">{rentalsError}</section>}
      {rentalsBusy && <section className="card empty">Đang tải hợp đồng…</section>}
      {!rentalsBusy && !rentals.length && (<section className="card empty"><span className="empty-icon">▣</span><h2>Chưa có kho đang thuê</h2><p>Các hợp đồng của bạn sẽ hiển thị tại đây sau khi hoàn tất đặt thuê.</p></section>)}
      {!rentalsBusy && rentals.length > 0 && !filtered.length && (<section className="card empty"><h3>Không tìm thấy hợp đồng phù hợp</h3><p>Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p></section>)}
      <div className="customer-rental-list">
        {filtered.map((c) => {
            const locked = String(c.status) === "OVERDUE";
            const canRequestReturn = !locked && String(c.status) !== "CHECKOUT_REQUESTED" && String(c.status) !== "TERMINATED";
            const inspectionReviews = (Array.isArray(reviews) ? reviews : []).filter((item) => String(item.contractId) === String(c.id));
            return (<article className="card customer-rental-bar" key={String(c.id)}>
            <div className="customer-rental-bar-main">
              <div className="customer-rental-bar-identity">
                <div className="customer-rental-bar-badges">
                  <span className="eyebrow">HỢP ĐỒNG THUÊ</span>
                  <span className={`badge ${c.status === "ACTIVE" ? "success" : "pending"}`}>{statusLabels[String(c.status)] || display(c.status)}</span>
                </div>
                <h2>{display(c.facilityCode)} {c.unitCode ? `· ${display(c.unitCode)}` : ""}</h2>
                <p>Mã hợp đồng: <strong>{display(c.id)}</strong></p>
              </div>

              <div className="customer-rental-bar-facts">
                <span>
                  <small>GIÁ THUÊ</small>
                  <strong>{money(c.monthlyFee)} / tháng</strong>
                </span>
                <span>
                  <small>BẮT ĐẦU</small>
                  <strong>{formatDate(c.startDate || c.startAt)}</strong>
                </span>
                <span>
                  <small>HẾT HẠN DỰ KIẾN</small>
                  <strong>{formatDate(c.endAt || c.endDate)}</strong>
                </span>
              </div>

              <div className="customer-rental-bar-actions">
                <Link className="btn-figma btn-primary-dark btn-sm" to={`/rentals/${encodeURIComponent(String(c.id))}`}>
                  Xem chi tiết hợp đồng
                </Link>
                {canRequestReturn && (
                  <Link className="btn-figma btn-outline btn-sm" to={`/rentals/return?contractId=${encodeURIComponent(String(c.id))}`}>
                    Trả kho
                  </Link>
                )}
                {Boolean(c.pinCode) && !locked && (
                  <button
                    type="button"
                    className="btn-figma btn-outline btn-sm"
                    onClick={() => setVisible(visible === c.id ? null : String(c.id))}
                  >
                    {visible === c.id ? "Ẩn PIN" : "Xem PIN 6 chữ số"}
                  </button>
                )}
              </div>
            </div>

            {(visible === c.id || c.checkoutRequestedDate || c.checkoutReason || locked || c.inspectionStatus) && (
              <div className="customer-rental-bar-extra">
                {visible === c.id && Boolean(c.pinCode) && !locked && (
                  <div className="pin-inline-banner">
                    <span>Mã PIN mở kho 24/7:</span>
                    <strong className="pin-display">{display(c.pinCode)}</strong>
                    <small>Hướng dẫn an ninh: không chia sẻ PIN với người khác.</small>
                  </div>
                )}
                {c.checkoutRequestedDate && (<p>Ngày hẹn trả: <strong>{formatDate(c.checkoutRequestedDate)}</strong></p>)}
                {c.checkoutReason && (<p>Lý do trả: {display(c.checkoutReason)}</p>)}
                {locked && (<p role="alert" style={{ color: "#DC2626", fontWeight: 600 }}>Kho đang trong trạng thái tạm khóa nợ cước: PIN bị hạn chế.</p>)}
                {c.inspectionStatus && (<section className="customer-inspection-summary">
                    <div className="customer-inspection-heading"><div><span className="eyebrow">TRẢ KHO / NGHIỆM THU</span><strong>{inspectionLabels[String(c.inspectionStatus)] || display(c.inspectionStatus)}</strong></div><span className="badge pending">Đang xử lý</span></div>
                    <div className="customer-inspection-fees"><span>Khấu trừ<strong>{money(c.inspectionPenaltyFee)}</strong></span><span>Hoàn cọc dự kiến<strong>{money(c.inspectionRefundAmount)}</strong></span></div>
                    {c.inspectionDamageNotes && <p>Hiện trạng: {display(c.inspectionDamageNotes)}</p>}
                    <ReturnInspectionResponse contractId={c.id} status={c.inspectionStatus} reviews={inspectionReviews} evidenceAvailable={c.inspectionEvidenceAvailable} onUpdated={reloadAll} />
                  </section>)}
              </div>
            )}
          </article>);
        })}
      </div>
    </main>);
}
