import { useState } from "react";
import { Link } from "react-router-dom";
import { workforceApi } from "../api/workforce.api";
import { supportApi } from "../../support/api/support.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";

export default function StaffTaskBoardPage() {
    const tasksRemote = useRemote(workforceApi.list);
    const ticketsRemote = useRemote(supportApi.list);
    const [selected, setSelected] = useState(null);
    const [appointmentCardCode, setAppointmentCardCode] = useState("");
    const [identityConfirmed, setIdentityConfirmed] = useState(false);
    const [cardConfirmed, setCardConfirmed] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");
    const [filter, setFilter] = useState("OPEN");
    const [date, setDate] = useState("");
    const tasks = (Array.isArray(tasksRemote.data) ? tasksRemote.data : []).filter(task =>
        (filter === "ALL" || ["PENDING", "IN_PROGRESS"].includes(task.status)) && (!date || task.dueDate === date));
    const tickets = (Array.isArray(ticketsRemote.data) ? ticketsRemote.data : []).filter(row => ["OPEN", "IN_PROGRESS"].includes(row.status));
    function reload() { tasksRemote.reload(); ticketsRemote.reload(); }
    async function openCredentials(task) {
        setBusyId(task.id); setError(""); setMessage("");
        try {
            const details = await workforceApi.credentials(task.id);
            setSelected({ ...task, ...details }); setAppointmentCardCode(details.appointmentCardCode || task.reservationId || "");
            setIdentityConfirmed(false); setCardConfirmed(false);
        } catch (cause) { setError(cause.message); }
        finally { setBusyId(""); }
    }
    async function verify(event) {
        event.preventDefault();
        if (!selected || !identityConfirmed || !cardConfirmed) return;
        setBusyId(selected.id); setError(""); setMessage("");
        try {
            await workforceApi.verifyCheckin(selected.id, { appointmentCardCode, identityDocumentsConfirmed: identityConfirmed, appointmentCardConfirmed: cardConfirmed });
            setMessage("Đã xác minh khách. Khách xác nhận hợp đồng và thanh toán tiền thuê trước khi bàn giao.");
            setSelected(null); reload();
        } catch (cause) { setError(cause.message); }
        finally { setBusyId(""); }
    }
    async function progress(task, status) {
        setBusyId(task.id); setError(""); setMessage("");
        try { await workforceApi.progress({ id: task.id, status }); setMessage("Đã cập nhật công việc."); reload(); }
        catch (cause) { setError(cause.message); }
        finally { setBusyId(""); }
    }
    return <main className="page-content">
        <header className="page-heading"><div><span className="eyebrow">STAFF · OPERATIONS</span><h1>Công việc của tôi</h1><p>Check-in, nghiệm thu trả kho, vệ sinh, bảo trì và sự cố tại cơ sở.</p></div><button onClick={reload} className="secondary">Làm mới</button></header>
        {(error || tasksRemote.error) && <p role="alert" className="card error">{error || tasksRemote.error}</p>}
        {message && <p role="status" className="card notice">{message}</p>}
        <section className="card"><div className="section-heading"><h2>Task được phân công</h2><div className="inline-form"><select aria-label="Lọc trạng thái" value={filter} onChange={e => setFilter(e.target.value)}><option value="OPEN">Đang mở</option><option value="ALL">Tất cả</option></select><label>Ngày<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>{date && <button className="ghost" onClick={() => setDate("")}>Xóa ngày</button>}</div></div>
        {tasksRemote.busy ? <p>Đang tải…</p> : <div className="table-scroll"><table><thead><tr><th>Công việc</th><th>Kho / đơn</th><th>Lịch</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{tasks.map(task => {
            const open = ["PENDING", "IN_PROGRESS"].includes(task.status);
            return <tr key={task.id}><td><strong>{task.title}</strong><br /><small>{task.taskType} · {task.id}</small></td><td>{display(task.unitCode)}<br /><small>{display(task.reservationId || task.contractId)}</small></td><td>{display(task.dueDate)} · {display(task.deadline)}</td><td>{display(task.status)}</td><td>{open && (task.taskType === "CHECKIN" ? <>
                <button disabled={busyId === task.id || !task.unitCode} onClick={() => openCredentials(task)}>Mở tài liệu check-in</button>
                {task.status === "IN_PROGRESS" && <Link className="button secondary" to={"/facility/handovers/" + encodeURIComponent(task.reservationId)}>Bàn giao</Link>}
            </> : task.taskType === "RETURN" ? <Link className="button" to={"/facility/inspections/" + encodeURIComponent(task.contractId)}>Nghiệm thu trả kho</Link> : <>
                {task.status === "PENDING" && <button disabled={busyId === task.id} onClick={() => progress(task, "IN_PROGRESS")}>Bắt đầu</button>}
                <button disabled={busyId === task.id} className="secondary" onClick={() => progress(task, "COMPLETED")}>Hoàn thành</button>
                {task.taskType === "CLEANING" && <Link to="/facility/units/status">Gửi yêu cầu kho sẵn sàng</Link>}
            </>)}</td></tr>;
        })}</tbody></table>{!tasks.length && <p>Không có task trong bộ lọc hiện tại.</p>}</div>}</section>
        {selected && <section className="card"><h2>Xác minh khách check-in</h2><dl className="summary-grid"><div><dt>Thẻ hẹn</dt><dd>{selected.appointmentCardCode}</dd></div><div><dt>Khách hàng</dt><dd>{selected.customerName} · {selected.customerPhone}</dd></div><div><dt>Cơ sở / Unit</dt><dd>{selected.facilityCode} · {selected.unitCode}</dd></div><div><dt>Tiền cọc</dt><dd>{selected.depositStatus}</dd></div><div><dt>PIN cơ sở</dt><dd>{display(selected.facilityPin)}</dd></div><div><dt>PIN kho tạm</dt><dd>{display(selected.unitPin)} · hết hạn {display(selected.unitPinExpiresAt)}</dd></div></dl><ul>{(selected.documentChecklist || []).map((item, i) => <li key={i}>{item}</li>)}</ul><form className="form-grid" onSubmit={verify}><label>Mã thẻ hẹn<input value={appointmentCardCode} onChange={e => setAppointmentCardCode(e.target.value)} required /></label><label className="check-row"><input type="checkbox" checked={identityConfirmed} onChange={e => setIdentityConfirmed(e.target.checked)} />Đã đối chiếu giấy tờ gốc với khách</label><label className="check-row"><input type="checkbox" checked={cardConfirmed} onChange={e => setCardConfirmed(e.target.checked)} />Thẻ hẹn khớp khách và task</label><button disabled={!identityConfirmed || !cardConfirmed || !appointmentCardCode.trim() || busyId === selected.id}>Xác nhận check-in</button><button type="button" className="ghost" onClick={() => setSelected(null)}>Đóng</button></form></section>}
        <section className="card"><h2>Sự cố tại cơ sở ({tickets.length})</h2>{ticketsRemote.error && <p className="error" role="alert">{ticketsRemote.error}</p>}{tickets.map(ticket => <p key={ticket.id}><strong>{ticket.unitCode} · {ticket.title}</strong> · {ticket.status} <Link to={"/facility/incidents?ticket=" + encodeURIComponent(ticket.id)}>Mở xử lý</Link></p>)}{!tickets.length && !ticketsRemote.busy && <p>Không có sự cố đang mở.</p>}</section>
    </main>;
}
