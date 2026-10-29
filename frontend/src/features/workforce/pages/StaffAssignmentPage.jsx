import { useMemo, useState } from "react";
import { workforceApi } from "../api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import {
  OfficeDialog,
  OfficeHeading,
  OfficeIcon,
  OfficeMetrics,
  OfficeState,
} from "../../../shared/ui/office/OfficeUi";
import "../../reporting/pages/facility-manager-stitch.css";

const taskLabel = {
  GENERAL: "Công việc chung",
  CLEANING: "Vệ sinh",
  MAINTENANCE: "Bảo trì",
  CHECKIN: "Check-in",
  RETURN: "Trả kho",
  SUPPORT: "Hỗ trợ",
};
const statusTone = (value) =>
  ["COMPLETED", "RESOLVED"].includes(String(value).toUpperCase())
    ? "success"
    : ["CANCELLED", "FAILED"].includes(String(value).toUpperCase())
      ? "danger"
      : "pending";

export default function StaffAssignmentPage() {
  const dashboard = useRemote(workforceApi.managerDashboard);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [filter, setFilter] = useState("OPEN");
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const tasks = Array.isArray(dashboard.data?.tasks)
    ? dashboard.data.tasks
    : [];
  const allStaff = Array.isArray(dashboard.data?.staff)
    ? dashboard.data.staff
    : [];
  const staff = allStaff.filter((row) => row.canReceiveTasks);
  const units = Array.isArray(dashboard.data?.units)
    ? dashboard.data.units
    : [];
  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (filter === "ALL" ||
            ["PENDING", "IN_PROGRESS"].includes(task.status)) &&
          (!search ||
            [
              task.id,
              task.title,
              task.customerName,
              task.unitCode,
              task.staff,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(search.toLowerCase()),
            )),
      ),
    [tasks, filter, search],
  );
  const openCount = tasks.filter((task) =>
    ["PENDING", "IN_PROGRESS"].includes(task.status),
  ).length;
  const unassigned = tasks.filter(
    (task) => ["PENDING", "IN_PROGRESS"].includes(task.status) && !task.staffId,
  ).length;
  async function dispatch(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      await workforceApi.assign(body);
      form.reset();
      setMessage("Đã tạo và phân công công việc.");
      dashboard.reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="office-page office-staff-assignments">
      <OfficeHeading
        title="Phân công nhân viên"
        description="Phân bổ công việc trong phạm vi cơ sở. Chỉ nhân viên đang hoạt động mới nhận task mới."
        eyebrow="FACILITY MANAGER / NHÂN SỰ CƠ SỞ"
      >
        <button className="secondary" type="button" onClick={dashboard.reload}>
          <OfficeIcon>refresh</OfficeIcon>Làm mới danh sách
        </button>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("staff-dispatch-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <OfficeIcon>person_add</OfficeIcon>Phân công nhân viên
        </button>
      </OfficeHeading>
      <OfficeMetrics
        items={[
          {
            label: "Nhân viên hoạt động",
            value: `${staff.filter((row) => String(row.status).toUpperCase() === "ACTIVE").length} / ${allStaff.length}`,
            icon: "badge",
            tone: "teal",
            note: "Trong phạm vi cơ sở",
          },
          {
            label: "Task đang mở",
            value: openCount,
            icon: "assignment",
            tone: "blue",
            note: "PENDING / IN_PROGRESS",
          },
          {
            label: "Chờ phân công",
            value: unassigned,
            icon: "person_search",
            tone: "amber",
            note: "Cần chọn Staff",
          },
          {
            label: "Kho liên quan",
            value: units.length,
            icon: "inventory_2",
            tone: "navy",
            note: "Unit tại cơ sở",
          },
        ]}
      />
      {(error || dashboard.error) && (
        <div className="office-alert office-alert-error" role="alert">
          {error || dashboard.error}
        </div>
      )}
      {message && (
        <div className="office-alert office-alert-success" role="status">
          {message}
        </div>
      )}
      <section className="card office-table office-assignment-staff">
        <div className="office-table-header">
          <div>
            <span className="eyebrow">DANH SÁCH NHÂN SỰ</span>
            <h2>
              Staff tại cơ sở <span className="count">{allStaff.length}</span>
            </h2>
          </div>
          <small>Chọn nhân sự để xem task và trạng thái phân công</small>
        </div>
        {dashboard.busy ? (
          <OfficeState busy />
        ) : allStaff.length === 0 ? (
          <OfficeState
            title="Không có nhân viên"
            description="Nhân sự thuộc cơ sở sẽ hiển thị khi được gán phạm vi."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Tài khoản</th>
                  <th>Trạng thái</th>
                  <th>Task đang mở</th>
                  <th>Khả năng nhận task</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allStaff.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="office-person-cell">
                        <span className="office-avatar">
                          {String(person.name || "N").slice(0, 1)}
                        </span>
                        <strong>{display(person.name)}</strong>
                      </div>
                    </td>
                    <td>{display(person.username)}</td>
                    <td>
                      <span
                        className={`badge ${String(person.status).toUpperCase() === "ACTIVE" ? "success" : "danger"}`}
                      >
                        {display(person.status)}
                      </span>
                    </td>
                    <td>{display(person.openTaskCount)}</td>
                    <td>
                      {person.canReceiveTasks ? (
                        <span className="badge success">Có thể giao</span>
                      ) : (
                        <span className="badge danger">Không hoạt động</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="office-row-action"
                        type="button"
                        onClick={() => setSelectedStaff(person)}
                      >
                        Xem chi tiết <OfficeIcon>arrow_forward</OfficeIcon>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section id="staff-dispatch-form" className="card office-assignment-form">
        <div className="office-table-header">
          <div>
            <span className="eyebrow">ĐIỀU PHỐI NHÂN SỰ</span>
            <h2>Tạo công việc mới</h2>
          </div>
          <span className="badge">Phạm vi: cơ sở hiện tại</span>
        </div>
        <form onSubmit={dispatch} className="form-grid">
          <label>
            Nội dung công việc
            <input
              name="title"
              maxLength={255}
              required
              placeholder="Ví dụ: Kiểm tra cảm biến khoang M-101"
            />
          </label>
          <label>
            Loại công việc
            <select name="taskType">
              <option value="GENERAL">Công việc chung</option>
              <option value="CLEANING">Vệ sinh</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
          </label>
          <label>
            Nhân viên
            <select name="staffId" required>
              <option value="">Chọn Staff</option>
              {staff.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} · {row.openTaskCount} task mở
                </option>
              ))}
            </select>
          </label>
          <label>
            Kho liên quan
            <select name="unitCode">
              <option value="">Không gắn kho</option>
              {units.map((row) => (
                <option key={row.code} value={row.code}>
                  {row.code} · {row.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ngày thực hiện
            <input name="date" type="date" required />
          </label>
          <label>
            Giờ hạn
            <input name="deadline" type="time" defaultValue="17:00" required />
          </label>
          <div className="form-actions">
            <button disabled={working || !staff.length}>
              <OfficeIcon>assignment_ind</OfficeIcon>
              {working ? "Đang lưu…" : "Tạo và giao việc"}
            </button>
            {!staff.length && (
              <small>Chưa có Staff hoạt động để nhận task.</small>
            )}
          </div>
        </form>
      </section>
      <section className="card office-table">
        <div className="office-table-header">
          <div>
            <span className="eyebrow">HÀNG ĐỢI PHÂN CÔNG</span>
            <h2>
              Công việc của cơ sở{" "}
              <span className="count">{visible.length}</span>
            </h2>
          </div>
          <div className="office-assignment-filters">
            <input
              aria-label="Tìm công việc"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã task, khách hàng, Unit..."
            />
            <select
              aria-label="Lọc công việc"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="OPEN">Đang mở</option>
              <option value="ALL">Tất cả</option>
            </select>
          </div>
        </div>
        {dashboard.busy ? (
          <OfficeState busy />
        ) : visible.length === 0 ? (
          <OfficeState
            title="Không có công việc trong phạm vi"
            description="Task mới sẽ hiển thị khi được tạo hoặc đồng bộ từ hệ thống."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Công việc</th>
                  <th>Khách / đơn</th>
                  <th>Kho</th>
                  <th>Lịch hẹn</th>
                  <th>Trạng thái</th>
                  <th>Phân công</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((task) => (
                  <TaskRow
                    key={task.id + String(task.staffId)}
                    task={task}
                    staff={staff}
                    onDone={dashboard.reload}
                    onError={setError}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedStaff && (
        <OfficeDialog
          title={`Hồ sơ nhân sự · ${display(selectedStaff.name)}`}
          onClose={() => setSelectedStaff(null)}
        >
          <div className="office-staff-detail">
            <div className="office-staff-detail-head">
              <span className="office-avatar office-avatar-large">
                {String(selectedStaff.name || "N").slice(0, 1)}
              </span>
              <div>
                <h3>{display(selectedStaff.name)}</h3>
                <p>
                  {display(selectedStaff.username)} ·{" "}
                  {display(selectedStaff.status)}
                </p>
              </div>
              <span
                className={`badge ${selectedStaff.canReceiveTasks ? "success" : "danger"}`}
              >
                {selectedStaff.canReceiveTasks
                  ? "Có thể nhận task"
                  : "Không hoạt động"}
              </span>
            </div>
            <dl className="office-detail-grid">
              <div>
                <dt>Mã nhân sự</dt>
                <dd>{display(selectedStaff.id)}</dd>
              </div>
              <div>
                <dt>Task đang mở</dt>
                <dd>{display(selectedStaff.openTaskCount)}</dd>
              </div>
              <div>
                <dt>Phạm vi</dt>
                <dd>Chỉ cơ sở hiện tại</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>{display(selectedStaff.status)}</dd>
              </div>
            </dl>
            <h3>Task đang phụ trách</h3>
            <div className="office-staff-task-list">
              {tasks.filter(
                (task) =>
                  task.staffId === selectedStaff.id &&
                  task.status !== "COMPLETED",
              ).length === 0 ? (
                <p>Chưa có task đang mở.</p>
              ) : (
                tasks
                  .filter(
                    (task) =>
                      task.staffId === selectedStaff.id &&
                      task.status !== "COMPLETED",
                  )
                  .map((task) => (
                    <div key={task.id}>
                      <strong>{display(task.title)}</strong>
                      <small>
                        {display(task.id)} · {display(task.unitCode)} ·{" "}
                        <span className={`badge ${statusTone(task.status)}`}>
                          {display(task.status)}
                        </span>
                      </small>
                    </div>
                  ))
              )}
            </div>
            <div className="office-detail-actions">
              <button
                type="button"
                onClick={() => {
                  setSelectedStaff(null);
                  window.setTimeout(
                    () =>
                      document
                        .getElementById("staff-dispatch-form")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    0,
                  );
                }}
              >
                <OfficeIcon>assignment_ind</OfficeIcon>Phân công công việc
              </button>
            </div>
          </div>
        </OfficeDialog>
      )}
    </div>
  );
}

function TaskRow({ task, staff, onDone, onError }) {
  const [staffId, setStaffId] = useState(task.staffId || "");
  const [busy, setBusy] = useState(false);
  const open = ["PENDING", "IN_PROGRESS"].includes(task.status);
  async function assign() {
    setBusy(true);
    onError("");
    try {
      await workforceApi.assignExisting(task.id, { staffId });
      onDone();
    } catch (cause) {
      onError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <tr>
      <td>
        <strong>{display(task.title)}</strong>
        <small>
          {taskLabel[task.taskType] || display(task.taskType)} ·{" "}
          {display(task.id)}
        </small>
      </td>
      <td>
        {display(task.customerName)}
        <small>{display(task.reservationId || task.contractId)}</small>
      </td>
      <td>{display(task.unitCode || "Chưa gán Unit")}</td>
      <td>
        {display(task.dueDate)}
        <small>{display(task.deadline)}</small>
      </td>
      <td>
        <span className={`badge ${statusTone(task.status)}`}>
          {display(task.status)}
        </span>
      </td>
      <td>
        {open ? (
          <div className="office-task-assign">
            <select
              aria-label={`Nhân viên cho ${task.id}`}
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            >
              <option value="">Chọn Staff</option>
              {staff.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} ({row.openTaskCount} task mở)
                </option>
              ))}
            </select>
            <button type="button" disabled={busy || !staffId} onClick={assign}>
              {busy ? "Đang giao…" : "Giao việc"}
            </button>
          </div>
        ) : (
          display(task.staff)
        )}
      </td>
    </tr>
  );
}
