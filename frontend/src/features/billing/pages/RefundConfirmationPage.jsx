import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money, sortByNewest } from "../../../shared/lib/format";
import { billingApi } from "../api/billing.api";
import RefundEvidencePanel from "../components/RefundEvidencePanel";

export default function RefundConfirmationPage() {
    const refunds = useRemote(billingApi.refunds);
    const [selectedId, setSelectedId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const rows = sortByNewest(refunds.data).filter(row => ["EVIDENCE_SUBMITTED", "COMPLETED"].includes(row.status));
    const selected = rows.find(row => row.id === selectedId);
    async function confirm(event) {
        event.preventDefault();
        if (busy || selected?.status !== "EVIDENCE_SUBMITTED") return;
        const reason = new FormData(event.currentTarget).get("reason");
        setBusy(true); setError(""); setMessage("");
        try { await billingApi.confirmRefund({ id:selected.id, reason }); setMessage("Đã xác nhận hoàn tiền hoàn tất."); refunds.reload(); }
        catch (cause) { setError(cause.message); }
        finally { setBusy(false); }
    }
    return <main className="page-content"><header className="page-heading"><div><span className="eyebrow">STORAGE / XÁC NHẬN HOÀN TIỀN</span><h1>Xác nhận kết quả hoàn tiền</h1><p>Facility Manager đối chiếu bằng chứng chuyển khoản do nhân viên cung cấp và xác nhận hoàn tất giao dịch.</p></div><button className="btn-figma btn-outline btn-sm" onClick={refunds.reload}>Làm mới</button></header>
      {(error || refunds.error) && <p className="error alert-banner alert-danger" role="alert">{error || refunds.error}</p>}{message && <p className="notice alert-banner alert-success" role="status">{message}</p>}
      <section className="card"><h2>Yêu cầu đã có bằng chứng</h2>{refunds.busy && !refunds.data ? <p>Đang tải…</p> : !rows.length ? <p>Chưa có bằng chứng hoàn tiền cần kiểm tra tại cơ sở.</p> : <label>Chọn yêu cầu<select className="form-select-clean" value={selectedId} disabled={busy} onChange={event => { setSelectedId(event.target.value); setError(""); setMessage(""); }}><option value="">Chọn hồ sơ hoàn tiền</option>{rows.map(row => <option key={row.id} value={row.id}>{row.id} · {row.reservationId || row.contractId} · {money(row.approvedAmount)} · {row.status === "COMPLETED" ? "Đã hoàn tất" : "Chờ xác nhận"}</option>)}</select></label>}
        {selected && <section key={selected.id} style={{ marginTop: "20px" }}><dl><dt>Mã yêu cầu</dt><dd>{display(selected.id)}</dd><dt>Đơn đặt chỗ / hợp đồng</dt><dd>{display(selected.reservationId)} · {display(selected.contractId)}</dd><dt>Số tiền đã duyệt</dt><dd>{money(selected.approvedAmount)}</dd><dt>Lý do hoàn tiền</dt><dd>{display(selected.reason)}</dd></dl><RefundEvidencePanel key={selected.id} refundId={selected.id}/>
          {selected.status === "EVIDENCE_SUBMITTED" ? <form className="form-grid" onSubmit={confirm}><label>Ghi chú xác minh bằng chứng<textarea name="reason" required maxLength={800} disabled={busy}/></label><button className="btn-figma btn-primary-dark" disabled={busy}>{busy ? "Đang xác nhận…" : "Xác nhận đã hoàn tiền"}</button></form> : <p className="notice alert-banner alert-success">Đã xác nhận hoàn tất lúc {display(selected.completedAt)}.</p>}
        </section>}
      </section></main>;
}
