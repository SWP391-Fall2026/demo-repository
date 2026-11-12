import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDateTime, money, sortByNewest } from "../../../shared/lib/format";
import { usePersistedState } from "../../../shared/lib/persisted-state";
import { billingApi } from "../api/billing.api";
import RefundEvidencePanel from "../components/RefundEvidencePanel";

export default function RefundExecutionPage() {
    const refunds = useRemote(billingApi.refunds);
    const [selectedId, setSelectedId] = usePersistedState("refund-execution.selected-id", "");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [refreshedAt, setRefreshedAt] = useState("");
    const allRefunds = sortByNewest(refunds.data);
    const rows = allRefunds.filter(row => ["APPROVED", "EVIDENCE_SUBMITTED", "COMPLETED"].includes(row.status));
    const pendingCount = allRefunds.filter(row => row.status === "PENDING").length;
    const selected = rows.find(row => row.id === selectedId);
    function handleRefresh() {
        setError("");
        setMessage("");
        refunds.reload();
        setRefreshedAt(formatDateTime(new Date().toISOString()));
    }
    async function submit(event) {
        event.preventDefault();
        if (busy || selected?.status !== "APPROVED") return;
        const form = event.currentTarget;
        const data = new FormData(form);
        setBusy(true); setError(""); setMessage("");
        try {
            await billingApi.upload(selected.id, data.get("file"), String(data.get("reference")));
            setMessage("Đã tải bằng chứng vào yêu cầu hoàn tiền. Chờ Facility Manager xem và xác nhận.");
            form.reset(); refunds.reload();
        } catch (cause) { setError(cause.message); }
        finally { setBusy(false); }
    }
    return <main className="page-content"><header className="page-heading"><div><span className="eyebrow">STORAGE / THỰC HIỆN HOÀN TIỀN</span><h1>Thực hiện hoàn tiền</h1><p>Chọn yêu cầu hoàn tiền đã được phê duyệt và tải bằng chứng chuyển tiền thực tế. Facility Manager sẽ kiểm tra trước khi xác nhận hoàn tất.</p></div><button type="button" className="btn-figma btn-primary-dark btn-sm" onClick={handleRefresh} disabled={refunds.busy || refunds.refreshing}>{(refunds.busy || refunds.refreshing) ? "Đang làm mới…" : "Làm mới"}</button></header>
      {(error || refunds.error) && <p className="error alert-banner alert-danger" role="alert">{error || refunds.error}</p>}
      {message && <p className="notice alert-banner alert-success" role="status">{message}</p>}
      {!message && refreshedAt && !refunds.busy && !refunds.refreshing && <p className="notice" role="status">Đã làm mới dữ liệu lúc {refreshedAt}: có {rows.length} hồ sơ đã duyệt/hoàn tất{pendingCount ? ` và ${pendingCount} yêu cầu đang chờ Manager phê duyệt.` : "."}</p>}
      <section className="card"><h2>Yêu cầu hoàn tiền</h2>{(refunds.busy && refunds.data === undefined) ? <p>Đang tải lại danh sách hoàn tiền…</p> : !rows.length ? <div style={{ display: "grid", gap: "8px" }}><p style={{ margin: 0 }}>Chưa có yêu cầu hoàn tiền đã được Manager phê duyệt tại cơ sở.</p>{pendingCount > 0 && <p className="notice" style={{ margin: 0 }}>Hiện có <strong>{pendingCount}</strong> yêu cầu hoàn tiền mới ở trạng thái chờ duyệt (PENDING). Cần Facility Manager phê duyệt trước khi Staff tải bằng chứng chuyển tiền.</p>}</div> : <label>Chọn yêu cầu<select className="form-select-clean" value={selectedId} onChange={event => { setSelectedId(event.target.value); setError(""); setMessage(""); }} disabled={busy}><option value="">Chọn hồ sơ hoàn tiền</option>{rows.map(row => <option key={row.id} value={row.id}>{row.id} · {row.reservationId || row.contractId} · {money(row.approvedAmount)} · {row.status === "APPROVED" ? "Chờ tải bằng chứng" : row.status === "EVIDENCE_SUBMITTED" ? "Chờ Manager xác nhận" : "Đã hoàn tất"}</option>)}</select></label>}
        {selected && <section key={selected.id} style={{ marginTop: "20px" }}><dl><dt>Mã yêu cầu</dt><dd>{display(selected.id)}</dd><dt>Đơn đặt chỗ / hợp đồng</dt><dd>{display(selected.reservationId)} · {display(selected.contractId)}</dd><dt>Khoản hoàn đã duyệt</dt><dd>{money(selected.approvedAmount)} · {selected.refundType === "DEPOSIT" ? "Tiền cọc" : "Tiền thuê"}</dd><dt>Lý do</dt><dd>{display(selected.reason)}</dd><dt>Quyết định Manager</dt><dd>{display(selected.decisionReason)}</dd></dl>
          {selected.status === "APPROVED" ? <form className="form-grid" onSubmit={submit}><label>Mã giao dịch chuyển tiền<input name="reference" required maxLength={255} disabled={busy}/></label><label>Bằng chứng PNG/JPEG/PDF (tối đa 10 MB)<input name="file" type="file" accept=".png,.jpg,.jpeg,.pdf" required disabled={busy}/></label><button className="btn-figma btn-primary-dark" disabled={busy}>{busy ? "Đang tải…" : "Tải bằng chứng cho yêu cầu này"}</button></form> : <><p className="notice alert-banner alert-success">{selected.status === "EVIDENCE_SUBMITTED" ? "Đã gửi bằng chứng, chờ Facility Manager xác nhận." : "Yêu cầu đã hoàn tất."}</p><RefundEvidencePanel key={selected.id} refundId={selected.id}/></>}
        </section>}
      </section></main>;
}
