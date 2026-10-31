import { useState } from "react";
import { Link } from "react-router-dom";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
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
    const reloadAll = () => {
        reload();
        reloadReviews();
    };
    return (<>
      <ResourcePage title="Kho đang thuê và hợp đồng" description="Tên cơ sở, thời hạn, trạng thái hợp đồng và PIN 6 chữ số. Yêu cầu trả kho giữ PIN đến khi Staff hoàn tất nghiệm thu." load={loadRentals} columns={[
            ["facilityCode", "Cơ sở"],
            ["status", "Trạng thái hợp đồng"],
            ["startDate", "Ngày bắt đầu"],
            ["endAt", "Ngày kết thúc dự kiến"],
            ["monthlyFee", "Giá thuê / tháng"],
            ["checkoutRequestedDate", "Ngày hẹn trả"],
        ]} actions={<>
          <Link className="button" to="/rentals/return">Yêu cầu trả kho</Link>
          <Link className="button secondary" to="/rentals/renew">Gia hạn</Link>
        </>}/>
      {rentalsError && <section className="card error" role="alert">{rentalsError}</section>}
      {rentalsBusy && <section className="card empty">Đang tải hợp đồng…</section>}
      {!rentalsBusy && Array.isArray(data) && !data.length && (<section className="card empty"><span className="empty-icon">▣</span><h2>Chưa có kho đang thuê</h2><p>Các hợp đồng của bạn sẽ hiển thị tại đây sau khi hoàn tất đặt thuê.</p></section>)}
      <div className="metric-grid customer-rental-grid">
        {data?.map((c) => {
            const locked = String(c.status) === "OVERDUE";
            const inspectionReviews = (Array.isArray(reviews) ? reviews : []).filter((item) => String(item.contractId) === String(c.id));
            return (<article className="card customer-rental-card" key={String(c.id)}>
            <header><div><span className="eyebrow">HỢP ĐỒNG THUÊ</span><h2>{display(c.facilityCode)}</h2></div><span className={`badge ${c.status === "ACTIVE" ? "success" : "pending"}`}>{statusLabels[String(c.status)] || display(c.status)}</span></header>
            <p>Mã hợp đồng: {display(c.id)}</p>
            <div className="customer-rental-facts"><span>Giá thuê<strong>{money(c.monthlyFee)} / tháng</strong></span><span>Bắt đầu<strong>{display(c.startDate || c.startAt)}</strong></span><span>Hết hạn dự kiến<strong>{display(c.endAt || c.endDate)}</strong></span></div>
            {c.checkoutRequestedDate && (<p>Ngày hẹn trả: {display(c.checkoutRequestedDate)}</p>)}
            {c.checkoutReason && (<p>Lý do trả: {display(c.checkoutReason)}</p>)}
            {locked && (<p role="alert">Kho đang trong trạng thái tạm khóa nợ cước: PIN bị hạn chế.</p>)}
            {c.inspectionStatus && (<section className="customer-inspection-summary">
                <div className="customer-inspection-heading"><div><span className="eyebrow">TRẢ KHO / NGHIỆM THU</span><strong>{inspectionLabels[String(c.inspectionStatus)] || display(c.inspectionStatus)}</strong></div><span className="badge pending">Đang xử lý</span></div>
                <div className="customer-inspection-fees"><span>Khấu trừ<strong>{money(c.inspectionPenaltyFee)}</strong></span><span>Hoàn cọc dự kiến<strong>{money(c.inspectionRefundAmount)}</strong></span></div>
                {c.inspectionDamageNotes && <p>Hiện trạng: {display(c.inspectionDamageNotes)}</p>}
                <ReturnInspectionResponse contractId={c.id} status={c.inspectionStatus} reviews={inspectionReviews} evidenceAvailable={c.inspectionEvidenceAvailable} onUpdated={reloadAll} />
              </section>)}
            <div className="customer-rental-actions"><Link className="button secondary" to={`/rentals/${encodeURIComponent(String(c.id))}`}>Xem chi tiết hợp đồng</Link>
            {Boolean(c.pinCode) && !locked && (<>
                <button className="secondary" onClick={() => setVisible(visible === c.id ? null : String(c.id))}>
                  {visible === c.id ? "Ẩn PIN" : "Xem PIN 6 chữ số"}
                </button>
                {visible === c.id && (<>
                    <p className="pin-display">{display(c.pinCode)}</p>
                    <p>Hướng dẫn an ninh: không chia sẻ PIN với người khác.</p>
                  </>)}
              </>)}
            </div>
          </article>);
        })}
      </div>
    </>);
}
