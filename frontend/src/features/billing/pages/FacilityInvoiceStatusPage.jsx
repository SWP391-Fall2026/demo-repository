import { useMemo, useState } from "react";
import { billingApi } from "../api/billing.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
function dateTime(value) {
    if (!value)
        return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? display(value) : date.toLocaleString("vi-VN");
}
export default function FacilityInvoiceStatusPage() {
    const { data, error, busy, reload } = useRemote(billingApi.invoices);
    const [status, setStatus] = useState("ALL");
    const rows = Array.isArray(data) ? data : [];
    const visible = useMemo(() => rows.filter((row) => status === "ALL" || row.status === status), [rows, status]);
    const pending = rows.filter((row) => row.status === "PENDING").length;
    const paid = rows.filter((row) => row.status === "PAID").length;
    return <main className="page-content">
    <header className="page-heading"><div><span className="eyebrow">FACILITY MANAGER · BILLING</span><h1>Trạng thái hóa đơn cơ sở</h1><p>Chỉ theo dõi hóa đơn thuộc cơ sở phụ trách. Việc thanh toán do khách hàng thực hiện.</p></div><button className="secondary" type="button" onClick={reload}>Làm mới</button></header>
    {error && <section className="card error" role="alert">{error}</section>}
    <section className="summary-grid"><article className="card"><span>Tổng hóa đơn</span><strong>{rows.length}</strong></article><article className="card"><span>Chờ thanh toán</span><strong>{pending}</strong></article><article className="card"><span>Đã thanh toán</span><strong>{paid}</strong></article></section>
    <section className="card"><div className="section-heading"><div><h2>Hóa đơn</h2><p>Thông tin chỉ đọc theo phạm vi cơ sở.</p></div><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tất cả</option><option value="PENDING">Chờ thanh toán</option><option value="PAID">Đã thanh toán</option><option value="CANCELLED">Đã hủy</option><option value="FAILED">Thất bại</option></select></label></div>
      {busy ? <p>Đang tải hóa đơn…</p> : !visible.length ? <p>Không có hóa đơn theo trạng thái này.</p> : <div className="table-scroll"><table><thead><tr><th>Mã hóa đơn</th><th>Mã đơn / hợp đồng</th><th>Loại</th><th>Số tiền</th><th>Trạng thái</th><th>Lập lúc</th><th>Hạn thanh toán</th></tr></thead><tbody>{visible.map((invoice) => <tr key={String(invoice.id)}><td>{display(invoice.id)}</td><td>{display(invoice.reservationId || invoice.contractId)}</td><td>{invoice.invoiceType === "DEPOSIT" ? "Đặt cọc" : invoice.invoiceType === "RENT" ? "Thuê kho" : display(invoice.invoiceType)}</td><td>{money(invoice.amount)}</td><td><span className={`badge ${invoice.status === "PAID" ? "success" : invoice.status === "PENDING" ? "pending" : "danger"}`}>{invoice.status === "PENDING" ? "Chờ thanh toán" : invoice.status === "PAID" ? "Đã thanh toán" : display(invoice.status)}</span></td><td>{dateTime(invoice.issuedAt)}</td><td>{dateTime(invoice.dueAt)}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
