import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { rentalApi } from "../api/rental.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";

export default function ReturnInspectionPage() {
    const { contractId } = useParams();
    const remote = useRemote(workforceApi.list);
    const task = useMemo(() => (remote.data || []).find(row => row.taskType === "RETURN" && row.contractId === contractId), [remote.data, contractId]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function submit(event) {
        event.preventDefault(); setBusy(true); setError("");
        const body = Object.fromEntries(new FormData(event.currentTarget));
        body.unitCode = task.unitCode; body.lockDamaged = body.lockDamaged === "on";
        try { setResult(await rentalApi.inspect(body)); remote.reload(); }
        catch (cause) { setError(cause.message); }
        finally { setBusy(false); }
    }
    return <main className="page-content"><header className="page-heading"><div><h1>Nghiệm thu trả kho</h1><p>Chỉ Staff được phân công mới được nghiệm thu hợp đồng này.</p></div><Link to="/facility/tasks/my">Về công việc</Link></header>
        {(error || remote.error) && <p role="alert" className="card error">{error || remote.error}</p>}
        {result ? <section className="card notice" role="status"><h2>Đã hoàn tất nghiệm thu</h2><p>Hợp đồng {result.contractId} đã kết thúc; PIN bị khóa; kho chuyển vệ sinh.</p><p>Khấu trừ: {money(result.deductions)} · Cọc có thể hoàn: {money(result.refundableDeposit)}</p><p>Task trả kho đã đóng. Manager phân công task vệ sinh mới; tiền cọc đi qua luồng yêu cầu và duyệt hoàn.</p></section> : remote.busy ? <p>Đang tải…</p> : !task || !["PENDING", "IN_PROGRESS"].includes(task.status) ? <section className="card empty">Không có task nghiệm thu đang mở được giao cho bạn.</section> : <section className="card"><h2>Kho {display(task.unitCode)}</h2><p>Hợp đồng {display(task.contractId)} · Task {display(task.id)}</p><form onSubmit={submit} className="form-grid"><label>Vệ sinh<select name="cleanlinessStatus"><option value="CLEAN">Sạch</option><option value="NEEDS_CLEANING">Cần vệ sinh</option></select></label><label>Hiện trạng / hư hỏng<textarea name="damageNotes" required maxLength={255} /></label><label className="check-row"><input type="checkbox" name="lockDamaged" />Khóa bị hư</label><button disabled={busy}>{busy ? "Đang lưu…" : "Hoàn tất nghiệm thu và khóa PIN"}</button></form></section>}
    </main>;
}
