import { useState } from "react";
import { workforceApi } from "../api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
export default function StaffTaskBoardPage() {
    const { data, error, busy, reload } = useRemote(workforceApi.list);
    const [selected, setSelected] = useState(null);
    const [appointmentCardCode, setAppointmentCardCode] = useState("");
    const [identityConfirmed, setIdentityConfirmed] = useState(false);
    const [cardConfirmed, setCardConfirmed] = useState(false);
    const [message, setMessage] = useState("");
    const [loadingTaskId, setLoadingTaskId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const tasks = Array.isArray(data) ? data : [];
    async function openCredentials(task) {
        setLoadingTaskId(String(task.id));
        setMessage("");
        try {
            const details = await workforceApi.credentials(String(task.id));
            setSelected({ ...task, ...details });
            setAppointmentCardCode(String(details.appointmentCardCode || details.reservationId || task.reservationId || ""));
            setIdentityConfirmed(false);
            setCardConfirmed(false);
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Không tải được thông tin task.");
        }
        finally {
            setLoadingTaskId("");
        }
    }
    const canVerify = Boolean(selected && appointmentCardCode.trim().length > 0 && identityConfirmed && cardConfirmed && !submitting);
    async function verify() {
        if (!selected)
            return;
        if (!appointmentCardCode.trim() || !identityConfirmed || !cardConfirmed) {
            setMessage("Cần nhập mã thẻ hẹn và tick đủ hai bước đối chiếu trước khi xác nhận check-in.");
            return;
        }
        setSubmitting(true);
        setMessage("");
        try {
            await workforceApi.verifyCheckin(String(selected.id), { appointmentCardCode, identityDocumentsConfirmed: identityConfirmed, appointmentCardConfirmed: cardConfirmed });
            setMessage("Đã xác minh khách và ghi nhận giờ đến. Khách có thể mở hợp đồng để xác nhận và thanh toán.");
            setSelected(null);
            setAppointmentCardCode("");
            setIdentityConfirmed(false);
            setCardConfirmed(false);
            reload();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Không xác minh được khách check-in.");
        }
        finally {
            setSubmitting(false);
        }
    }
    return <main className="page-content"><header className="page-heading"><div><span className="eyebrow">STAFF · CHECK-IN</span><h1>Công việc của tôi</h1><p>Nhận task từ Facility Manager, xác minh đúng khách/đơn/kho rồi hoàn tất task check-in.</p></div><button className="secondary" onClick={reload}>Làm mới</button></header>
    {error && <section className="card error" role="alert">{error}</section>}
    {message && <section className={message.startsWith("Đã xác minh") ? "card notice" : "card error"} role="status">{message}</section>}
    <section className="card"><h2>Task được phân công</h2>{busy ? <p>Đang tải task…</p> : <div className="table-scroll"><table><thead><tr><th>Task</th><th>Đơn / thẻ hẹn</th><th>Kho</th><th>Lịch hẹn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{tasks.map((task) => { const validCheckin = task.taskType === "CHECKIN" && Boolean(task.reservationId) && Boolean(task.unitCode); const completed = task.status === "COMPLETED"; const cancelled = task.status === "CANCELLED"; return <tr key={String(task.id)}><td>{display(task.title)}<br /><small>{display(task.id)}</small></td><td>{display(task.reservationId || "Thiếu mã thẻ hẹn")}</td><td>{display(task.unitCode || "Chưa gán kho")}</td><td>{display(task.dueDate)} · {display(task.deadline)}</td><td>{completed ? <span className="badge success">Đã hoàn thành</span> : cancelled ? <span className="badge danger">Đã hủy</span> : display(task.status)}</td><td>{completed ? <span className="badge success">Success</span> : cancelled ? <span>Đã hủy theo quyết định Manager</span> : task.taskType === "CHECKIN" ? validCheckin ? <button type="button" onClick={() => openCredentials(task)} disabled={loadingTaskId === String(task.id)}>{loadingTaskId === String(task.id) ? "Đang mở…" : task.status === "IN_PROGRESS" ? "Mở tài liệu & tiếp tục" : "Mở tài liệu task"}</button> : <span className="error">Task thiếu liên kết thẻ hẹn/kho · báo Manager</span> : display(task.taskType)}</td></tr>; })}</tbody></table></div>}</section>
    {selected && <section className="card staff-checkin-verify"><header><div><span className="eyebrow">TASK CHECK-IN ĐƯỢC GIAO CHO BẠN</span><h2>Kiểm tra thẻ hẹn và xác nhận check-in</h2></div><strong>{display(selected.reservationId)} · {display(selected.unitCode)}</strong></header><section className="staff-appointment-doc"><h3>Tài liệu đi kèm task</h3><div className="staff-appointment-facts"><span>Mã thẻ hẹn<strong>{display(selected.appointmentCardCode || selected.reservationId)}</strong></span><span>Trạng thái cọc<strong>{display(selected.depositStatus)}</strong></span><span>Trạng thái đơn<strong>{display(selected.appointmentCardStatus)}</strong></span><span>Giờ hẹn<strong>{display(selected.appointmentAt || "Chưa có")}</strong></span><span>Bắt đầu thuê<strong>{display(selected.startDate)} · {display(selected.durationMonths)} tháng</strong></span><span>Cơ sở / kho<strong>{display(selected.facilityCode)} · {display(selected.unitCode)}</strong></span></div><ul>{(Array.isArray(selected.documentChecklist) ? selected.documentChecklist : []).map((item, index) => <li key={index}>{display(item)}</li>)}</ul></section><div className="staff-checkin-customer"><span>Khách hàng<strong>{display(selected.customerName)}</strong></span><span>Số điện thoại<strong>{display(selected.customerPhone)}</strong></span><span>Cơ sở<strong>{display(selected.facilityCode)}</strong></span><span>PIN cơ sở<strong className="pin-display">{display(selected.facilityPin || "Chưa cấp")}</strong></span><span>Mã kho<strong>{display(selected.unitCode)}</strong></span><span>PIN kho<strong className="pin-display">{display(selected.unitPin || "Chưa cấp")}</strong><small>Hết hạn {display(selected.unitPinExpiresAt || "—")}</small></span></div><form className="form-grid" onSubmit={(event) => { event.preventDefault(); void verify(); }}><label>Mã thẻ hẹn<input value={appointmentCardCode} onChange={(e) => setAppointmentCardCode(e.target.value)} placeholder={String(selected.reservationId || "RSV-...")} required/></label><label className="check-row"><input type="checkbox" checked={identityConfirmed} onChange={(e) => setIdentityConfirmed(e.target.checked)}/> Đã đối chiếu CCCD/giấy tờ bản gốc với hồ sơ khách</label><label className="check-row"><input type="checkbox" checked={cardConfirmed} onChange={(e) => setCardConfirmed(e.target.checked)}/> Đã kiểm tra thẻ hẹn/mã đơn khớp với khách và task</label><button type="submit" disabled={!canVerify}>{submitting ? "Đang xác minh…" : "Xác nhận check-in"}</button></form><p className="notice">Nút xác nhận chỉ mở sau khi nhập mã thẻ hẹn và tick đủ hai bước đối chiếu. Không nhập hoặc lưu CCCD.</p></section>}
  </main>;
}
