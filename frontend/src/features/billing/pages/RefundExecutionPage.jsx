import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { billingApi } from "../api/billing.api";
import RefundEvidencePanel from "../components/RefundEvidencePanel";

export default function RefundExecutionPage() {
    const refunds = useRemote(billingApi.refunds);
    const [selectedId, setSelectedId] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const rows = (Array.isArray(refunds.data) ? refunds.data : []).filter(row => ["APPROVED", "EVIDENCE_SUBMITTED", "COMPLETED"].includes(row.status));
    const selected = rows.find(row => row.id === selectedId);
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
    return <main className="page-content"><header className="page-heading"><div><h1>Thực hiện hoàn tiền</h1><p>Chọn yêu cầu hoàn tiền đã được phê duyệt và tải bằng chứng chuyển tiền thực tế. Facility Manager sẽ kiểm tra trước khi xác nhận hoàn tất.</p></div><button className="secondary" onClick={refunds.reload}>Làm mới</button></header>
      {(error || refunds.error) && <p className="error" role="alert">{error || refunds.error}</p>}{message && <p className="notice" role="status">{message}</p>}
      <section className="card"><h2>Yêu cầu hoàn tiền</h2>{refunds.busy && !refunds.data ? <p>Đang tải…</p> : !rows.length ? <p>Chưa có yêu cầu hoàn tiền được phê duyệt tại cơ sở.</p> : <label>Chọn yêu cầu<select value={selectedId} onChange={event => { setSelectedId(event.target.value); setError(""); setMessage(""); }} disabled={busy}><option value="">Chọn hồ sơ hoàn tiền</option>{rows.map(row => <option key={row.id} value={row.id}>{row.id} · {row.reservationId || row.contractId} · {money(row.approvedAmount)} · {row.status === "APPROVED" ? "Chờ tải bằng chứng" : row.status === "EVIDENCE_SUBMITTED" ? "Chờ Manager xác nhận" : "Đã hoàn tất"}</option>)}</select></label>}
        {selected && <section key={selected.id}><dl><dt>Mã yêu cầu</dt><dd>{display(selected.id)}</dd><dt>Đơn đặt chỗ / hợp đồng</dt><dd>{display(selected.reservationId)} · {display(selected.contractId)}</dd><dt>Khoản hoàn đã duyệt</dt><dd>{money(selected.approvedAmount)} · {selected.refundType === "DEPOSIT" ? "Tiền cọc" : "Tiền thuê"}</dd><dt>Lý do</dt><dd>{display(selected.reason)}</dd><dt>Quyết định Manager</dt><dd>{display(selected.decisionReason)}</dd></dl>
          {selected.status === "APPROVED" ? <form className="form-grid" onSubmit={submit}><label>Mã giao dịch chuyển tiền<input name="reference" required maxLength={255} disabled={busy}/></label><label>Bằng chứng PNG/JPEG/PDF (tối đa 10 MB)<input name="file" type="file" accept=".png,.jpg,.jpeg,.pdf" required disabled={busy}/></label><button disabled={busy}>{busy ? "Đang tải…" : "Tải bằng chứng cho yêu cầu này"}</button></form> : <><p className="notice">{selected.status === "EVIDENCE_SUBMITTED" ? "Đã gửi bằng chứng, chờ Facility Manager xác nhận." : "Yêu cầu đã hoàn tất."}</p><RefundEvidencePanel key={selected.id} refundId={selected.id}/></>}
        </section>}
      </section></main>;
}
