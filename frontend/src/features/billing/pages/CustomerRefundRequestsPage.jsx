import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { billingApi } from "../api/billing.api";
import RefundEvidencePanel from "../components/RefundEvidencePanel";
const statuses = { PENDING: "Chờ phê duyệt", APPROVED: "Đã duyệt · chờ Staff thực hiện", EVIDENCE_SUBMITTED: "Staff đã gửi bằng chứng · chờ Manager xác nhận", COMPLETED: "Đã hoàn tiền", REJECTED: "Đã từ chối", CANCELLED: "Đã hủy yêu cầu" };
export default function CustomerRefundRequestsPage() {
    const refunds = useRemote(billingApi.refunds);
    const [selectedId, setSelectedId] = useState("");
    const rows = Array.isArray(refunds.data) ? refunds.data : [];
    const selected = rows.find(row => row.id === selectedId);
    return (<main className="page-content"><header className="page-heading"><div><h1>Yêu cầu hoàn tiền của tôi</h1><p>Theo dõi yêu cầu và xem bằng chứng chuyển tiền Staff đã gửi cho khoản hoàn của bạn.</p></div><button className="secondary" onClick={refunds.reload}>Làm mới</button></header>
      {refunds.error && <p className="error" role="alert">{refunds.error}</p>}
      <section className="card"><h2>Theo dõi và xem bằng chứng hoàn tiền</h2>{refunds.busy && !refunds.data ? <p>Đang tải yêu cầu…</p> : !rows.length ? <p>Bạn chưa có yêu cầu hoàn tiền.</p> : <label>Chọn yêu cầu của bạn<select value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="">Chọn hồ sơ hoàn tiền</option>{rows.map(row => <option key={row.id} value={row.id}>{row.id} · {row.reservationId || row.contractId} · {statuses[row.status] || row.status}</option>)}</select></label>}
        {selected && <section key={selected.id}><dl><dt>Mã yêu cầu</dt><dd>{display(selected.id)}</dd><dt>Đơn đặt chỗ / hợp đồng</dt><dd>{display(selected.reservationId)} · {display(selected.contractId)}</dd><dt>Trạng thái</dt><dd>{statuses[selected.status] || display(selected.status)}</dd><dt>Số tiền đã duyệt</dt><dd>{money(selected.approvedAmount)}</dd><dt>Lý do</dt><dd>{display(selected.reason)}</dd><dt>Quyết định Manager</dt><dd>{display(selected.decisionReason)}</dd></dl>
          {["EVIDENCE_SUBMITTED", "COMPLETED"].includes(selected.status) ? <><RefundEvidencePanel key={selected.id} refundId={selected.id}/>{selected.status === "EVIDENCE_SUBMITTED" && <p className="notice">Staff đã gửi bằng chứng; Facility Manager đang kiểm tra kết quả hoàn tiền.</p>}</> : <p className="notice">Chưa có bằng chứng chuyển tiền cho yêu cầu này. Bạn có thể xem khi Staff tải bằng chứng.</p>}
        </section>}
      </section>
    </main>);
}
