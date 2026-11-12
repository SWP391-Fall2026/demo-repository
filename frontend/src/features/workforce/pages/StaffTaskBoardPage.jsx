import { useState } from "react";
import { Link } from "react-router-dom";
import { workforceApi } from "../api/workforce.api";
import { rentalApi } from "../../rental/api/rental.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDate, sortByNewest, statusLabel } from "../../../shared/lib/format";
function inspectionLabel(status) {
    if (!status)
        return "Chưa lập phiếu";
    if (status === "PENDING_CONFIRM")
        return "Chờ khách xác nhận";
    if (status === "PENDING_MANAGER")
        return "Chờ Manager xem xét khiếu nại";
    if (status === "PENDING_CUSTOMER")
        return "Chờ khách xác nhận mức phí";
    if (status === "CUSTOMER_ACCEPTED")
        return "Khách đã đồng ý · Staff cần hoàn tất";
    if (status === "COMPLETED" || status === "CONFIRMED")
        return "Hoàn tất";
    return display(status);
}
export default function StaffTaskBoardPage() {
    const { data, error, busy, reload } = useRemote(async () => {
        const [taskList, contractList] = await Promise.all([
            workforceApi.list(),
            rentalApi.list().catch(() => []),
        ]);
        return {
            tasks: sortByNewest(Array.isArray(taskList) ? taskList : []),
            contracts: sortByNewest(Array.isArray(contractList) ? contractList : []),
        };
    });
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [selected, setSelected] = useState(null);
    const [appointmentCardCode, setAppointmentCardCode] = useState("");
    const [identityConfirmed, setIdentityConfirmed] = useState(false);
    const [cardConfirmed, setCardConfirmed] = useState(false);
    const [message, setMessage] = useState("");
    const [loadingTaskId, setLoadingTaskId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [actionBusyId, setActionBusyId] = useState("");

    async function handleProgress(taskId, nextStatus) {
        setActionBusyId(taskId);
        setMessage("");
        try {
            await workforceApi.progress({ id: taskId, status: nextStatus });
            setMessage(nextStatus === "COMPLETED" ? "Đã hoàn thành nhiệm vụ!" : "Đã cập nhật tiến độ: Đang thực hiện.");
            reload();
        } catch (e) {
            setMessage(e instanceof Error ? e.message : "Không cập nhật được tiến độ");
        } finally {
            setActionBusyId("");
        }
    }
    const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const contracts = Array.isArray(data?.contracts) ? data.contracts : [];
    const openTasks = tasks.filter((task) => !["COMPLETED", "CANCELLED"].includes(String(task.status).toUpperCase()));
    const assignedReturnContractIds = new Set(openTasks.filter((t) => t.taskType === "RETURN" && t.contractId).map((t) => String(t.contractId)));
    const unassignedReturnContracts = contracts.filter((c) => String(c.status) === "CHECKOUT_REQUESTED" && !assignedReturnContractIds.has(String(c.id)));
    const counts = {
        ALL: openTasks.length + unassignedReturnContracts.length,
        CHECKIN: openTasks.filter((task) => task.taskType === "CHECKIN").length,
        RETURN: openTasks.filter((task) => task.taskType === "RETURN").length + unassignedReturnContracts.length,
        SUPPORT: openTasks.filter((task) => ["SUPPORT", "INCIDENT"].includes(String(task.taskType).toUpperCase())).length,
    };
    const visibleTasks = activeFilter === "ALL" ? openTasks : openTasks.filter((task) =>
        activeFilter === "SUPPORT"
            ? ["SUPPORT", "INCIDENT"].includes(String(task.taskType).toUpperCase())
            : task.taskType === activeFilter);
    const visibleUnassignedReturns = (activeFilter === "ALL" || activeFilter === "RETURN") ? unassignedReturnContracts : [];
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
    return <main className="page-content staff-work-queue"><header className="page-heading"><div><span className="eyebrow">STAFF / HÀNG ĐỢI</span><h1>Công việc cần xử lý</h1><p>Các nhiệm vụ được giao tại cơ sở, gồm check-in, bàn giao và yêu cầu trả kho.</p></div><button className="btn-figma btn-outline btn-sm" onClick={reload}>Làm mới</button></header>
    {error && <section className="card error" role="alert">{error}</section>}
    {message && <section className={message.startsWith("Đã xác minh") ? "card notice" : "card error"} role="status">{message}</section>}
    <section className="summary-grid staff-task-summary">
      <article className="card"><span>Tất cả công việc đang mở</span><strong>{counts.ALL}</strong></article>
      <article className="card"><span>Check-in / Bàn giao</span><strong>{counts.CHECKIN}</strong></article>
      <article className="card"><span>Trả kho / Nghiệm thu</span><strong>{counts.RETURN}</strong></article>
      <article className="card"><span>Yêu cầu hỗ trợ</span><strong>{counts.SUPPORT}</strong></article>
    </section>
    {visibleUnassignedReturns.length > 0 && (
      <section className="card" style={{ border: "1.5px solid #BFDBFE", background: "#F8FAFC" }}>
        <div className="table-toolbar">
          <div>
            <h2>Đơn yêu cầu trả kho mới tại cơ sở <span className="count">{visibleUnassignedReturns.length}</span></h2>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "13px" }}>Hiển thị ngay tại Tổng quan/Hàng đợi để Staff nắm thông tin. Manager phân công Staff tại mục Phân công trước khi lập phiếu.</p>
          </div>
          <Link className="btn-figma btn-outline btn-sm" to="/facility/inspections">Mở danh sách trả kho</Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Hợp đồng</th>
                <th>Khách hàng</th>
                <th>Kho</th>
                <th>Ngày hẹn trả · Lý do</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleUnassignedReturns.map((req) => (
                <tr key={String(req.id)}>
                  <td><strong>{display(req.id)}</strong></td>
                  <td>{display(req.customerName || "—")}<br /><small>{display(req.customerPhone || "")}</small></td>
                  <td><strong>{display(req.unitCode)}</strong></td>
                  <td>Hẹn: {formatDate(req.checkoutRequestedDate)}<br /><small>Lý do: {display(req.checkoutReason || "—")}</small></td>
                  <td><span className="badge pending">{req.inspectionStatus ? inspectionLabel(req.inspectionStatus) : "Đơn mới · Chờ phân công"}</span></td>
                  <td><Link className="btn-figma btn-primary-dark btn-sm" to={"/facility/inspections/" + encodeURIComponent(String(req.id))}>Mở nghiệm thu</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}
    <section className="card staff-work-list">
      <div className="table-toolbar"><h2>Hàng đợi công việc <span className="count">{visibleTasks.length}</span></h2>
        <div className="segmented" role="group" aria-label="Lọc loại công việc">
          {[["ALL", "Tất cả"], ["CHECKIN", "Check-in"], ["RETURN", "Trả kho"], ["SUPPORT", "Hỗ trợ"]].map(([key, label]) => <button type="button" key={key} className={activeFilter === key ? "selected" : ""} onClick={() => setActiveFilter(key)}>{label} ({counts[key]})</button>)}
        </div>
      </div>
      {busy ? <p className="empty">Đang tải công việc…</p> : !visibleTasks.length ? <div className="empty"><span className="empty-icon">✓</span><h3>{visibleUnassignedReturns.length ? "Các đơn trả kho mới đang chờ Manager phân công ở trên" : "Không có công việc cần xử lý"}</h3><p>{visibleUnassignedReturns.length ? "Bạn có thể xem trước thông tin đơn hoặc chờ Manager phân công cho bạn." : "Hiện tại không có công việc nào đang chờ xử lý."}</p></div> : <div className="table-scroll"><table><thead><tr><th>Task</th><th>Đơn / hợp đồng</th><th>Kho</th><th>Khách hàng · Hẹn · Lý do</th><th>Phiếu nghiệm thu</th><th>Trạng thái</th><th style={{ minWidth: "150px" }}>Thao tác</th></tr></thead><tbody>{visibleTasks.map((task) => { const validCheckin = task.taskType === "CHECKIN" && Boolean(task.reservationId) && Boolean(task.unitCode); const completed = task.status === "COMPLETED"; const cancelled = task.status === "CANCELLED"; return <tr key={String(task.id)}><td>{display(task.title)}<br /><small>{display(task.id)}</small></td><td>{display(task.reservationId || task.contractId || "—")}</td><td>{display(task.unitCode || "Chưa gán kho")}</td><td>{task.taskType === "RETURN" ? <>{display(task.customerName || "—")}<br /><small>{display(task.customerPhone || "")}</small><br />Hẹn: {formatDate(task.dueDate)}<br /><small>Lý do: {display(task.checkoutReason || task.checkoutRequestedDate || "—")}</small></> : display(task.dueDate)}</td><td>{task.taskType === "RETURN" ? <>{inspectionLabel(task.inspectionStatus)}<br /><small>Khấu trừ {display(task.inspectionPenaltyFee ?? "—")} · Hoàn {display(task.inspectionRefundAmount ?? "—")}</small></> : "—"}</td><td>{completed ? <span className="badge success">Đã hoàn thành</span> : cancelled ? <span className="badge danger">Đã hủy</span> : <span className={`badge ${task.status === "IN_PROGRESS" ? "badge-pending" : ""}`}>{statusLabel(task.status)}</span>}</td><td>{completed ? <span className="badge success">✓ Hoàn tất</span> : cancelled ? <span>Đã hủy theo quyết định Manager</span> : task.taskType === "CHECKIN" ? validCheckin ? <button type="button" className="btn-figma btn-primary-dark btn-sm" onClick={() => openCredentials(task)} disabled={loadingTaskId === String(task.id)}>{loadingTaskId === String(task.id) ? "Đang mở…" : task.status === "IN_PROGRESS" ? "Mở tài liệu & tiếp tục" : "Mở tài liệu task"}</button> : <span className="error">Task thiếu liên kết thẻ hẹn/kho · báo Manager</span> : task.taskType === "RETURN" ? <Link className="btn-figma btn-primary-dark btn-sm" to={"/facility/inspections/" + encodeURIComponent(task.contractId || task.unitCode || "")}>Mở nghiệm thu</Link> : <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{task.status === "PENDING" && <button type="button" className="btn-figma btn-primary-dark btn-sm" onClick={() => handleProgress(String(task.id), "IN_PROGRESS")} disabled={actionBusyId === String(task.id)}>{actionBusyId === String(task.id) ? "Đang lưu…" : "Bắt đầu làm"}</button>}{task.status === "IN_PROGRESS" && <button type="button" className="btn-figma btn-primary-dark btn-sm" style={{ background: "#059669", borderColor: "#059669" }} onClick={() => handleProgress(String(task.id), "COMPLETED")} disabled={actionBusyId === String(task.id)}>{actionBusyId === String(task.id) ? "Đang lưu…" : "✓ Hoàn thành"}</button>}</div>}</td></tr>; })}</tbody></table></div>}
    </section>
    {selected && <section className="card staff-checkin-verify"><header><div><span className="eyebrow">TASK CHECK-IN ĐƯỢC GIAO CHO BẠN</span><h2>Kiểm tra thẻ hẹn và xác nhận check-in</h2></div><strong>{display(selected.reservationId)} · {display(selected.unitCode)}</strong></header><section className="staff-appointment-doc"><h3>Tài liệu đi kèm task</h3><div className="staff-appointment-facts"><span>Mã thẻ hẹn<strong>{display(selected.appointmentCardCode || selected.reservationId)}</strong></span><span>Trạng thái cọc<strong>{display(selected.depositStatus)}</strong></span><span>Trạng thái đơn<strong>{display(selected.appointmentCardStatus)}</strong></span><span>Giờ hẹn<strong>{display(selected.appointmentAt || "Chưa có")}</strong></span><span>Bắt đầu thuê<strong>{display(selected.startDate)} · {display(selected.durationMonths)} tháng</strong></span><span>Cơ sở / kho<strong>{display(selected.facilityCode)} · {display(selected.unitCode)}</strong></span></div><ul>{(Array.isArray(selected.documentChecklist) ? selected.documentChecklist : []).map((item, index) => <li key={index}>{display(item)}</li>)}</ul></section><div className="staff-checkin-customer"><span>Khách hàng<strong>{display(selected.customerName)}</strong></span><span>Số điện thoại<strong>{display(selected.customerPhone)}</strong></span><span>Cơ sở<strong>{display(selected.facilityCode)}</strong></span><span>PIN cơ sở<strong className="pin-display">{display(selected.facilityPin || "Chưa cấp")}</strong></span><span>Mã kho<strong>{display(selected.unitCode)}</strong></span><span>PIN kho<strong className="pin-display">{display(selected.unitPin || "Chưa cấp")}</strong><small>Hết hạn {display(selected.unitPinExpiresAt || "—")}</small></span></div><form className="form-grid" onSubmit={(event) => { event.preventDefault(); void verify(); }}><label>Mã thẻ hẹn<input value={appointmentCardCode} onChange={(e) => setAppointmentCardCode(e.target.value)} placeholder={String(selected.reservationId || "RSV-...")} required/></label><label className="check-row"><input type="checkbox" checked={identityConfirmed} onChange={(e) => setIdentityConfirmed(e.target.checked)}/> Đã đối chiếu CCCD/giấy tờ bản gốc với hồ sơ khách</label><label className="check-row"><input type="checkbox" checked={cardConfirmed} onChange={(e) => setCardConfirmed(e.target.checked)}/> Đã kiểm tra thẻ hẹn/mã đơn khớp với khách và task</label><div className="form-actions"><button className="btn-figma btn-primary-dark" type="submit" disabled={!canVerify}>{submitting ? "Đang xác minh…" : "Xác nhận check-in"}</button></div></form><p className="notice">Nút xác nhận chỉ mở sau khi nhập mã thẻ hẹn và tick đủ hai bước đối chiếu. Không nhập hoặc lưu CCCD.</p></section>}
  </main>;
}
