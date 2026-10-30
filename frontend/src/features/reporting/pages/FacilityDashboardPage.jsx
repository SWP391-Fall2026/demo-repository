import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { facilityApi } from "../../facility/api/facility.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import {
  OfficeHeading,
  OfficeIcon,
  OfficeMetrics,
  OfficeState,
} from "../../../shared/ui/office/OfficeUi";
import "./facility-manager-stitch.css";

const statusLabel = {
  available: "Còn trống",
  reserved: "Đang giữ chỗ",
  occupied: "Đang thuê",
  cleaning: "Đang vệ sinh",
  maintenance: "Bảo trì",
};
const statusTone = (value) =>
  ["available"].includes(String(value).toLowerCase())
    ? "success"
    : ["cleaning", "maintenance", "reserved"].includes(
          String(value).toLowerCase(),
        )
      ? "pending"
      : "danger";

export default function FacilityDashboardPage() {
  const dashboard = useRemote(workforceApi.managerDashboard);
  const managedUnits = useRemote(facilityApi.managedUnits);
  const [pinMessage, setPinMessage] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [unitFilter, setUnitFilter] = useState("ALL");
  const facility = dashboard.data?.facility || {};
  const staff = Array.isArray(dashboard.data?.staff)
    ? dashboard.data.staff
    : [];
  const units = (
    Array.isArray(dashboard.data?.units) ? dashboard.data.units : []
  ).map((unit) => ({
    ...unit,
    floor: (Array.isArray(managedUnits.data) ? managedUnits.data : []).find(
      (row) => row.code === unit.code,
    )?.floor,
  }));
  const tasks = Array.isArray(dashboard.data?.tasks)
    ? dashboard.data.tasks
    : [];
  const counts = useMemo(
    () =>
      units.reduce(
        (acc, unit) => {
          const key = String(unit.status || "").toLowerCase();
          acc.total += 1;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { total: 0 },
      ),
    [units],
  );
  const activeStaff = staff.filter(
    (person) => String(person.status).toUpperCase() === "ACTIVE",
  ).length;
  const openTasks = tasks.filter((task) => task.status !== "COMPLETED");
  const unassigned = openTasks.filter((task) => !task.staffId).length;
  const incidents = tasks.filter(
    (task) =>
      ["INCIDENT", "SUPPORT"].includes(String(task.taskType).toUpperCase()) &&
      task.status !== "COMPLETED",
  );
  const byType = useMemo(() => {
    const rows = new Map();
    units.forEach((unit) => {
      const key = String(unit.type || "UNKNOWN").toUpperCase();
      const row = rows.get(key) || {
        type: key,
        total: 0,
        occupied: 0,
        available: 0,
        unavailable: 0,
      };
      row.total += 1;
      if (unit.status === "occupied") row.occupied += 1;
      else if (unit.status === "available") row.available += 1;
      else if (["cleaning", "maintenance"].includes(unit.status))
        row.unavailable += 1;
      rows.set(key, row);
    });
    return [...rows.values()].sort((a, b) => a.type.localeCompare(b.type));
  }, [units]);
  const floorGroups = useMemo(() => {
    const groups = new Map();
    units.forEach((unit) => {
      const floor = unit.floor ?? "—";
      const list = groups.get(floor) || [];
      list.push(unit);
      groups.set(floor, list);
    });
    return [...groups.entries()].sort((a, b) =>
      String(a[0]).localeCompare(String(b[0])),
    );
  }, [units]);
  async function rotateFacilityPin(event) {
    event.preventDefault();
    if (!facility.code) return;
    setPinBusy(true);
    setPinMessage("");
    try {
      const result = await facilityApi.setCheckinPin(String(facility.code));
      setPinMessage(
        `PIN cơ sở: ${String(result.pin || "")}. PIN chỉ hiện lần này; chuyển cho Staff qua kênh nội bộ an toàn.`,
      );
      dashboard.reload();
    } catch (cause) {
      setPinMessage(
        cause instanceof Error ? cause.message : "Không cấp được PIN cơ sở.",
      );
    } finally {
      setPinBusy(false);
    }
  }
  if (dashboard.busy)
    return (
      <div className="office-page office-facility-overview">
        <OfficeState busy title="Đang tải tổng quan cơ sở" />
      </div>
    );
  if (dashboard.error)
    return (
      <div className="office-page office-facility-overview">
        <OfficeState error={dashboard.error} onRetry={dashboard.reload} />
      </div>
    );
  return (
    <div className="office-page office-facility-overview">
      <OfficeHeading
        title="Tổng quan cơ sở"
        description={`${display(facility.name)} · ${display(facility.code)} · ${display(facility.address)}, ${display(facility.city)}`}
        eyebrow="FACILITY MANAGER / TỔNG QUAN CƠ SỞ"
      >
        <button className="secondary" type="button" onClick={dashboard.reload}>
          <OfficeIcon>sync</OfficeIcon>Làm mới số liệu
        </button>
        <Link className="button" to="/facility/reports">
          <OfficeIcon>summarize</OfficeIcon>Báo cáo nhanh
        </Link>
      </OfficeHeading>
      <section className="office-page card office-facility-identity">
        <div className="office-facility-identity-grid">
          <div>
            <div className="office-facility-title">
              <span className="office-facility-icon">
                <OfficeIcon>warehouse</OfficeIcon>
              </span>
              <div>
                <span className="eyebrow">THÔNG TIN TRẠM TRỰC THUỘC</span>
                <h2>
                  {display(facility.name)} — {display(facility.code)}
                </h2>
              </div>
              <span
                className={`badge ${String(facility.status).toLowerCase() === "active" ? "success" : "pending"}`}
              >
                {display(facility.status)}
              </span>
            </div>
            <dl className="office-detail-grid">
              <div>
                <dt>Địa chỉ thực địa</dt>
                <dd>
                  {display(facility.address)}, {display(facility.city)}
                </dd>
              </div>
              <div>
                <dt>Hotline</dt>
                <dd>{display(facility.hotline)}</dd>
              </div>
              <div>
                <dt>PIN cơ sở</dt>
                <dd>
                  <strong>
                    {facility.checkinPin ||
                      (facility.checkinPinConfigured
                        ? "Cần cấp lại để hiển thị"
                        : "Chưa cấp")}
                  </strong>
                </dd>
              </div>
              <div>
                <dt>Khoang quản lý</dt>
                <dd>{counts.total} Unit đang đồng bộ từ hệ thống</dd>
              </div>
            </dl>
            <form className="office-pin-form" onSubmit={rotateFacilityPin}>
              <button disabled={pinBusy}>
                {pinBusy
                  ? "Đang cấp…"
                  : facility.checkinPin
                    ? "Xoay PIN cơ sở"
                    : facility.checkinPinConfigured
                      ? "Tạo PIN hiển thị"
                      : "Cấp PIN cơ sở"}
              </button>
              {pinMessage && (
                <span className="notice" role="status">
                  {pinMessage}
                </span>
              )}
            </form>
          </div>
          <div className="office-facility-status">
            <span className="office-facility-status-icon">
              <OfficeIcon>domain</OfficeIcon>
            </span>
            <strong>Trạng thái trạm</strong>
            <span
              className={`badge ${String(facility.status).toLowerCase() === "active" ? "success" : "pending"}`}
            >
              {display(facility.status)}
            </span>
            <p>Thông tin hiển thị theo phạm vi cơ sở của Manager.</p>
          </div>
        </div>
      </section>
      <OfficeMetrics
        items={[
          {
            label: "Tổng khoang",
            value: counts.total,
            icon: "layers",
            note: "Unit thuộc cơ sở",
          },
          {
            label: "Đang cho thuê",
            value: counts.occupied || 0,
            icon: "lock",
            tone: "blue",
            note: counts.total
              ? `${(((counts.occupied || 0) / counts.total) * 100).toFixed(1)}% lấp đầy`
              : "Chưa có dữ liệu",
          },
          {
            label: "Trống sẵn sàng",
            value: counts.available || 0,
            icon: "meeting_room",
            tone: "teal",
            note: "Có thể bàn giao",
          },
          {
            label: "Vệ sinh / bảo trì",
            value: (counts.cleaning || 0) + (counts.maintenance || 0),
            icon: "cleaning_services",
            tone: "amber",
            note: "Tạm ngưng nhận đơn",
          },
          {
            label: "Task đang mở",
            value: openTasks.length,
            icon: "assignment",
            tone: "navy",
            note: `${unassigned} chờ phân công`,
          },
          {
            label: "Hỗ trợ cần xử lý",
            value: incidents.length,
            icon: "support",
            tone: "amber",
            note: "Theo hàng đợi vận hành",
          },
        ]}
      />
      <div className="office-two-columns office-facility-columns">
        <div className="office-facility-main">
          <section className="card office-table">
            <div className="office-table-header">
              <div>
                <span className="eyebrow">CƠ CẤU VẬN HÀNH</span>
                <h2>Phân bổ khoang theo loại hình</h2>
              </div>
              <Link to="/facility/units" className="staff-link">
                Xem chi tiết khoang <OfficeIcon>arrow_forward</OfficeIcon>
              </Link>
            </div>
            <div className="office-capacity-bar">
              <div>
                <span>CHIẾM DỤNG THỰC TẾ</span>
                <span>
                  {counts.total
                    ? `${(((counts.occupied || 0) / counts.total) * 100).toFixed(1)}% đang thuê`
                    : "Chưa có dữ liệu"}
                </span>
              </div>
              <div>
                <i
                  style={{
                    width: `${counts.total ? ((counts.occupied || 0) / counts.total) * 100 : 0}%`,
                  }}
                />
                <i
                  className="available"
                  style={{
                    width: `${counts.total ? ((counts.available || 0) / counts.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {byType.length === 0 ? (
              <OfficeState title="Chưa có Unit" />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Loại khoang</th>
                      <th>Tổng số</th>
                      <th>Đang thuê</th>
                      <th>Trống</th>
                      <th>Bảo trì / vệ sinh</th>
                      <th>Lấp đầy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byType.map((row) => (
                      <tr key={row.type}>
                        <td>
                          <strong>Kho {row.type}</strong>
                        </td>
                        <td>{row.total}</td>
                        <td>{row.occupied}</td>
                        <td>{row.available}</td>
                        <td>{row.unavailable}</td>
                        <td>
                          <span className="badge">
                            {row.total
                              ? `${((row.occupied / row.total) * 100).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="card">
            <div className="office-table-header">
              <div>
                <span className="eyebrow">SƠ ĐỒ TRẠM</span>
                <h2>Mặt bằng khoang theo tầng</h2>
              </div>
              <select
                value={unitFilter}
                onChange={(event) => setUnitFilter(event.target.value)}
                aria-label="Lọc trạng thái khoang"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="available">Còn trống</option>
                <option value="occupied">Đang thuê</option>
                <option value="cleaning">Đang vệ sinh</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
            {floorGroups.length === 0 ? (
              <OfficeState title="Chưa có mặt bằng khoang" />
            ) : (
              <div className="office-floor-map">
                {floorGroups.map(([floor, floorUnits]) => (
                  <div className="office-floor-row" key={String(floor)}>
                    <strong>Tầng {floor}</strong>
                    <div className="office-unit-map">
                      {floorUnits
                        .filter(
                          (unit) =>
                            unitFilter === "ALL" || unit.status === unitFilter,
                        )
                        .map((unit) => (
                          <span
                            key={unit.code}
                            data-status={String(
                              unit.status || "",
                            ).toUpperCase()}
                            title={`${unit.code} · ${statusLabel[unit.status] || display(unit.status)}`}
                          >
                            <b>{unit.code}</b>
                            <small>
                              {statusLabel[unit.status] || display(unit.status)}
                            </small>
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="office-facility-side">
          <section className="card">
            <div className="office-table-header">
              <div>
                <span className="eyebrow">NHÂN SỰ CƠ SỞ</span>
                <h2>Staff đang hoạt động</h2>
              </div>
              <Link to="/facility/tasks/assign" className="staff-link">
                Phân công <OfficeIcon>arrow_forward</OfficeIcon>
              </Link>
            </div>
            {staff.length === 0 ? (
              <OfficeState title="Chưa có nhân viên" />
            ) : (
              <div className="office-roster">
                {staff.map((person) => (
                  <div key={person.id}>
                    <span className="office-avatar">
                      {String(person.name || "N").slice(0, 1)}
                    </span>
                    <span>
                      <strong>{display(person.name)}</strong>
                      <small>{display(person.username)}</small>
                    </span>
                    <b>{display(person.openTaskCount)} task</b>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card">
            <div className="office-table-header">
              <div>
                <span className="eyebrow">HÀNG ĐỢI VẬN HÀNH</span>
                <h2>Task cần giám sát</h2>
              </div>
              <span className="count">{openTasks.length}</span>
            </div>
            {openTasks.length === 0 ? (
              <OfficeState title="Hàng đợi trống" icon="task_alt" />
            ) : (
              <div className="office-task-list">
                {openTasks.slice(0, 8).map((task) => (
                  <div key={task.id}>
                    <span
                      className={`office-task-icon ${statusTone(task.status)}`}
                    >
                      <OfficeIcon>
                        {task.taskType === "CHECKIN"
                          ? "key"
                          : task.taskType === "RETURN"
                            ? "assignment_returned"
                            : "assignment"}
                      </OfficeIcon>
                    </span>
                    <span>
                      <strong>{display(task.title)}</strong>
                      <small>
                        {display(task.id)} · {display(task.unitCode)}
                      </small>
                    </span>
                    <span className={`badge ${statusTone(task.status)}`}>
                      {display(task.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
