import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import type { Row } from "../../../shared/types/api";
import { reservationApi } from "../api/reservation.api";
import { billingApi } from "../../billing/api/billing.api";
import { facilityApi } from "../../facility/api/facility.api";
import CustomerRentalGuide from "../components/CustomerRentalGuide";
import { useSession } from "../../identity/session";

function dateTime(value: unknown) {
  if (!value) return "Chưa có lịch";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? display(value) : date.toLocaleString("vi-VN");
}

export default function ReservationAppointmentPage() {
  const session = useSession();
  const { reservationId = "" } = useParams();
  const listMode = reservationId === "all";
  const reservations = useRemote<Row[] | Row>(() => listMode ? reservationApi.list() : reservationApi.get(reservationId), [reservationId]);
  const invoices = useRemote(billingApi.invoices);
  const facilities = useRemote(facilityApi.facilities);
  const tasks = useRemote(() => {
    const rows = Array.isArray(reservations.data) ? reservations.data : reservations.data ? [reservations.data] : [];
    return Promise.all(rows.map(async (row) => [String(row.id), await reservationApi.checkinTask(String(row.id)).catch(() => ({} as Row))] as const));
  }, [reservations.data]);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => { reservations.reload(); invoices.reload(); tasks.reload(); }, 10000);
    return () => window.clearInterval(timer);
  }, [reservations.reload, invoices.reload, tasks.reload]);
  if (reservations.busy || invoices.busy) return <main className="page-content"><p>Đang tải thẻ hẹn…</p></main>;
  if (reservations.error) return <main className="page-content"><section className="card error" role="alert">{reservations.error}</section></main>;

  const rows = (Array.isArray(reservations.data) ? reservations.data : reservations.data ? [reservations.data] : [])
    .filter((row) => row.status === "RESERVED" || (!listMode && row.status === "CHECKED_IN"));
  const bills = Array.isArray(invoices.data) ? invoices.data : [];
  const branches = Array.isArray(facilities.data) ? facilities.data : [];
  const checkinTasks = new Map(Array.isArray(tasks.data) ? tasks.data : []);
  const cards = rows.filter((reservation) => bills.some((invoice) => invoice.reservationId === reservation.id && invoice.invoiceType === "DEPOSIT" && invoice.status === "PAID"));

  return <main className="page-content">
    <header className="page-heading"><div><span className="eyebrow">ĐẶT CỌC ĐÃ XÁC NHẬN</span><h1>Thẻ hẹn nhận kho</h1><p>Thẻ này xác nhận lịch hẹn sau khi đặt cọc. Chưa phải hợp đồng thuê và chưa cấp quyền truy cập kho.</p></div></header>
    <CustomerRentalGuide active={3} />
    {!cards.length ? <section className="card empty"><h2>Chưa có thẻ hẹn</h2><p>Thẻ hẹn xuất hiện sau khi tiền cọc được xác nhận và đơn chuyển sang trạng thái đã giữ chỗ.</p><Link to="/invoices/all/pay">Xem hóa đơn</Link></section> : <div className="appointment-card-list">
      {cards.map((reservation) => {
        const facility = branches.find((item) => item.code === reservation.facilityCode);
        const deposit = bills.find((item) => item.reservationId === reservation.id && item.invoiceType === "DEPOSIT");
        const rent = bills.find((item) => item.reservationId === reservation.id && item.invoiceType === "RENT");
        const checkinTask = checkinTasks.get(String(reservation.id));
        const handedOver = reservation.status === "CHECKED_IN";
        return <article className="appointment-card" key={String(reservation.id)}>
          <header className="appointment-card-head"><div><span className="eyebrow">THẺ HẸN · CHƯA PHẢI HỢP ĐỒNG</span><h2>{display(reservation.id)}</h2></div><span className="badge success">ĐÃ CỌC · ĐÃ GIỮ CHỖ</span></header>
          <div className="appointment-card-grid">
            <section><h3>Khách hàng</h3><dl><div><dt>Họ tên</dt><dd>{display(reservation.customerName || session?.user.name)}</dd></div><div><dt>Số điện thoại</dt><dd>{display(reservation.customerPhone)}</dd></div><div><dt>Email</dt><dd>{display(session?.user.email)}</dd></div></dl></section>
            <section><h3>Cơ sở &amp; kho</h3><dl><div><dt>Cơ sở</dt><dd>{display(facility?.name || reservation.facilityCode)}</dd></div><div><dt>Địa chỉ</dt><dd>{display(facility?.address)}</dd></div><div><dt>Loại kho / diện tích</dt><dd>{display(reservation.unitType)} · {display(reservation.unitCode ? reservation.unitCode : "Đang chờ quản lý gán kho")}</dd></div></dl></section>
            <section><h3>Lịch &amp; khoản thanh toán</h3><dl><div><dt>Giờ hẹn check-in</dt><dd>{dateTime(reservation.appointmentAt || reservation.appointment)}</dd></div><div><dt>Bắt đầu thuê · thời hạn</dt><dd>{display(reservation.startDate)} · {display(reservation.durationMonths)} tháng</dd></div><div><dt>Tiền cọc</dt><dd>{money(deposit?.amount)} · Đã thanh toán</dd></div><div><dt>Tiền thuê kỳ đầu</dt><dd>{rent?.status === "PAID" ? `${money(rent.amount)} · Đã thanh toán` : rent ? `${money(rent.amount)} · Chưa thanh toán` : "Chưa phát hành"}</dd></div></dl></section>
          </div>
          {Boolean(reservation.identityVerifiedAt && !reservation.contractTermsAcceptedAt) && <p className="notice" role="status">Facility Staff đã xác nhận check-in. Hợp đồng và điều khoản đang chờ bạn xem, xác nhận.</p>}
          <footer className="appointment-card-footer"><p>Đến cơ sở đúng giờ hẹn. Nhân viên sẽ đối chiếu giấy tờ. Hợp đồng chỉ tạo sau khi Staff xác nhận check-in; PIN cấp sau khi thanh toán hóa đơn hợp đồng.</p>{handedOver ? <Link className="button" to={`/reservations/${encodeURIComponent(String(reservation.id))}/pass`}>Mở thẻ Check-in &amp; hợp đồng →</Link> : rent?.status === "PAID" ? <><span>Đã thanh toán hợp đồng · mở thẻ Check-in để xem biên bản và xác nhận nhận kho sau khi Staff gửi.</span><Link className="button" to={`/reservations/${encodeURIComponent(String(reservation.id))}/pass`}>Xem biên bản &amp; xác nhận bàn giao →</Link></> : reservation.identityVerifiedAt && reservation.contractTermsAcceptedAt ? <Link className="button" to={`/invoices/${encodeURIComponent(String(rent?.id || "all"))}/pay`}>Thanh toán hóa đơn hợp đồng →</Link> : reservation.identityVerifiedAt ? <Link className="button" to={`/reservations/${encodeURIComponent(String(reservation.id))}/contract-offer`}>Xem và xác nhận hợp đồng →</Link> : reservation.unitCode && !checkinTask?.id ? <button type="button" disabled={requesting === reservation.id} onClick={async () => { setRequesting(String(reservation.id)); setRequestError(""); try { await reservationApi.requestCheckin(String(reservation.id)); tasks.reload(); } catch (cause) { setRequestError(cause instanceof Error ? cause.message : "Không gửi được yêu cầu check-in"); } finally { setRequesting(null); } }}>{requesting === reservation.id ? "Đang gửi yêu cầu…" : "Gửi yêu cầu check-in tới Manager"}</button> : checkinTask?.staffId ? <span>Đã phân công Staff: {display(checkinTask.staff)} · {display(checkinTask.status)}</span> : <span>{checkinTask?.id ? "Đã gửi yêu cầu tới Manager · Chờ phân công Staff" : "Đang chờ quản lý gán mã kho"}</span>}</footer>
          {requestError && <p className="error" role="alert">{requestError}</p>}
        </article>;
      })}
    </div>}
    <p className="card notice">Thẻ hẹn chưa xác nhận hợp đồng, chưa phải biên bản bàn giao và không thay thế PIN/thẻ truy cập.</p>
  </main>;
}
