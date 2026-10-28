import { useState } from "react";
import { workforceApi } from "../api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";

export default function StaffAssignmentPage() {
    const dashboard = useRemote(workforceApi.managerDashboard);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [working, setWorking] = useState(false);
    const [filter, setFilter] = useState("OPEN");
    const tasks = Array.isArray(dashboard.data?.tasks) ? dashboard.data.tasks : [];
    const staff = (dashboard.data?.staff || []).filter(row => row.canReceiveTasks);
    const units = dashboard.data?.units || [];
    async function dispatch(event) {
        event.preventDefault(); setWorking(true); setError(""); setMessage("");
        const form = event.currentTarget;
        const body = Object.fromEntries(new FormData(form));
        try { await workforceApi.assign(body); form.reset(); setMessage("Đã tạo và phân công công việc."); dashboard.reload(); }
        catch (cause) { setError(cause.message); }
        finally { setWorking(false); }
    }
    const visible = tasks.filter(task => filter === "ALL" || ["PENDING", "IN_PROGRESS"].includes(task.status));
    return <main className="page-content">
        <header className="page-heading"><div><span className="eyebrow">FACILITY MANAGER</span><h1>Phân công nhân viên</h1><p>Giao check-in, nghiệm thu trả kho, vệ sinh và bảo trì cho Staff cùng cơ sở.</p></div><button className="secondary" onClick={dashboard.reload}>Làm mới</button></header>
        {(error || dashboard.error) && <p role="alert" className="card error">{error || dashboard.error}</p>}
        {message && <p role="status" className="card notice">{message}</p>}
        <section className="card"><h2>Tạo công việc</h2><form onSubmit={dispatch} className="form-grid">
            <label>Nội dung<input name="title" maxLength={255} required /></label>
            <label>Loại công việc<select name="taskType"><option value="GENERAL">Công việc chung</option><option value="CLEANING">Vệ sinh</option><option value="MAINTENANCE">Bảo trì</option></select></label>
            <label>Nhân viên<select name="staffId" required><option value="">Chọn Staff</option>{staff.map(row => <option key={row.id} value={row.id}>{row.name} · {row.openTaskCount} task mở</option>)}</select></label>
            <label>Kho liên quan<select name="unitCode"><option value="">Không gắn kho</option>{units.map(row => <option key={row.code} value={row.code}>{row.code} · {row.status}</option>)}</select></label>
            <label>Ngày thực hiện<input name="date" type="date" required /></label><label>Giờ hạn<input name="deadline" type="time" defaultValue="17:00" required /></label>
            <button disabled={working || !staff.length}>{working ? "Đang lưu…" : "Tạo và giao việc"}</button>
        </form></section>
        <section className="card"><div className="section-heading"><h2>Công việc của cơ sở</h2><select aria-label="Lọc công việc" value={filter} onChange={e => setFilter(e.target.value)}><option value="OPEN">Đang mở</option><option value="ALL">Tất cả</option></select></div>
        {dashboard.busy ? <p>Đang tải…</p> : <div className="table-scroll"><table><thead><tr><th>Công việc</th><th>Khách / đơn</th><th>Kho</th><th>Lịch hẹn</th><th>Trạng thái</th><th>Phân công</th></tr></thead><tbody>{visible.map(task => <TaskRow key={task.id + String(task.staffId)} task={task} staff={staff} onDone={dashboard.reload} />)}</tbody></table>{!visible.length && <p>Không có công việc trong phạm vi đã chọn.</p>}</div>}</section>
    </main>;
}

function TaskRow({ task, staff, onDone }) {
    const [staffId, setStaffId] = useState(task.staffId || "");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const open = ["PENDING", "IN_PROGRESS"].includes(task.status);
    async function assign() {
        setBusy(true); setError("");
        try { await workforceApi.assignExisting(task.id, { staffId }); onDone(); }
        catch (cause) { setError(cause.message); }
        finally { setBusy(false); }
    }
    return <tr><td><strong>{display(task.title)}</strong><br /><small>{task.taskType} · {task.id}</small></td><td>{display(task.customerName)}<br /><small>{display(task.reservationId || task.contractId)}</small></td><td>{display(task.unitCode || "Chưa gán Unit")}</td><td>{display(task.dueDate)} · {display(task.deadline)}</td><td>{display(task.status)}</td><td>{open ? <><select aria-label={"Nhân viên cho " + task.id} value={staffId} onChange={e => setStaffId(e.target.value)}><option value="">Chọn Staff</option>{staff.map(row => <option key={row.id} value={row.id}>{row.name} ({row.openTaskCount} task mở)</option>)}</select><button onClick={assign} disabled={busy || !staffId}>{busy ? "Đang giao…" : "Giao việc"}</button>{error && <p role="alert" className="error">{error}</p>}</> : display(task.staff)}</td></tr>;
}
