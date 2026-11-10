import { useState } from "react";
import { Link } from "react-router-dom";
import { facilityApi } from "../../facility/api/facility.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { rentalApi } from "../../rental/api/rental.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDate, statusLabel } from "../../../shared/lib/format";

export default function FacilityDashboardPage() {
    const dashboard = useRemote(async () => {
        const [dash, contracts] = await Promise.all([
            workforceApi.managerDashboard(),
            rentalApi.list().catch(() => []),
        ]);
        return { ...dash, contracts: Array.isArray(contracts) ? contracts : [] };
    });
    const [pinMessage, setPinMessage] = useState("");
    const [pinBusy, setPinBusy] = useState(false);

    const facility = dashboard.data?.facility || {};
    const staff = Array.isArray(dashboard.data?.staff) ? dashboard.data.staff : [];
    const units = Array.isArray(dashboard.data?.units) ? dashboard.data.units : [];
    const tasks = Array.isArray(dashboard.data?.tasks) ? dashboard.data.tasks : [];
    const returnRequests = (Array.isArray(dashboard.data?.contracts) ? dashboard.data.contracts : [])
        .filter((c) => String(c.status) === "CHECKOUT_REQUESTED");

    const activeStaff = staff.filter(
        (person) => String(person.status).toUpperCase() === "ACTIVE"
    ).length;
    const openTasks = tasks.filter((task) => task.status !== "COMPLETED").length;
    const unassigned = tasks.filter(
        (task) => task.status !== "COMPLETED" && !task.staffId
    ).length;

    async function rotateFacilityPin(event) {
        event.preventDefault();
        if (!facility.code) return;
        setPinBusy(true);
        setPinMessage("");
        try {
            const result = await facilityApi.setCheckinPin(String(facility.code));
            setPinMessage(
                `Mã PIN cơ sở mới: ${String(result.pin || "")}. Lưu ý: Mã chỉ hiển thị lần này để đảm bảo an toàn, vui lòng chuyển cho nhân viên qua kênh bảo mật nội bộ.`
            );
            dashboard.reload();
        } catch (cause) {
            setPinMessage(
                cause instanceof Error ? cause.message : "Không cấp được mã PIN cơ sở."
            );
        } finally {
            setPinBusy(false);
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">FACILITY MANAGER</span>
                    <h1>Tổng quan cơ sở</h1>
                    <p>
                        {display(facility.name)} · {display(facility.code)}
                    </p>
                </div>
                <button className="btn-figma btn-outline btn-sm" onClick={dashboard.reload}>
                    Làm mới
                </button>
            </header>

            {dashboard.error && (
                <section className="card error" role="alert">
                    {dashboard.error}
                </section>
            )}

            {dashboard.busy ? (
                <p>Đang tải thông tin cơ sở…</p>
            ) : (
                <>
                    <section className="card">
                        <h2>Chi nhánh</h2>
                        <dl className="summary-grid">
                            <div>
                                <dt>Mã cơ sở</dt>
                                <dd>
                                    <strong>{display(facility.code)}</strong>
                                </dd>
                            </div>
                            <div>
                                <dt>Địa chỉ</dt>
                                <dd>
                                    {display(facility.address)}, {display(facility.city)}
                                </dd>
                            </div>
                            <div>
                                <dt>Hotline</dt>
                                <dd>{display(facility.hotline)}</dd>
                            </div>
                            <div>
                                <dt>Trạng thái</dt>
                                <dd>
                                    <span
                                        className={`badge ${
                                            String(facility.status).toUpperCase() === "ACTIVE"
                                                ? "badge-success"
                                                : "badge-neutral"
                                        }`}
                                    >
                                        {display(facility.status)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt>Mã PIN cơ sở</dt>
                                <dd>
                                    {facility.checkinPin ? (
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span className="pin-display">
                                                {facility.checkinPin}
                                            </span>
                                            <span className="badge badge-success">
                                                Đang hiển thị
                                            </span>
                                        </div>
                                    ) : facility.checkinPinConfigured ? (
                                        <span
                                            className="badge badge-pending"
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            <svg
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                            >
                                                <rect
                                                    x="3"
                                                    y="11"
                                                    width="18"
                                                    height="11"
                                                    rx="2"
                                                    ry="2"
                                                />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            Đã thiết lập (Bấm cấp lại để xem mã)
                                        </span>
                                    ) : (
                                        <span className="badge badge-neutral">Chưa cấp</span>
                                    )}
                                </dd>
                            </div>
                        </dl>

                        <form
                            className="inline-form"
                            onSubmit={(event) => void rotateFacilityPin(event)}
                            style={{ marginTop: "16px" }}
                        >
                            <button
                                className="btn-figma btn-primary-dark btn-sm"
                                disabled={pinBusy}
                            >
                                {pinBusy
                                    ? "Đang xử lý…"
                                    : facility.checkinPin
                                    ? "Xoay mã PIN mới"
                                    : facility.checkinPinConfigured
                                    ? "Cấp lại để xem mã PIN"
                                    : "Cấp mã PIN cơ sở"}
                            </button>
                        </form>

                        {pinMessage && (
                            <div
                                className="alert-banner alert-success"
                                role="status"
                                style={{
                                    marginTop: "16px",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                }}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{ flexShrink: 0, marginTop: "2px" }}
                                >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <div style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                                    {pinMessage}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="summary-grid">
                        <article className="card">
                            <span>Nhân viên hoạt động</span>
                            <strong>
                                {activeStaff} / {staff.length}
                            </strong>
                        </article>
                        <article className="card">
                            <span>Task đang mở</span>
                            <strong>{openTasks}</strong>
                        </article>
                        <article className="card">
                            <span>Chờ phân công</span>
                            <strong>{unassigned}</strong>
                        </article>
                        <article className="card">
                            <span>Kho thuộc cơ sở</span>
                            <strong>{units.length}</strong>
                        </article>
                    </section>

                    <section className="card">
                        <h2>Nhân viên và phân công</h2>
                        {!staff.length ? (
                            <p>Chưa có nhân viên thuộc cơ sở này.</p>
                        ) : (
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nhân viên</th>
                                            <th>Tên đăng nhập</th>
                                            <th>Trạng thái</th>
                                            <th>Task đang mở</th>
                                            <th>Khả năng nhận task</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staff.map((person) => (
                                            <tr key={String(person.id)}>
                                                <td>
                                                    <strong>{display(person.name)}</strong>
                                                </td>
                                                <td>{display(person.username)}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            String(
                                                                person.status
                                                            ).toUpperCase() === "ACTIVE"
                                                                ? "badge-success"
                                                                : "badge-neutral"
                                                        }`}
                                                    >
                                                        {display(person.status)}
                                                    </span>
                                                </td>
                                                <td>{display(person.openTaskCount)}</td>
                                                <td>
                                                    {person.canReceiveTasks ? (
                                                        <span
                                                            style={{
                                                                color: "var(--color-accent-green)",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            Có thể giao
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94A3B8" }}>
                                                            Không hoạt động
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <h2>Kho và PIN check-in</h2>
                        {!units.length ? (
                            <p>Chưa có kho trong cơ sở.</p>
                        ) : (
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Mã kho</th>
                                            <th>Loại / kích thước</th>
                                            <th>Trạng thái</th>
                                            <th>PIN tạm</th>
                                            <th>Hết hạn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units.map((unit) => (
                                            <tr key={String(unit.code)}>
                                                <td>
                                                    <strong>{display(unit.code)}</strong>
                                                </td>
                                                <td>
                                                    {display(unit.type)} · {display(unit.size)}
                                                </td>
                                                <td>
                                                    <span className="badge badge-neutral">
                                                        {display(unit.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {unit.temporaryPin ? (
                                                        <span className="pin-display">
                                                            {unit.temporaryPin}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94A3B8" }}>
                                                            Chưa cấp
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {display(
                                                        unit.temporaryPinExpiresAt || "—"
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {returnRequests.length > 0 && (
                        <section className="card" style={{ border: "1.5px solid #BFDBFE", background: "#F8FAFC" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                                <div>
                                    <span className="eyebrow">TRẢ KHO / NGHIỆM THU</span>
                                    <h2 style={{ margin: "2px 0 0" }}>Đơn yêu cầu trả kho mới tại cơ sở ({returnRequests.length})</h2>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <Link className="btn-figma btn-primary-dark btn-sm" to="/facility/tasks/assign">Phân công Staff</Link>
                                    <Link className="btn-figma btn-outline btn-sm" to="/facility/inspections">Danh sách nghiệm thu</Link>
                                </div>
                            </div>
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Hợp đồng</th>
                                            <th>Khách hàng</th>
                                            <th>Kho</th>
                                            <th>Ngày hẹn trả</th>
                                            <th>Lý do trả</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnRequests.map((c) => (
                                            <tr key={String(c.id)}>
                                                <td><strong>{display(c.id)}</strong></td>
                                                <td>{display(c.customerName)}<br /><small>{display(c.customerPhone)}</small></td>
                                                <td><strong>{display(c.unitCode)}</strong></td>
                                                <td>{formatDate(c.checkoutRequestedDate)}</td>
                                                <td>{display(c.checkoutReason)}</td>
                                                <td><span className="badge pending">{c.inspectionStatus ? statusLabel(c.inspectionStatus) : "Chờ nghiệm thu"}</span></td>
                                                <td><Link className="btn-figma btn-outline btn-sm" to={`/facility/inspections/${encodeURIComponent(String(c.id))}`}>Xem phiếu</Link></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <section className="card">
                        <h2>Yêu cầu thẻ hẹn, check-in &amp; trả kho</h2>
                        {!tasks.length ? (
                            <p>Chưa có yêu cầu tại cơ sở.</p>
                        ) : (
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Task / thẻ hẹn</th>
                                            <th>Khách hàng</th>
                                            <th>Kho</th>
                                            <th>Giờ hẹn</th>
                                            <th>Nhân viên</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.map((task) => (
                                            <tr key={String(task.id)}>
                                                <td>
                                                    <strong>{display(task.id)}</strong>
                                                    <br />
                                                    <small style={{ color: "#64748B" }}>
                                                        {display(
                                                            task.reservationId || task.contractId || task.title
                                                        )}
                                                    </small>
                                                </td>
                                                <td>
                                                    {display(task.customerName)}
                                                    <br />
                                                    <small style={{ color: "#64748B" }}>
                                                        {display(task.customerPhone)}
                                                    </small>
                                                </td>
                                                <td>{display(task.unitCode)}</td>
                                                <td>
                                                    {display(
                                                        task.appointmentAt || task.deadline || task.dueDate
                                                    )}
                                                </td>
                                                <td>
                                                    {display(
                                                        task.staffId
                                                            ? task.staff
                                                            : "Chưa giao"
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge badge-neutral">
                                                        {statusLabel(task.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}
