import { useState, type FormEvent } from "react";
import { workforceApi } from "../api/workforce.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { useSession } from "../../identity/session";
import { display } from "../../../shared/lib/format";

export default function StaffAssignmentPage() {
  const session = useSession();
  const dashboard = useRemote(workforceApi.managerDashboard);
  const taskRows = Array.isArray(dashboard.data?.tasks) ? dashboard.data.tasks as Record<string, unknown>[] : [];
  const staffRows = Array.isArray(dashboard.data?.staff) ? dashboard.data.staff as Record<string, unknown>[] : [];
  const unitRows = Array.isArray(dashboard.data?.units) ? dashboard.data.units as Record<string, unknown>[] : [];
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function rotatePin(event: FormEvent) { event.preventDefault(); if (!session?.user.facilityCode) return; setBusy(true); setMessage(""); try { const result = await facilityApi.setCheckinPin(session.user.facilityCode); setMessage(`PIN cơ sở mới: ${String((result as Record<string, unknown>).pin || "—")}. Chuyển cho Staff qua kênh nội bộ.`); } catch (e) { setMessage(e instanceof Error ? e.message : "Không cấp được PIN."); } finally { setBusy(false); } }
  return <main className="page-content"><header className="page-heading"><div><span className="eyebrow">FACILITY MANAGER · WORKFORCE</span><h1>Phân công nhân viên</h1><p>Nhận request từ khách, gán đúng Staff và cấp credential check-in có thời hạn.</p></div><button className="secondary" onClick={dashboard.reload}>Làm mới</button></header>
    <section className="card form-grid"><form onSubmit={rotatePin}><p>PIN cơ sở do backend sinh mới, lưu dạng hash và chỉ hiển thị một lần.</p><button disabled={busy}>{busy ? "Đang cấp…" : "Cấp PIN cơ sở mới"}</button></form>{message && <p className="notice">{message}</p>}</section>
    {dashboard.error && <section className="card error" role="alert">{dashboard.error}</section>}
    <section className="card"><h2>Yêu cầu từ thẻ hẹn và phân công</h2>{dashboard.busy ? <p>Đang tải…</p> : !taskRows.length ? <p>Chưa có task tại cơ sở phụ trách.</p> : <div className="table-scroll"><table><thead><tr><th>Task / thẻ hẹn</th><th>Khách hàng</th><th>Kho</th><th>Ngày / giờ hẹn</th><th>Trạng thái</th><th>Nhân viên</th></tr></thead><tbody>{taskRows.map((task) => <TaskRow key={String(task.id)} task={task} staff={staffRows.filter((person) => person.canReceiveTasks)} units={unitRows} onDone={dashboard.reload} />)}</tbody></table></div>}</section>
  </main>;
}

function TaskRow({ task, staff, units, onDone }: { task: Record<string, unknown>; staff: Record<string, unknown>[]; units: Record<string, unknown>[]; onDone: () => void }) {
  const [staffId, setStaffId] = useState(String(task.staffId || "")); const [unitCode, setUnitCode] = useState(String(task.unitCode || "")); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const availableUnits = units.filter((unit) => String(unit.status).toLowerCase() === "available" && (!task.unitType || unit.type === task.unitType));
  const waiting = task.taskType === "CHECKIN" && task.status === "PENDING" && (!task.staffId || !task.unitCode);
  const canAssign = Boolean(staffId) && (task.taskType !== "CHECKIN" || Boolean(unitCode));
  async function assign() { if (!canAssign) return; setBusy(true); setError(""); try { await workforceApi.assignExisting(String(task.id), { staffId, ...(unitCode ? { unitCode } : {}) }); onDone(); } catch (e) { setError(e instanceof Error ? e.message : "Không phân công được"); } finally { setBusy(false); } }
  return <tr><td>{display(task.id)}<br /><small>{display(task.reservationId || task.title)}</small></td><td>{display(task.customerName || "—")}<br /><small>{display(task.customerPhone || "")}</small></td><td>{task.taskType === "CHECKIN" && !task.unitCode ? <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)}><option value="">Chọn kho trống ({display(task.unitType)})</option>{availableUnits.map((unit) => <option key={String(unit.code)} value={String(unit.code)}>{String(unit.code)} · {String(unit.size || "")}</option>)}</select> : display(task.unitCode || "Chưa gán kho")}</td><td>{display(task.appointmentAt || task.deadline)}</td><td>{display(task.status)}</td><td>{waiting ? <><select value={staffId} onChange={(e) => setStaffId(e.target.value)}><option value="">Chọn Staff</option>{staff.map((s) => <option key={String(s.id)} value={String(s.id)}>{String(s.name)} ({String(s.username)})</option>)}</select><button type="button" onClick={assign} disabled={busy || !canAssign}>{busy ? "Đang giao…" : "Gán kho & giao task"}</button>{error && <small className="error">{error}</small>}</> : display(task.staffId ? task.staff : "Chưa giao")}</td></tr>;
}
