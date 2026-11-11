import { useMemo, useState } from "react";
import { billingApi } from "../api/billing.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDateTime, money, statusClass, statusLabel } from "../../../shared/lib/format";
export default function FacilityInvoiceStatusPage() {
    const { data, error, busy, reload } = useRemote(billingApi.invoices);
    const [status, setStatus] = useState("ALL");
    const rows = Array.isArray(data) ? data : [];
    const visible = useMemo(() => rows.filter((row) => status === "ALL" || row.status === status), [rows, status]);
    const pending = rows.filter((row) => row.status === "PENDING").length;
    const paid = rows.filter((row) => row.status === "PAID").length;
    const cancelled = rows.filter((row) => row.status === "CANCELLED" || row.status === "FAILED").length;
    const paidRevenue = rows.filter((row) => row.status === "PAID").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const filteredRevenue = visible.filter((row) => row.status === "PAID").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return <main className="page-content">
    <header className="page-heading"><div><span className="eyebrow">FACILITY MANAGER · BILLING</span><h1>Trạng thái hóa đơn cơ sở</h1><p>Chỉ theo dõi hóa đơn thuộc cơ sở phụ trách. Việc thanh toán do khách hàng thực hiện.</p></div><button className="btn-figma btn-outline btn-sm" type="button" onClick={reload}>Làm mới</button></header>
    {error && <section className="card error" role="alert">{error}</section>}
    <section className="summary-grid">
      <article className="card"><span>Tổng doanh thu đã thu</span><strong style={{ color: "#0066FF" }}>{money(paidRevenue)}</strong></article>
      <article className="card"><span>Tổng hóa đơn</span><strong>{rows.length}</strong></article>
      <article className="card"><span>Đã thanh toán</span><strong style={{ color: "#15803D" }}>{paid}</strong></article>
      <article className="card"><span>Chờ thanh toán</span><strong style={{ color: "#B45309" }}>{pending}</strong></article>
      <article className="card"><span>Đã hủy / Thất bại</span><strong style={{ color: "#B91C1C" }}>{cancelled}</strong></article>
    </section>
    <section className="card"><div className="section-heading"><div><h2>Hóa đơn</h2><p>{status === "ALL" ? `Hiển thị toàn bộ ${visible.length} hóa đơn cơ sở.` : `Đang lọc ${visible.length} hóa đơn · Doanh thu đã thu theo lọc: ${money(filteredRevenue)}`}</p></div><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tất cả ({rows.length})</option><option value="PENDING">Chờ thanh toán ({pending})</option><option value="PAID">Đã thanh toán ({paid})</option><option value="CANCELLED">Đã hủy</option><option value="FAILED">Thất bại</option></select></label></div>
      {busy ? <p>Đang tải hóa đơn…</p> : !visible.length ? <p>Không có hóa đơn theo trạng thái này.</p> : <div className="table-scroll"><table><thead><tr><th>Mã hóa đơn</th><th>Mã đơn / hợp đồng</th><th>Loại</th><th>Số tiền</th><th>Trạng thái</th><th>Lập lúc</th><th>Hạn thanh toán</th></tr></thead><tbody>{visible.map((invoice) => <tr key={String(invoice.id)}><td>{display(invoice.id)}</td><td>{display(invoice.reservationId || invoice.contractId)}</td><td>{invoice.invoiceType === "DEPOSIT" ? "Đặt cọc" : invoice.invoiceType === "RENT" ? "Thuê kho" : invoice.invoiceType === "EXTENSION" ? "Gia hạn" : invoice.invoiceType === "SURCHARGE" ? "Phụ phí" : display(invoice.invoiceType)}</td><td>{money(invoice.amount)}</td><td><span className={`badge ${invoice.status === "PAID" ? "success" : invoice.status === "PENDING" ? "pending" : ["CANCELLED", "FAILED"].includes(invoice.status) ? "danger" : statusClass(invoice.status)}`}>{statusLabel(invoice.status)}</span></td><td>{formatDateTime(invoice.issuedAt)}</td><td>{formatDateTime(invoice.dueAt)}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
