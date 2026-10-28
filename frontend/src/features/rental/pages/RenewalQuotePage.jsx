import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

const renewable = (row) => ["ACTIVE", "EXPIRING_SOON", "OVERDUE"].includes(String(row.status)) && !row.checkoutRequestedAt;

export default function RenewalQuotePage() {
    const { data, error, busy, reload } = useRemote(rentalApi.list);
    const [contractId, setContractId] = useState("");
    const [months, setMonths] = useState(1);
    const [quote, setQuote] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [message, setMessage] = useState("");
    const [working, setWorking] = useState(false);
    const contracts = useMemo(() => (Array.isArray(data) ? data : []).filter(renewable), [data]);
    const selected = contracts.find(c => String(c.id) === String(contractId));

    async function getQuote(event) {
        event.preventDefault(); setWorking(true); setMessage(""); setInvoice(null);
        try { setQuote(await rentalApi.renew({ contractId, months: Number(months) })); }
        catch (e) { setMessage(e.message || "Không lấy được báo giá gia hạn."); }
        finally { setWorking(false); }
    }
    async function createInvoice(event) {
        event.preventDefault(); setWorking(true); setMessage("");
        try {
            const result = await rentalApi.confirmRenewal({ contractId: quote.contractId, months: quote.durationMonths, priceConfirmed: true, expectedMonthlyRate: quote.monthlyRate });
            setInvoice(result); setMessage("Đã tạo hóa đơn gia hạn. Thanh toán để cập nhật ngày hết hạn và PIN.");
        } catch (e) { setMessage(e.message || "Không tạo được hóa đơn gia hạn."); }
        finally { setWorking(false); }
    }
    return <main className="page-content">
        <header className="page-heading"><div><span className="eyebrow">CUSTOMER · RENEWAL</span><h1>Gia hạn kho đang thuê</h1><p>Chọn hợp đồng thật từ tài khoản, lấy báo giá từ backend, rồi thanh toán hóa đơn gia hạn.</p></div><button className="secondary" onClick={reload}>Làm mới</button></header>
        {error && <section className="card error" role="alert">{error}</section>}
        {message && <section className="card notice" role="status">{message}</section>}
        <section className="card"><h2>1. Chọn hợp đồng và lấy báo giá</h2>
            {busy ? <p>Đang tải hợp đồng…</p> : <form onSubmit={getQuote} style={{ display: "grid", gap: 12, maxWidth: 650 }}>
                <label>Hợp đồng<select required value={contractId} onChange={e => { setContractId(e.target.value); setQuote(null); setInvoice(null); }}><option value="">Chọn hợp đồng</option>{contracts.map(c => <option key={c.id} value={c.id}>{c.unitCode} · {c.id} · {c.status} · hết hạn {display(c.endAt)}</option>)}</select></label>
                <label>Số tháng gia hạn<select value={months} onChange={e => setMonths(Number(e.target.value))}><option value={1}>1 tháng</option><option value={3}>3 tháng</option><option value={6}>6 tháng</option><option value={12}>12 tháng</option></select></label>
                <button type="submit" disabled={!selected || working}>{working ? "Đang lấy báo giá…" : "Lấy báo giá"}</button>
            </form>}
            {!busy && !contracts.length && <p className="empty">Không có hợp đồng đủ điều kiện gia hạn.</p>}
        </section>
        {quote && <section className="card"><h2>2. Xác nhận giá và tạo hóa đơn</h2>
            <dl><div><dt>Kho</dt><dd>{display(selected?.unitCode)}</dd></div><div><dt>Giá thuê tháng</dt><dd>{money(quote.monthlyRate)}</dd></div><div><dt>Phí quá hạn</dt><dd>{money(quote.overdueFee)}</dd></div><div><dt>Tổng phải trả</dt><dd><strong>{money(quote.totalAmount)}</strong></dd></div></dl>
            {!invoice && <form onSubmit={createInvoice}><button type="submit" disabled={working}>{working ? "Đang tạo hóa đơn…" : "Xác nhận giá và tạo hóa đơn"}</button></form>}
            {invoice && <p><Link className="button" to={`/invoices/${encodeURIComponent(invoice.id)}/pay`}>Mở hóa đơn {invoice.id} để thanh toán →</Link></p>}
        </section>}
        <p><Link to="/rentals">← Quay lại kho đang thuê</Link></p>
    </main>;
}
