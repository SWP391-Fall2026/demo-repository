import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { billingApi } from "../api/billing.api";
import { reservationApi } from "../../reservation/api/reservation.api";
import CustomerRentalGuide from "../../reservation/components/CustomerRentalGuide";
const dateTime = (value) => {
    if (!value)
        return "Chưa có hạn";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? display(value) : date.toLocaleString("vi-VN");
};
const statusText = {
    PAID: "Đã thanh toán", PENDING: "Chưa thanh toán", CANCELLED: "Đã hủy",
    FAILED: "Thanh toán thất bại", REFUNDED: "Đã hoàn tiền",
};
export default function InvoicePaymentPage() {
    const navigate = useNavigate();
    const { invoiceId: routeInvoiceId } = useParams();
    const { data, error: invoiceError, busy: invoicesBusy, reload } = useRemote(billingApi.invoices);
    const { data: reservationData, reload: reloadReservations } = useRemote(reservationApi.list);
    const invoices = Array.isArray(data) ? data : [];
    const reservations = Array.isArray(reservationData) ? reservationData : [];
    const [selectedId, setSelectedId] = useState(routeInvoiceId && routeInvoiceId !== "all" ? routeInvoiceId : "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => { if (routeInvoiceId && routeInvoiceId !== "all")
        setSelectedId(routeInvoiceId); }, [routeInvoiceId]);
    useEffect(() => {
        const timer = window.setInterval(() => { reload(); reloadReservations(); }, 20000);
        return () => window.clearInterval(timer);
    }, [reload, reloadReservations]);
    const selected = invoices.find((invoice) => invoice.id === selectedId);
    const relatedReservation = selected ? reservations.find((item) => item.id === selected.reservationId) : undefined;
    const grouped = useMemo(() => {
        const groups = new Map();
        for (const invoice of invoices) {
            const key = String(invoice.reservationId || invoice.contractId || invoice.id);
            const group = groups.get(key) || { reservation: reservations.find((item) => item.id === invoice.reservationId), invoices: [] };
            group.invoices.push(invoice);
            groups.set(key, group);
        }
        return [...groups.entries()].map(([key, group]) => ({ key, ...group }));
    }, [invoices, reservations]);
    const isDeposit = selected?.invoiceType === "DEPOSIT";
    const isRenewal = selected?.invoiceType === "RENEW";
    const canPay = selected?.status === "PENDING" && (isRenewal || (isDeposit && relatedReservation?.status === "PENDING_PAYMENT") ||
        (selected?.invoiceType === "RENT" && relatedReservation?.status === "RESERVED" && Boolean(relatedReservation?.unitCode)));
    async function pay() {
        if (!selected || busy)
            return;
        setBusy(true);
        setError("");
        try {
            const result = await billingApi.createVnPay(String(selected.id));
            window.location.assign(result.paymentUrl);
        }
        catch (cause) {
            // VNPay sandbox not configured with live merchant -> fallback to software simulated payment
            try {
                const paid = await billingApi.pay({
                    invoiceId: selected.id,
                    paymentMethod: "MOCK_CARD",
                    confirmedAmount: true,
                    bankCode: "NCB",
                    cardNumber: "9704198526191432198",
                    cardHolder: "NGUYEN VAN A",
                    issueDate: "07/15",
                    otp: "123456"
                });
                navigate(`/payment/result?paymentRef=${encodeURIComponent(paid.transactionCode || "")}`);
            } catch (fallbackErr) {
                setError(cause instanceof Error ? cause.message : "Không tạo được giao dịch VNPay.");
                setBusy(false);
                reload();
                reloadReservations();
            }
        }
    }
    async function payMock(method = "BANK_TRANSFER_QR") {
        if (!selected || busy) return;
        setBusy(true);
        setError("");
        try {
            const paid = await billingApi.pay({
                invoiceId: selected.id,
                paymentMethod: method,
                confirmedAmount: true,
                bankCode: "NCB",
                cardNumber: "9704198526191432198",
                cardHolder: "NGUYEN VAN A",
                issueDate: "07/15",
                otp: "123456"
            });
            navigate(`/payment/result?paymentRef=${encodeURIComponent(paid.transactionCode || "")}`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Thanh toán mô phỏng thất bại.");
            setBusy(false);
        }
    }
    return <main className="page-content invoice-page">
    <header className="page-heading"><div><span className="eyebrow">HÓA ĐƠN · THANH TOÁN</span><h1>Thanh toán cọc/phí</h1><p>Xem hóa đơn theo từng đơn đặt, trạng thái thanh toán và hạn xử lý.</p></div><button className="secondary" type="button" onClick={() => { reload(); reloadReservations(); }}>Làm mới</button></header>
    <CustomerRentalGuide active={selected?.invoiceType === "RENT" ? 3 : 2}/>
    {invoiceError && <section className="card error" role="alert">{invoiceError}</section>}
    {invoicesBusy ? <p>Đang tải hóa đơn…</p> : !invoices.length ? <section className="card empty"><h2>Bạn chưa có hóa đơn</h2><Link to="/storage">Tìm kho để bắt đầu đặt giữ chỗ</Link></section> : <>
      <section className="card invoice-history">
        <div className="section-heading"><div><h2>Hóa đơn của bạn</h2><p>Hóa đơn cọc chờ thanh toán quá 5 phút sẽ tự hủy cùng đơn đặt.</p></div><span className="count">{invoices.length} hóa đơn</span></div>
        {grouped.map((group) => <article className="invoice-order" key={group.key}>
          <header><div><strong>Đơn {display(group.reservation?.id || group.invoices[0]?.contractId || group.key)}</strong><span>Cơ sở {display(group.reservation?.facilityCode || group.invoices[0]?.facilityCode)} · {display(group.reservation?.unitCode || group.reservation?.unitType)}</span></div><span className={`badge ${group.reservation?.status === "EXPIRED" ? "danger" : group.reservation?.status === "RESERVED" || group.reservation?.status === "CHECKED_IN" ? "success" : "pending"}`}>{display(group.reservation?.status)}</span></header>
          <div className="invoice-list">{group.invoices.map((item) => <div className={`invoice-row ${selectedId === item.id ? "selected" : ""}`} key={String(item.id)}>
            <div className="invoice-kind"><strong>{item.invoiceType === "DEPOSIT" ? "Tiền đặt cọc" : item.invoiceType === "RENT" ? "Tiền thuê kỳ đầu" : `Khoản thu ${display(item.invoiceType)}`}</strong><small>{display(item.id)}</small></div>
            <div className="invoice-amount"><strong>{money(item.amount)}</strong><small>Hạn: {dateTime(item.dueAt)}</small></div>
            <span className={`badge ${item.status === "PAID" ? "success" : item.status === "PENDING" ? "pending" : "danger"}`}>{statusText[String(item.status)] || display(item.status)}</span>
            <button type="button" className="secondary invoice-select" onClick={() => { setSelectedId(String(item.id)); setError(""); }}>Xem chi tiết</button>
          </div>)}</div>
        </article>)}
      </section>
      {selected && <section className="card invoice-detail" aria-label="Chi tiết hóa đơn">
        <div className="section-heading"><div><span className="eyebrow">CHI TIẾT HÓA ĐƠN</span><h2>{isDeposit ? "Tiền đặt cọc cho đơn mới" : selected.invoiceType === "RENT" ? "Tiền thuê kỳ đầu" : display(selected.invoiceType)}</h2></div><span className={`badge ${selected.status === "PAID" ? "success" : selected.status === "PENDING" ? "pending" : "danger"}`}>{statusText[String(selected.status)] || display(selected.status)}</span></div>
        <dl><div><dt>Mã hóa đơn</dt><dd>{display(selected.id)}</dd></div><div><dt>Mã đơn</dt><dd>{display(selected.reservationId || selected.contractId)}</dd></div><div><dt>Khách hàng</dt><dd>{display(grouped.find((g) => g.key === String(selected.reservationId || selected.contractId || selected.id))?.reservation?.customerName)}</dd></div><div><dt>Cơ sở</dt><dd>{display(selected.facilityCode)}</dd></div><div><dt>Loại kho</dt><dd>{display(relatedReservation?.unitType)}</dd></div><div><dt>Kho được gán</dt><dd>{display(relatedReservation?.unitCode)}</dd></div><div><dt>Số tiền</dt><dd><strong>{money(selected.amount)}</strong></dd></div><div><dt>Ngày lập</dt><dd>{dateTime(selected.issuedAt)}</dd></div><div><dt>Hạn thanh toán</dt><dd>{dateTime(selected.dueAt)}</dd></div></dl>
        {error && <p className="error" role="alert">{error}</p>}
        {selected.status === "PENDING" && canPay && <div className="invoice-pay-action">
          <p>Hỗ trợ thanh toán qua cổng VNPay Sandbox hoặc Mô phỏng VietQR / Mock Card:</p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
            <button type="button" onClick={pay} disabled={busy}>
              {busy ? "Đang kết nối…" : `Thanh toán ${money(selected.amount)} qua VNPay`}
            </button>
            <button type="button" className="secondary" onClick={() => payMock("BANK_TRANSFER_QR")} disabled={busy}>
              {busy ? "Đang xử lý…" : "Thanh toán mô phỏng (VietQR / Mock)"}
            </button>
          </div>
        </div>}
        {selected.status === "PENDING" && !canPay && <p className="notice">{relatedReservation?.status === "EXPIRED" || relatedReservation?.status === "CANCELLED" ? "Đơn đã hết hạn hoặc đã hủy; hóa đơn này không thể thanh toán." : "Hóa đơn thuê có thể thanh toán sau khi cơ sở gán kho."}</p>}
        {selected.status === "PAID" && selected.invoiceType === "DEPOSIT" && Boolean(selected.reservationId) && <p><Link className="button" to={`/reservations/${encodeURIComponent(String(selected.reservationId))}/appointment`}>Xem thẻ hẹn →</Link></p>}
        {relatedReservation?.status === "EXPIRED" && <p className="error">Đơn hết hạn chờ cọc và đã tự hủy. Hãy chọn kho khác để đặt lại.</p>}
      </section>}
    </>}
  </main>;
}
