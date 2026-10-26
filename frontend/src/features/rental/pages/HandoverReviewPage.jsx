import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../../identity/session";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
import RefundEvidencePanel from "../../billing/components/RefundEvidencePanel";

const statuses = { RECORDED: "Đã ghi nhận vấn đề", PENDING: "Chờ Manager duyệt hủy", APPROVED: "Đã duyệt hủy", REJECTED: "Từ chối hủy · cấp lại 24 giờ" };
const kinds = { ISSUE: "Báo vấn đề", CANCELLATION: "Staff đề nghị hủy", TIMEOUT: "Quá hạn xác nhận 24 giờ" };
function snapshot(value) {
    try { return JSON.parse(value || "{}"); } catch { return {}; }
}
export default function HandoverReviewPage() {
    const session = useSession();
    const role = session?.user.role;
    const reviews = useRemote(rentalApi.handoverReviews);
    const contracts = useRemote(rentalApi.list);
    const [selected, setSelected] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    async function open(id) {
        setError("");
        try { setSelected(await rentalApi.handoverReview(id)); }
        catch (cause) { setError(cause.message); }
    }
    async function run(action) {
        setBusy(true); setError(""); setMessage("");
        try {
            await action(); reviews.reload(); contracts.reload();
            if (selected) await open(String(selected.review.id));
            setMessage("Đã ghi nhận và cập nhật hồ sơ.");
        } catch (cause) { setError(cause.message); }
        finally { setBusy(false); }
    }
    async function download(id) {
        setError("");
        try { await rentalApi.downloadReviewEvidence(id); }
        catch (cause) { setError(cause.message); }
    }
    const pendingContracts = (Array.isArray(contracts.data) ? contracts.data : []).filter(c => c.status === "PENDING_HANDOVER");
    const row = selected?.review;
    const original = snapshot(row?.handoverSnapshot);
    return <main className="page-content">
      <header className="page-heading"><div><span className="eyebrow">BÀN GIAO · XỬ LÝ YÊU CẦU</span><h1>Yêu cầu bàn giao và hủy trước nhận kho</h1><p>Hoàn 50% tiền thuê RENT đã thanh toán; giữ lại toàn bộ tiền cọc. Khách liên hệ Staff cơ sở để được hỗ trợ hoàn thủ công.</p></div><button className="secondary" onClick={reviews.reload}>Làm mới</button></header>
      {(error || reviews.error || contracts.error) && <p className="error" role="alert">{error || reviews.error || contracts.error}</p>}
      {message && <p className="notice" role="status">{message}</p>}
      {role === "STAFF" && <section className="card"><h2>Ghi nhận khách yêu cầu hủy</h2><form className="form-grid" onSubmit={event => {
          event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
          void run(async () => { await rentalApi.requestHandoverCancellation(data); form.reset(); });
      }}><label>Hợp đồng chờ bàn giao<select name="contractId" required><option value="">Chọn hợp đồng</option>{pendingContracts.map(c => <option key={String(c.id)} value={String(c.id)}>{String(c.id)} · {String(c.customerName)} · {String(c.unitCode)}</option>)}</select></label>
        <label>Lý do khách từ chối nhận kho / đề nghị hủy<textarea name="reason" required maxLength={4000}/></label>
        <label>Căn cứ khách yêu cầu và nội dung trao đổi<textarea name="onBehalfBasis" required maxLength={4000}/></label>
        <label>Bằng chứng liên quan (PDF/PNG/JPEG, tối đa 10 MB)<input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg"/></label>
        <button disabled={busy}>Chuyển Facility Manager duyệt hủy</button></form></section>}
      <section className="card"><h2>Hồ sơ và thông báo quyết định</h2>{reviews.busy ? <p>Đang tải…</p> : !reviews.data?.length ? <p>Chưa có yêu cầu bàn giao.</p> : <div className="table-scroll"><table><thead><tr><th>Hồ sơ / hợp đồng</th><th>Loại</th><th>Lý do</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{reviews.data.map(item => <tr key={String(item.id)}><td>{display(item.id)}<br/>{display(item.contractId)}</td><td>{kinds[item.kind] || display(item.kind)}</td><td>{display(item.reason)}</td><td>{statuses[item.status] || display(item.status)}{role === "CUSTOMER" && item.decidedAt && !item.customerRespondedAt && <strong> · Quyết định mới</strong>}</td><td><button className="secondary" onClick={() => void open(String(item.id))}>Xem hồ sơ</button></td></tr>)}</tbody></table></div>}</section>
      {row && <section className="card"><h2>Hồ sơ {display(row.id)}</h2><p><strong>{statuses[row.status]}</strong> · {display(row.contractId)} · {display(row.facilityCode)}</p><p>Lý do: {display(row.reason)}</p><p>Hạn xác nhận khi ghi nhận: {display(row.confirmationDeadline)}</p>
        {row.handoverSnapshot && <details><summary>Biên bản tại thời điểm ghi nhận</summary><p>Kho: {display(original.unitCode)} · Gửi lúc: {display(original.sentAt)}</p><p>Hiện trạng: {display(original.unitConditionNotes)}</p><p>Ghi chú Staff: {display(original.staffNotes)}</p><p>Tình trạng: {original.conditionStatus === "CLEAN" ? "Sử dụng bình thường" : original.conditionStatus === "ISSUE" ? "Có vấn đề" : display(original.conditionStatus)}</p></details>}
        <h3>Lịch sử bằng chứng</h3>{selected.evidence.map(item => <div key={String(item.id)}><p>{display(item.createdAt)} · {display(item.note)}</p>{item.fileAvailable && <button className="secondary" onClick={() => void download(String(item.id))}>Tải bằng chứng</button>}</div>)}
        {row.decidedAt && <div className="notice"><h3>Quyết định của Facility Manager</h3><p>Lý do: {display(row.decisionReason)}</p><p>Điều kiện: {display(row.conditions)}</p><p>Hướng xử lý tiếp theo: {display(row.nextSteps)}</p>{row.newConfirmationDeadline && <p>Hạn xác nhận mới: <strong>{display(row.newConfirmationDeadline)}</strong></p>}{row.status === "APPROVED" && <p>Tiền RENT đã thanh toán: {money(row.paidRentAmount)} · Được hoàn: <strong>{money(row.refundAmount)}</strong>. Tiền cọc không hoàn. Liên hệ Staff để thực hiện hoàn thủ công.</p>}</div>}
        {selected.refunds.length > 0 && <div><h3>Theo dõi hoàn tiền</h3>{selected.refunds.map(refund => <section key={String(refund.id)}><p>{display(refund.id)} · {money(refund.approvedAmount)} · {display(refund.status)}</p>{role === "CUSTOMER" && ["EVIDENCE_SUBMITTED", "COMPLETED"].includes(refund.status) && <RefundEvidencePanel refundId={String(refund.id)}/>}</section>)}</div>}
        {row.customerRespondedAt && <p>Khách phản hồi lúc {display(row.customerRespondedAt)}: {display(row.customerResponse)}</p>}
        {role === "STAFF" && ["PENDING", "RECORDED"].includes(row.status) && <form className="form-grid" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); void run(() => rentalApi.addReviewEvidence(String(row.id), data)); }}><h3>Bổ sung bằng chứng</h3><label>Nội dung trao đổi / bằng chứng<textarea name="note" required maxLength={4000}/></label><label>Đính kèm PDF/PNG/JPEG<input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg"/></label><button disabled={busy}>Lưu bổ sung vào lịch sử</button></form>}
        {role === "FMANAGER" && row.status === "PENDING" && <form className="form-grid" onSubmit={event => {
            event.preventDefault(); const data = new FormData(event.currentTarget);
            void run(() => rentalApi.decideHandoverReview(String(row.id), { decision: data.get("decision"), reason: data.get("reason"), conditions: data.get("conditions"), nextSteps: data.get("nextSteps"), policyConfirmed: data.get("policyConfirmed") === "on" }));
        }}><h3>Xem xét hủy đơn</h3><label>Quyết định<select name="decision"><option value="REJECT">Từ chối hủy · cấp lại 24 giờ</option><option value="APPROVE">Phê duyệt hủy · hoàn 50% RENT</option></select></label><label>Lý do quyết định<textarea name="reason" required maxLength={4000}/></label><label>Điều kiện liên quan<textarea name="conditions" required maxLength={4000}/></label><label>Hướng xử lý tiếp theo<textarea name="nextSteps" required maxLength={4000}/></label><label className="check-row"><input name="policyConfirmed" type="checkbox"/> Khi duyệt hủy: xác nhận hoàn 50% RENT và không hoàn tiền cọc</label><button disabled={busy}>Ghi nhận quyết định và thông báo khách</button></form>}
        {role === "CUSTOMER" && row.decidedAt && <><Link className="button secondary" to={`/reservations/${encodeURIComponent(String(row.reservationId))}/pass`}>Mở biên bản bàn giao</Link>{!row.customerRespondedAt && <form className="form-grid" onSubmit={event => { event.preventDefault(); const response = new FormData(event.currentTarget).get("response"); void run(() => rentalApi.respondHandoverReview(String(row.id), { response })); }}><label>Phản hồi quyết định<textarea name="response" required maxLength={4000}/></label><button disabled={busy}>Gửi phản hồi</button></form>}</>}
      </section>}
    </main>;
}
