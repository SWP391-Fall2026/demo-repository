import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { billingApi } from "../api/billing.api";
import { reservationApi } from "../../reservation/api/reservation.api";
import { rentalApi } from "../../rental/api/rental.api";
import { CustomerBreadcrumb, CustomerEmpty, CustomerHeading, CustomerSteps, Icon, Status } from "../../customer/components/StitchCustomer";
import "../../customer/components/customer.css";
const dateTime = (value) => { if (!value) return "Chưa có hạn"; const d = new Date(String(value)); return Number.isNaN(d.getTime()) ? display(value) : d.toLocaleString("vi-VN"); };
function HoldCountdown({ until }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const seconds = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
  return Number.isFinite(seconds) ? <span className="sc-hold-countdown"><Icon>timer</Icon>{String(Math.floor(seconds / 60)).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</span> : null;
}
const statuses = { PAID: "Đã thanh toán", PENDING: "Chờ thanh toán", CANCELLED: "Đã hủy", FAILED: "Thanh toán thất bại", REFUNDED: "Đã hoàn tiền" };
const invoiceLabels = { DEPOSIT: "Tiền đặt cọc", RENT: "Tiền thuê kỳ đầu", RENEW: "Tiền gia hạn", EXTRA: "Phụ phí phát sinh" };
export default function InvoicePaymentPage() {
  const { invoiceId = "all" } = useParams(); const navigate = useNavigate(); const remote = useRemote(billingApi.invoices); const reservationRemote = useRemote(reservationApi.list); const contractRemote = useRemote(rentalApi.list); const bankRemote = useRemote(billingApi.bankInfo);
  const invoices = Array.isArray(remote.data) ? remote.data : []; const reservations = Array.isArray(reservationRemote.data) ? reservationRemote.data : []; const contracts = Array.isArray(contractRemote.data) ? contractRemote.data : [];
  const [confirmed, setConfirmed] = useState(false);
  const [method, setMethod] = useState("vnpay");
  const simulationEnabled = !bankRemote.busy && !bankRemote.error && bankRemote.data?.simulationEnabled === true;
  useEffect(() => { if (!simulationEnabled && method === "qr") setMethod("vnpay"); }, [simulationEnabled, method]);
  const [selectedId, setSelectedId] = useState(invoiceId !== "all" ? invoiceId : ""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (invoiceId !== "all") setSelectedId(invoiceId); }, [invoiceId]);
  useEffect(() => { if (!selectedId && invoices.length) setSelectedId(String(invoices.find(i => i.status === "PENDING")?.id || invoices[0].id)); }, [selectedId, remote.data]);
  function reload() { remote.reload(); reservationRemote.reload(); contractRemote.reload(); bankRemote.reload(); }
  useEffect(() => { const timer = window.setInterval(() => { remote.reload(); reservationRemote.reload(); contractRemote.reload(); }, 20000); return () => window.clearInterval(timer); }, [remote.reload, reservationRemote.reload, contractRemote.reload]);
  const selected = invoices.find(i => String(i.id) === selectedId);
  const contract = selected ? contracts.find(c => c.id === selected.contractId || Boolean(selected.reservationId) && c.reservationId === selected.reservationId) : null;
  const reservation = selected ? reservations.find(r => r.id === (selected.reservationId || contract?.reservationId)) : null;
  const renewal = selected?.invoiceType === "RENEW", extra = selected?.invoiceType === "EXTRA";
  const label = invoiceLabels[selected?.invoiceType] || "Hóa đơn";
  const backPath = renewal || extra ? "/rentals" : "/reservations";
  const backLabel = renewal || extra ? "Kho đang thuê" : "Đơn đặt của tôi";
  const renewalMonths = renewal && /^RENEW:\d+$/.test(selected.description || "") ? Number(selected.description.split(":")[1]) : null;
  const description = renewalMonths ? `Gia hạn thêm ${renewalMonths} tháng` : selected?.description;
  const deposit = selected?.invoiceType === "DEPOSIT"; const canPay = selected?.status === "PENDING" && (selected.invoiceType === "EXTRA" || selected.invoiceType === "RENEW" || deposit && reservation?.status === "PENDING_PAYMENT" || selected.invoiceType === "RENT" && reservation?.status === "RESERVED" && Boolean(reservation.unitCode));
  async function pay() { if (!selected || busy || !confirmed) return; setBusy(true); setError(""); try {
    if (method === "qr") {
      if (!simulationEnabled) throw new Error("Thanh toán QR mô phỏng chưa được bật trong môi trường này. Vui lòng chọn VNPay.");
      const result = await billingApi.pay({ invoiceId: String(selected.id), paymentMethod: "BANK_TRANSFER_QR", confirmedAmount: true });
      const reference = result?.transactionCode || result?.id;
      if (!reference) throw new Error("Máy chủ chưa trả mã giao dịch.");
      navigate(`/payment/result?status=success&paymentRef=${encodeURIComponent(reference)}`);
      return;
    }
    const result = await billingApi.createVnPay(String(selected.id)); if (!result.paymentUrl) throw new Error("Máy chủ chưa trả liên kết thanh toán."); window.location.assign(result.paymentUrl);
  } catch (cause) { setError(cause instanceof Error ? cause.message : "Không tạo được giao dịch thanh toán."); setBusy(false); reload(); } }
  return <main className="page-content stitch-customer sc-invoice"><CustomerBreadcrumb items={[{ label: backLabel, to: backPath }, { label: "Thanh toán" }]} /><CustomerHeading title={deposit ? "Thanh toán tiền cọc" : renewal ? "Thanh toán gia hạn" : extra ? "Thanh toán phụ phí" : "Thanh toán hóa đơn"} description="Kiểm tra thông tin hóa đơn và số tiền cần thanh toán trước khi tiếp tục." icon="payments" action={<button className="secondary" onClick={reload}><Icon>refresh</Icon>Làm mới</button>} />
    {deposit && <CustomerSteps active={2} steps={["Đặt giữ chỗ", "Thanh toán cọc"]}/>}
    {remote.error ? <CustomerEmpty title="Không thể tải hóa đơn" description={remote.error} icon="cloud_off" error action={<button onClick={remote.reload}>Thử lại</button>}/> : remote.busy && !remote.data ? <section className="card"><p>Đang tải hóa đơn…</p></section> : !invoices.length ? <CustomerEmpty title="Bạn chưa có hóa đơn" description="Tìm kho phù hợp để bắt đầu đặt giữ chỗ." icon="receipt_long" action={<Link className="button" to="/storage">Tìm kho lưu trữ</Link>}/> : <>
      {selected && <div className="stitch-invoice-grid"><section className="card invoice-detail"><div className="stitch-section-title"><h2><Icon>receipt_long</Icon>{deposit ? "Tóm tắt đơn đặt kho" : renewal ? "Hóa đơn gia hạn hợp đồng" : extra ? "Hóa đơn phụ phí" : "Hóa đơn tiền thuê"}</h2>{deposit && reservation?.holdUntil && selected.status === "PENDING" && <HoldCountdown until={reservation.holdUntil}/>}<Status tone={selected.status === "PAID" ? "green" : selected.status === "PENDING" ? "orange" : "red"}>{statuses[selected.status] || display(selected.status)}</Status></div>
        <div className="stitch-payment-storage"><span className="stitch-payment-unit-icon"><Icon>warehouse</Icon></span><div><span className="eyebrow">{display(selected.facilityCode || contract?.facilityCode || reservation?.facilityCode)}</span><h2>{reservation?.unitType ? `Kho ${reservation.unitType}` : contract?.unitCode ? `Kho ${contract.unitCode}` : "Kho liên quan hóa đơn"}</h2><p>{display(contract?.unitCode || reservation?.unitCode || (deposit ? "Mã kho được gán sau khi đặt cọc" : "Đang tải thông tin kho"))}</p></div></div>
        <dl className="stitch-definition">
          {(selected.reservationId || contract?.reservationId) && <div><dt>Mã đơn đặt</dt><dd>{display(selected.reservationId || contract?.reservationId)}</dd></div>}
          {(selected.contractId || contract?.id) && <div><dt>Mã hợp đồng</dt><dd>{display(selected.contractId || contract?.id)}</dd></div>}
          <div><dt>Mã hóa đơn</dt><dd>{display(selected.id)}</dd></div><div><dt>Loại hóa đơn</dt><dd>{label}</dd></div>
          <div><dt>Khách hàng</dt><dd>{display(contract?.customerName || reservation?.customerName)}</dd></div><div><dt>Cơ sở</dt><dd>{display(selected.facilityCode || contract?.facilityCode || reservation?.facilityCode)}</dd></div>
          {description && <div><dt>Nội dung</dt><dd>{description}</dd></div>}
          {!extra && <div><dt>{renewal ? "Thời gian gia hạn" : "Thời hạn thuê"}</dt><dd>{renewalMonths ? `${renewalMonths} tháng` : reservation?.durationMonths || contract?.durationMonths ? `${reservation?.durationMonths || contract?.durationMonths} tháng` : "Theo hợp đồng"}</dd></div>}
          {!renewal && !extra && <div><dt>Lịch hẹn nhận kho</dt><dd>{dateTime(reservation?.appointmentAt)}</dd></div>}
          <div><dt>Ngày lập</dt><dd>{dateTime(selected.issuedAt)}</dd></div><div><dt>Hạn thanh toán</dt><dd>{dateTime(selected.dueAt)}</dd></div><div className="total"><dt>{label}</dt><dd>{money(selected.amount)}</dd></div>
        </dl><div className="stitch-note"><Icon>info</Icon><p>{deposit ? "Tiền cọc giữ chỗ theo loại kho và cơ sở đã chọn. Thanh toán trong 5 phút để tránh đơn tự hết hạn." : renewal ? "Thời hạn hợp đồng chỉ được cập nhật sau khi hóa đơn gia hạn được xác nhận đã thanh toán." : extra ? "Phụ phí được ghi nhận theo hợp đồng và nội dung hóa đơn. Thanh toán phụ phí không tạo lượt bàn giao kho mới." : "Hóa đơn và số tiền được lấy trực tiếp từ backend. Giao dịch chỉ hoàn tất khi nhận xác nhận từ cổng thanh toán."}</p></div>
        {(contractRemote.error || reservationRemote.error) && <p className="error" role="status">Chưa tải đủ thông tin kho liên quan. {contractRemote.error || reservationRemote.error}</p>}</section>
        <aside className="card"><div className="stitch-section-title"><h2><Icon>account_balance</Icon>Phương thức thanh toán</h2></div><div className="sc-payment-methods">{[["vnpay","Cổng thanh toán VNPay","Thẻ ngân hàng / tài khoản"],["qr","Chuyển khoản QR","VietQR mô phỏng"],["counter","Tại chi nhánh","Chỉ Staff ghi nhận tại quầy"]].filter(([value])=>value !== "qr" || simulationEnabled).map(([value,label,desc])=><button type="button" className={method===value?"selected":""} key={value} disabled={value === "counter"} onClick={()=>setMethod(value)}><Icon>{value==="vnpay"?"account_balance_wallet":value==="qr"?"qr_code_2":"storefront"}</Icon><span><strong>{label}</strong><small>{desc}</small></span><Icon>{method===value?"radio_button_checked":"radio_button_unchecked"}</Icon></button>)}</div>{method==="vnpay"?<div className="stitch-payment-option"><Icon>account_balance_wallet</Icon><div><strong>Cổng thanh toán VNPay</strong><p>Giao dịch chuyển tới cổng thanh toán để xác minh.</p></div></div>:method === "qr" ? <div className="stitch-payment-option"><Icon>qr_code_2</Icon><div><strong>Chuyển khoản QR</strong><p>Xác nhận chuyển khoản QR qua backend. Hệ thống ghi nhận giao dịch và cập nhật hóa đơn ngay.</p></div></div>:<div className="stitch-note"><Icon>info</Icon><p>Thanh toán tại quầy chỉ do Staff ghi nhận sau khi nhận tiền trực tiếp.</p></div>}<div className="stitch-payment-total"><span>Tổng cần thanh toán</span><strong>{money(selected.amount)}</strong></div>{error && <p className="error" role="alert">{error}</p>}{canPay && <label className="sc-check-label sc-top-gap"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>Tôi xác nhận thông tin đơn và số tiền thanh toán.</label>}{canPay && ["vnpay", "qr"].includes(method) ? <button className="stitch-payment-button" type="button" onClick={pay} disabled={busy || !confirmed}>{busy ? "Đang kết nối…" : method === "qr" ? "Xác nhận chuyển khoản QR" : "Tiếp tục thanh toán"}<Icon>arrow_forward</Icon></button> : <div className="stitch-note"><Icon>{selected.status === "PAID" ? "check_circle" : "info"}</Icon><p>{selected.status === "PAID" ? "Hóa đơn đã thanh toán thành công." : reservation?.status === "EXPIRED" || reservation?.status === "CANCELLED" ? "Đơn đã hết hạn hoặc đã hủy; không thể thanh toán hóa đơn này." : "Hóa đơn chưa đủ điều kiện thanh toán. Kiểm tra trạng thái đơn đặt."}</p></div>}{deposit && selected.status === "PAID" && selected.reservationId && <Link className="button secondary stitch-payment-button" to={`/reservations/${encodeURIComponent(String(selected.reservationId))}/appointment`}>Xem thẻ hẹn</Link>}<p className="stitch-payment-security"><Icon>verified_user</Icon>Giao dịch được xác nhận trực tiếp qua cổng thanh toán.</p><Link className="stitch-payment-back" to={backPath}><Icon>arrow_back</Icon>Quay lại {backLabel.toLowerCase()}</Link></aside></div>}
      <section className="card stitch-invoice-history"><details><summary>Hóa đơn của bạn ({invoices.length})</summary><div className="stitch-invoice-list">{invoices.map(item => <div className={`stitch-invoice-list-row ${selectedId === String(item.id) ? "selected" : ""}`} key={item.id}><span><strong>{invoiceLabels[item.invoiceType] || "Khoản thu " + display(item.invoiceType)}</strong><small>{display(item.id)}</small></span><strong>{money(item.amount)}</strong><Status tone={item.status === "PAID" ? "green" : item.status === "PENDING" ? "orange" : "red"}>{statuses[item.status] || display(item.status)}</Status><button className="secondary" type="button" onClick={() => { setSelectedId(String(item.id)); setError(""); setConfirmed(false); setMethod("vnpay"); setConfirmed(false); }}>Xem chi tiết</button></div>)}</div></details></section>
    </>}
  </main>;
}
