import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { workforceApi } from "../api/workforce.api";
import { supportApi } from "../../support/api/support.api";
import { reservationApi } from "../../reservation/api/reservation.api";
import { rentalApi } from "../../rental/api/rental.api";
import { useSession } from "../../identity/session";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import {
  StaffAvatar,
  StaffHeading,
  StaffIcon,
  StaffMetric,
  StaffNotice,
  StaffOperations,
  StaffPager,
  StaffSection,
  StaffShell,
  StaffState,
  StaffStatus,
  staffDate,
} from "../../../shared/ui/stitch/StaffUi";

const typeLabels = {
  CHECKIN: "Check-in & Bàn giao",
  RETURN: "Trả kho & Nghiệm thu",
  CLEANING: "Vệ sinh khoang",
  MAINTENANCE: "Bảo trì khoang",
  GENERAL: "Công việc chung",
  SUPPORT: "Yêu cầu hỗ trợ",
};
const isOpen = (row) => ["PENDING", "IN_PROGRESS", "OPEN"].includes(row.status);

export default function StaffTaskBoardPage() {
  const session = useSession();
  const tasksRemote = useRemote(workforceApi.list),
    ticketsRemote = useRemote(supportApi.list);
  const reservations = useRemote(reservationApi.list),
    contracts = useRemote(rentalApi.list);
  const [params] = useSearchParams();
  const requestedType = params.get("type") || "";
  const returnList = requestedType === "RETURN";
  const [tab, setTab] = useState("ALL"),
    [search, setSearch] = useState(""),
    [date, setDate] = useState(""),
    [status, setStatus] = useState("OPEN"),
    [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(""),
    [message, setMessage] = useState(""),
    [actionError, setActionError] = useState("");
  const rawTasks = Array.isArray(tasksRemote.data) ? tasksRemote.data : [];
  const tasks = rawTasks.map((task) => {
    const related =
      (Array.isArray(reservations.data) ? reservations.data : []).find(
        (item) => item.id === task.reservationId,
      ) ||
      (Array.isArray(contracts.data) ? contracts.data : []).find(
        (item) => item.id === task.contractId,
      ) ||
      {};
    return {
      ...related,
      ...task,
      customerName: task.customerName || related.customerName,
      customerPhone: task.customerPhone || related.customerPhone,
      appointmentAt: task.appointmentAt || related.appointmentAt,
      startDate: task.startDate || related.startDate || related.startAt,
      endDate: task.endDate || related.endDate || related.endAt,
    };
  });
  const tickets = (
    Array.isArray(ticketsRemote.data) ? ticketsRemote.data : []
  ).map((ticket) => ({ ...ticket, taskType: "SUPPORT" }));
  const queue = [...tasks, ...(!requestedType ? tickets.filter(isOpen) : [])];
  const scoped = queue.filter(
    (item) => !requestedType || item.taskType === requestedType,
  );
  const rows = scoped.filter(
    (item) =>
      (tab === "ALL" || item.taskType === tab) &&
      (status === "ALL" ||
        (status === "OPEN" ? isOpen(item) : item.status === status)) &&
      (!date ||
        String(
          item.appointmentAt || item.dueDate || item.createdAt || "",
        ).slice(0, 10) === date) &&
      (!search ||
        [
          item.title,
          item.id,
          item.customerName,
          item.unitCode,
          item.reservationId,
          item.contractId,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        )),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * 8, currentPage * 8);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  useEffect(() => {
    setPage(1);
  }, [tab, search, date, status, requestedType]);
  function reload() {
    tasksRemote.reload();
    ticketsRemote.reload();
    reservations.reload();
    contracts.reload();
  }
  async function progress(task, nextStatus) {
    setBusyId(task.id);
    setActionError("");
    setMessage("");
    try {
      await workforceApi.progress({ id: task.id, status: nextStatus });
      setMessage("Đã cập nhật công việc.");
      tasksRemote.reload();
    } catch (cause) {
      setActionError(cause.message);
    } finally {
      setBusyId("");
    }
  }
  const title = returnList
    ? "Yêu cầu trả kho"
    : requestedType === "CHECKIN"
      ? "Check-in / Bàn giao"
      : "Staff Dashboard";
  const openTasks = tasks.filter(isOpen);
  const metricCards = returnList
    ? [
        [
          "Yêu cầu chờ xử lý",
          scoped.filter(isOpen).length,
          "pending_actions",
          "amber",
          "Yêu cầu được phân công",
          "yêu cầu",
        ],
        [
          "Lịch hẹn trả hôm nay",
          scoped.filter(
            (item) =>
              String(item.dueDate).slice(0, 10) === today && isOpen(item),
          ).length,
          "calendar_today",
          "blue",
          "Theo lịch xử lý tại cơ sở",
          "lượt hẹn",
        ],
        [
          "Đang nghiệm thu",
          scoped.filter((item) => item.status === "IN_PROGRESS").length,
          "fact_check",
          "blue",
          "Đã tiếp nhận công việc",
          "khoang",
        ],
        [
          "Hoàn tất bàn giao",
          scoped.filter((item) => item.status === "COMPLETED").length,
          "task_alt",
          "green",
          "Trong dữ liệu được phân công",
          "khoang",
        ],
      ]
    : [
        [
          "Đơn đặt cần xử lý",
          (Array.isArray(reservations.data) ? reservations.data : []).filter(
            (item) =>
              ["RESERVED", "CONFIRMED", "PENDING_HANDOVER"].includes(
                item.status,
              ),
          ).length,
          "inventory_2",
          "blue",
          "Đối chiếu thông tin đặt chỗ",
          "đơn",
          "/facility/reservations/lookup",
          "Hàng chờ tiếp nhận",
        ],
        [
          "Check-in / Bàn giao",
          openTasks.filter((item) => item.taskType === "CHECKIN").length,
          "key",
          "green",
          "Khách có công việc được phân công",
          "lượt",
          "/facility/tasks/my?type=CHECKIN",
          "Lịch hẹn khách",
        ],
        [
          "Checkout / Trả kho",
          openTasks.filter((item) => item.taskType === "RETURN").length,
          "published_with_changes",
          "amber",
          "Yêu cầu trả kho chờ nghiệm thu",
          "lượt",
          "/facility/tasks/my?type=RETURN",
          "Quy trình hoàn kho",
        ],
        [
          "Yêu cầu hỗ trợ",
          tickets.filter(isOpen).length,
          "support_agent",
          "blue",
          "Phản ánh đang chờ xử lý",
          "phiếu",
          "/facility/incidents",
          "Hỗ trợ trực tiếp",
        ],
      ];
  return (
    <StaffShell
      className={returnList ? "staff-return-list" : "staff-dashboard"}
    >
      <StaffHeading
        title={title}
        section={
          returnList
            ? "Nghiệp vụ cơ sở / Trả kho & Nghiệm thu"
            : "Hệ thống điều phối"
        }
        description={
          returnList
            ? "Xem và xử lý các yêu cầu trả kho, đối chiếu hiện trạng và nghiệm thu thực địa tại cơ sở."
            : `Quản lý các công việc vận hành tại ${session?.user?.facility || session?.user?.facilityCode || "cơ sở được phân công"}.`
        }
        actions={
          <button type="button" onClick={reload}>
            <StaffIcon name="refresh" />
            Làm mới hàng đợi
          </button>
        }
      >
        {!returnList && (
          <div className="staff-shift-line">
            <span>
              <StaffIcon name="calendar_today" />
              Hôm nay: <strong>{staffDate(new Date())}</strong>
            </span>
            <span>
              <StaffIcon name="badge" />
              Nhân viên:{" "}
              <strong>{session?.user?.name || session?.user?.username}</strong>
            </span>
          </div>
        )}
      </StaffHeading>
      <div className="staff-metrics">
        {metricCards.map(
          ([label, value, icon, tone, detail, unit, to, kicker]) => (
            <StaffMetric
              key={label}
              label={label}
              value={
                tasksRemote.busy ||
                (icon === "support_agent" && ticketsRemote.busy) ||
                (icon === "inventory_2" && reservations.busy)
                  ? "—"
                  : String(value).padStart(2, "0")
              }
              icon={icon}
              tone={tone}
              detail={detail}
              unit={unit}
              to={to}
              kicker={kicker}
            />
          ),
        )}
      </div>
      <StaffNotice
        error={Boolean(
          actionError ||
          ticketsRemote.error ||
          reservations.error ||
          contracts.error,
        )}
      >
        {actionError ||
          ticketsRemote.error ||
          reservations.error ||
          contracts.error ||
          message}
      </StaffNotice>
      <StaffSection
        title={returnList ? undefined : "Công việc cần xử lý"}
        icon="assignment"
        meta={returnList ? undefined : "Công việc được phân công trong ca"}
        className="staff-table-panel staff-queue-panel"
      >
        {!requestedType && (
          <div className="staff-tabs staff-pill-tabs">
            {[
              ["ALL", "Tất cả công việc"],
              ["CHECKIN", "Check-in / Bàn giao"],
              ["RETURN", "Checkout / Trả kho"],
              ["SUPPORT", "Yêu cầu hỗ trợ"],
              ["CLEANING", "Vệ sinh"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={tab === value ? "active" : ""}
                onClick={() => setTab(value)}
              >
                {label}{" "}
                <span>
                  (
                  {
                    queue.filter(
                      (item) =>
                        (value === "ALL" || item.taskType === value) &&
                        isOpen(item),
                    ).length
                  }
                  )
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="staff-toolbar">
          <label className="staff-search">
            <StaffIcon name="search" />
            <input
              type="search"
              aria-label="Tìm công việc"
              placeholder={
                returnList
                  ? "Tìm theo mã yêu cầu, khách hàng, khoang..."
                  : "Tìm theo mã phiếu, khách hàng hoặc khoang..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearch("");
              }}
            />
          </label>
          <select
            aria-label="Trạng thái công việc"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="OPEN">Đang chờ xử lý</option>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ tiếp nhận</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="COMPLETED">Hoàn tất</option>
          </select>
          <label className="staff-date-filter">
            <input
              aria-label="Ngày xử lý"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary staff-icon-button"
            aria-label="Đặt lại bộ lọc"
            onClick={() => {
              setSearch("");
              setDate("");
              setStatus("OPEN");
              setTab("ALL");
            }}
          >
            <StaffIcon name="restart_alt" />
          </button>
        </div>
        {tasksRemote.busy ? (
          <StaffState loading />
        ) : tasksRemote.error ? (
          <StaffState error={tasksRemote.error} onRetry={reload} />
        ) : !rows.length ? (
          <StaffState
            title={
              returnList
                ? "Không có yêu cầu trả kho"
                : "Không có công việc cần xử lý"
            }
            description={
              returnList
                ? "Hiện tại không có yêu cầu trả kho phù hợp bộ lọc tại cơ sở được phân công."
                : "Hàng đợi sẽ cập nhật khi có công việc mới được phân công. Thử đổi bộ lọc để xem các công việc đã hoàn tất."
            }
            onRetry={reload}
            icon={returnList ? "inventory_2" : "assignment_turned_in"}
          />
        ) : (
          <div className="table-scroll">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{returnList ? "Mã yêu cầu" : "Mã phiếu / Phân loại"}</th>
                  <th>Khách hàng</th>
                  <th>Khoang / Cơ sở</th>
                  {returnList && <th>Thời hạn thuê</th>}
                  <th>
                    {returnList ? "Lịch hẹn trả kho" : "Thời gian hẹn / gửi"}
                  </th>
                  <th>Trạng thái nghiệp vụ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={`${item.taskType}-${item.id}`}>
                    <td>
                      <strong className="staff-code">
                        {item.reservationId || item.contractId || item.id}
                      </strong>
                      <small>
                        {typeLabels[item.taskType] || item.taskType}
                      </small>
                      <small>{item.id}</small>
                    </td>
                    <td>
                      <StaffAvatar name={item.customerName}>
                        <small>
                          {display(item.customerPhone || item.userId)}
                        </small>
                      </StaffAvatar>
                    </td>
                    <td>
                      <strong>{display(item.unitCode)}</strong>
                      <small>{display(item.facilityCode)}</small>
                    </td>
                    {returnList && (
                      <td>
                        {item.durationMonths
                          ? `${item.durationMonths} tháng`
                          : "—"}
                        <small>
                          {staffDate(item.startDate)} –{" "}
                          {staffDate(item.endDate)}
                        </small>
                      </td>
                    )}
                    <td>
                      <div className="staff-date-cell">
                        <StaffIcon name="schedule" />
                        {staffDate(
                          item.appointmentAt || item.dueDate || item.createdAt,
                          Boolean(item.appointmentAt || item.createdAt),
                        )}
                      </div>
                      {item.deadline && (
                        <small>Hạn xử lý: {item.deadline}</small>
                      )}
                    </td>
                    <td>
                      <StaffStatus value={item.status} />
                    </td>
                    <td>
                      <div className="staff-cell-actions">
                        {item.taskType === "CHECKIN" ? (
                          <Link
                            className="staff-link"
                            to={`/facility/handovers/${encodeURIComponent(item.reservationId)}`}
                          >
                            Xem chi tiết <StaffIcon name="arrow_forward" />
                          </Link>
                        ) : item.taskType === "RETURN" ? (
                          <Link
                            className="staff-link"
                            to={`/facility/inspections/${encodeURIComponent(item.contractId)}`}
                          >
                            Xem chi tiết <StaffIcon name="arrow_forward" />
                          </Link>
                        ) : item.taskType === "SUPPORT" ? (
                          <Link
                            className="staff-link"
                            to={`/facility/incidents?ticket=${encodeURIComponent(item.id)}`}
                          >
                            Xem chi tiết <StaffIcon name="arrow_forward" />
                          </Link>
                        ) : isOpen(item) ? (
                          <>
                            {item.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                className="secondary"
                                onClick={() => progress(item, "IN_PROGRESS")}
                              >
                                Bắt đầu
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => progress(item, "COMPLETED")}
                            >
                              Hoàn thành
                            </button>
                            {item.taskType === "CLEANING" && (
                              <Link
                                className="staff-link"
                                to="/facility/units/status"
                              >
                                Cập nhật kho
                              </Link>
                            )}
                          </>
                        ) : (
                          <StaffIcon name="task_alt" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <StaffPager
          total={rows.length}
          page={currentPage}
          onChange={setPage}
          noun={returnList ? "yêu cầu trả kho" : "công việc"}
        />
      </StaffSection>
      <StaffOperations
        facility={session?.user?.facility || session?.user?.facilityCode}
        title={
          returnList
            ? "Quy trình tiếp nhận trả kho & Nghiệm thu"
            : "Nhắc việc vận hành trong ca"
        }
        steps={
          returnList
            ? [
                [
                  "fact_check",
                  "Đối chiếu hiện trường",
                  "Cùng khách kiểm tra tài sản đã được di dời và ghi nhận hiện trạng khoang.",
                ],
                [
                  "rule",
                  "Nghiệm thu vật lý",
                  "Kiểm tra cửa, vách, sàn, vệ sinh và khóa trước khi xác nhận.",
                ],
                [
                  "verified_user",
                  "Xác nhận số hóa",
                  "Lập biên bản, thu hồi PIN; kho chuyển sang vệ sinh trước khi Manager duyệt sẵn sàng.",
                ],
              ]
            : [
                [
                  "badge",
                  "Đối chiếu hồ sơ",
                  "Kiểm tra giấy tờ gốc và mã thẻ hẹn của khách trước khi xác nhận check-in.",
                ],
                [
                  "photo_camera",
                  "Kiểm tra khoang",
                  "Ghi nhận hiện trạng, chụp ảnh và lập biên bản theo đúng công việc được giao.",
                ],
                [
                  "verified_user",
                  "Hoàn tất nghiệp vụ",
                  "Khách xác nhận biên bản bàn giao trước khi hợp đồng được kích hoạt.",
                ],
              ]
        }
      />
    </StaffShell>
  );
}
