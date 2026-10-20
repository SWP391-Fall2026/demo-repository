import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import type { Row } from "../../../shared/types/api";
import { rentalApi } from "../../rental/api/rental.api";
import { facilityApi } from "../../facility/api/facility.api";
import CustomerRentalGuide from "../components/CustomerRentalGuide";
import HandoverConfirmationPanel from "../components/HandoverConfirmationPanel";
import { useSession } from "../../identity/session";

function dateTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? display(value) : date.toLocaleString("vi-VN");
}

export default function CheckinPassPage() {
  const session = useSession();
  const { reservationId = "" } = useParams();
  const contracts = useRemote(rentalApi.list);
  const branches = useRemote(facilityApi.facilities);
  useEffect(() => {
    const timer = window.setInterval(contracts.reload, 10000);
    return () => window.clearInterval(timer);
  }, [contracts.reload]);
  if (contracts.busy) return <main className="page-content"><p>Đang tải thẻ Check-in…</p></main>;
  if (contracts.error) return <main className="page-content"><section className="card error" role="alert">{contracts.error}</section></main>;
  const rows = (Array.isArray(contracts.data) ? contracts.data : []).filter((contract) =>
    (!reservationId || reservationId === "all" || contract.reservationId === reservationId) &&
    ["PENDING_HANDOVER", "ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"].includes(String(contract.status)));

  return <main className="page-content">
    <header className="page-heading"><div><span className="eyebrow">HỢP ĐỒNG VÀO KHO</span><h1>Thẻ Check-in &amp; hợp đồng</h1><p>Staff lập biên bản; Customer kiểm tra và xác nhận riêng trước khi hoàn tất bàn giao.</p></div></header>
    <CustomerRentalGuide active={4} />
    {!rows.length ? <section className="card empty"><h2>Chưa có thẻ Check-in</h2><p>Khách cần thanh toán `RENT` trước khi nhận biên bản bàn giao.</p><Link to="/invoices/all/pay">Xem hóa đơn thuê</Link></section> : <div className="checkin-card-list">{rows.map((contract) => {
      const facility = (Array.isArray(branches.data) ? branches.data : []).find((item) => item.code === contract.facilityCode);
      const handedOver = ["ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"].includes(String(contract.status));
      return <article className="checkin-card" key={String(contract.id)}>
        <header className="checkin-card-head"><div><span className="eyebrow">{handedOver ? "THẺ CHECK-IN · ĐÃ BÀN GIAO" : "HỢP ĐỒNG · CHỜ XÁC NHẬN BÀN GIAO"}</span><h2>{display(contract.id)}</h2></div><span className={`badge ${handedOver ? "success" : "pending"}`}>{display(contract.status)}</span></header>
        <div className="checkin-card-grid">
          <section><h3>Khách hàng</h3><dl><div><dt>Họ tên</dt><dd>{display(contract.customerName || session?.user.name)}</dd></div><div><dt>Số điện thoại</dt><dd>{display(contract.customerPhone)}</dd></div><div><dt>Email</dt><dd>{display(session?.user.email)}</dd></div></dl></section>
          <section><h3>Cơ sở &amp; kho</h3><dl><div><dt>Cơ sở</dt><dd>{display(facility?.name || contract.facilityCode)}</dd></div><div><dt>Mã cơ sở</dt><dd><strong>{display(contract.facilityCode)}</strong></dd></div><div><dt>Địa chỉ</dt><dd>{display(facility?.address)}</dd></div><div><dt>Mã Unit</dt><dd><strong>{display(contract.unitCode)}</strong></dd></div></dl></section>
          <section><h3>Hợp đồng &amp; quyền truy cập</h3><dl><div><dt>Thời hạn</dt><dd>{dateTime(contract.startAt)} → {dateTime(contract.endAt)}</dd></div><div><dt>Tiền thuê/tháng</dt><dd>{money(contract.monthlyFee)}</dd></div><div><dt>PIN cơ sở</dt><dd><strong className="pin-display">{handedOver ? display(contract.facilityPin) : "Cấp sau khi bàn giao"}</strong></dd></div><div><dt>PIN Unit</dt><dd><strong className="pin-display">{handedOver ? display(contract.pinCode) : "Cấp sau khi bàn giao"}</strong></dd></div></dl></section>
        </div>
        {!handedOver && <HandoverConfirmationPanel contract={contract} onDone={contracts.reload} />}
        <footer className="checkin-card-footer"><span>{handedOver ? "Bàn giao đã hoàn tất." : "Quyền truy cập chỉ cấp sau khi xác nhận biên bản."}</span>{handedOver && <Link className="button secondary" to="/rentals">Mở quản lý kho</Link>}</footer>
      </article>;
    })}</div>}
  </main>;
}
