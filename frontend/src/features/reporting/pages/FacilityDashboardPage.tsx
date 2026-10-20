import { useState, type FormEvent } from "react";
import { facilityApi } from "../../facility/api/facility.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import type { Row } from "../../../shared/types/api";

export default function FacilityDashboardPage() {
  const dashboard = useRemote(workforceApi.managerDashboard);
  const [pinMessage, setPinMessage] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const facility = (dashboard.data?.facility || {}) as Row;
  const staff = Array.isArray(dashboard.data?.staff) ? dashboard.data.staff as Row[] : [];
  const units = Array.isArray(dashboard.data?.units) ? dashboard.data.units as Row[] : [];
  const tasks = Array.isArray(dashboard.data?.tasks) ? dashboard.data.tasks as Row[] : [];
  const activeStaff = staff.filter((person) => String(person.status).toUpperCase() === "ACTIVE").length;
  const openTasks = tasks.filter((task) => task.status !== "COMPLETED").length;
  const unassigned = tasks.filter((task) => task.status !== "COMPLETED" && !task.staffId).length;

  async function rotateFacilityPin(event: FormEvent) {
    event.preventDefault();
    if (!facility.code) return;
    setPinBusy(true); setPinMessage("");
    try {
      const result = await facilityApi.setCheckinPin(String(facility.code)) as Row;
      setPinMessage(`PIN cơ sở: ${String(result.pin || "")}. PIN chỉ hiện lần này; chuyển cho nhân viên qua kênh nội bộ an toàn.`);
      dashboard.reload();
    } catch (cause) {
      setPinMessage(cause instanceof Error ? cause.message : "Không cấp được PIN cơ sở.");
    } finally { setPinBusy(false); }
  }

  return <main className="page-content">
    <header className="page-heading"><div><span className="eyebrow">FACILITY MANAGER</span><h1>Tổng quan cơ sở</h1><p>{display(facility.name)} · {display(facility.code)}</p></div><button className="secondary" onClick={dashboard.reload}>Làm mới</button></header>
    {dashboard.error && <section className="card error" role="alert">{dashboard.error}</section>}
    {dashboard.busy ? <p>Đang tải thông tin cơ sở…</p> : <>
      <section className="card"><h2>Chi nhánh</h2><dl className="summary-grid"><div><dt>Mã cơ sở</dt><dd>{display(facility.code)}</dd></div><div><dt>Địa chỉ</dt><dd>{display(facility.address)}, {display(facility.city)}</dd></div><div><dt>Hotline</dt><dd>{display(facility.hotline)}</dd></div><div><dt>Trạng thái</dt><dd>{display(facility.status)}</dd></div><div><dt>PIN cơ sở</dt><dd><strong className="pin-display">{display(facility.checkinPin || (facility.checkinPinConfigured ? "Cần cấp lại để hiển thị" : "Chưa cấp"))}</strong></dd></div></dl><form className="inline-form" onSubmit={(event) => void rotateFacilityPin(event)}><button disabled={pinBusy}>{pinBusy ? "Đang cấp…" : facility.checkinPin ? "Xoay PIN cơ sở" : facility.checkinPinConfigured ? "Tạo PIN hiển thị" : "Cấp PIN cơ sở"}</button>{pinMessage && <p className="notice" role="status">{pinMessage}</p>}</form></section>
      <section className="summary-grid"><article className="card"><span>Nhân viên hoạt động</span><strong>{activeStaff} / {staff.length}</strong></article><article className="card"><span>Task đang mở</span><strong>{openTasks}</strong></article><article className="card"><span>Chờ phân công</span><strong>{unassigned}</strong></article><article className="card"><span>Kho thuộc cơ sở</span><strong>{units.length}</strong></article></section>
      <section className="card"><h2>Nhân viên và phân công</h2>{!staff.length ? <p>Chưa có nhân viên thuộc cơ sở này.</p> : <div className="table-scroll"><table><thead><tr><th>Nhân viên</th><th>Tên đăng nhập</th><th>Trạng thái</th><th>Task đang mở</th><th>Khả năng nhận task</th></tr></thead><tbody>{staff.map((person) => <tr key={String(person.id)}><td>{display(person.name)}</td><td>{display(person.username)}</td><td>{display(person.status)}</td><td>{display(person.openTaskCount)}</td><td>{person.canReceiveTasks ? "Có thể giao" : "Không hoạt động"}</td></tr>)}</tbody></table></div>}</section>
      <section className="card"><h2>Kho và PIN check-in</h2>{!units.length ? <p>Chưa có kho trong cơ sở.</p> : <div className="table-scroll"><table><thead><tr><th>Mã kho</th><th>Loại / kích thước</th><th>Trạng thái</th><th>PIN tạm</th><th>Hết hạn</th></tr></thead><tbody>{units.map((unit) => <tr key={String(unit.code)}><td>{display(unit.code)}</td><td>{display(unit.type)} · {display(unit.size)}</td><td>{display(unit.status)}</td><td><strong>{display(unit.temporaryPin || "Chưa cấp")}</strong></td><td>{display(unit.temporaryPinExpiresAt || "—")}</td></tr>)}</tbody></table></div>}</section>
      <section className="card"><h2>Yêu cầu thẻ hẹn / check-in</h2>{!tasks.length ? <p>Chưa có yêu cầu check-in tại cơ sở.</p> : <div className="table-scroll"><table><thead><tr><th>Task / thẻ hẹn</th><th>Khách hàng</th><th>Kho</th><th>Giờ hẹn</th><th>Nhân viên</th><th>Trạng thái</th></tr></thead><tbody>{tasks.map((task) => <tr key={String(task.id)}><td>{display(task.id)}<br /><small>{display(task.reservationId || task.title)}</small></td><td>{display(task.customerName)}<br /><small>{display(task.customerPhone)}</small></td><td>{display(task.unitCode)}</td><td>{display(task.appointmentAt || task.deadline)}</td><td>{display(task.staffId ? task.staff : "Chưa giao")}</td><td>{display(task.status)}</td></tr>)}</tbody></table></div>}</section>
    </>}
  </main>;
}
