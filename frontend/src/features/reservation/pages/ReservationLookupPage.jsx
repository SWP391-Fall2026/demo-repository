import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { reservationApi } from "../api/reservation.api";
import { useRemote } from "../../../shared/api/use-remote";
import { useSession } from "../../identity/session";
import { display, money } from "../../../shared/lib/format";
import {
  StaffAvatar,
  StaffFacts,
  StaffHeading,
  StaffIcon,
  StaffMetric,
  StaffOperations,
  StaffPager,
  StaffSection,
  StaffShell,
  StaffState,
  StaffStatus,
  staffDate,
} from "../../../shared/ui/stitch/StaffUi";

export default function ReservationLookupPage() {
  const session = useSession();
  const remote = useRemote(reservationApi.list);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [type, setType] = useState(""),
    [date, setDate] = useState(""),
    [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();
  const reservations = Array.isArray(remote.data) ? remote.data : [];
  const selected = reservations.find(
    (row) => row.id === params.get("reservation"),
  );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const rows = useMemo(
    () =>
      reservations.filter(
        (row) =>
          (!status || row.status === status) &&
          (!type || row.unitType === type) &&
          (!date ||
            String(row.appointmentAt || row.checkInAt || "").slice(0, 10) ===
              date) &&
          (!search ||
            [
              row.id,
              row.customerName,
              row.customerPhone,
              row.unitCode,
              row.facilityCode,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
            )),
      ),
    [remote.data, search, status, type, date],
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 8)));
  useEffect(() => {
    setPage(1);
  }, [search, status, type, date]);
  const awaiting = reservations.filter(
    (row) =>
      !["CANCELLED", "EXPIRED", "CHECKED_IN", "COMPLETED"].includes(row.status),
  );
  const metrics = [
    [
      "Tổng đơn chờ xử lý",
      awaiting.length,
      "pending_actions",
      "amber",
      "đơn hồ sơ",
    ],
    [
      "Lịch hẹn hôm nay",
      reservations.filter(
        (row) =>
          String(row.appointmentAt || row.checkInAt || "").slice(0, 10) ===
          today,
      ).length,
      "calendar_clock",
      "blue",
      "lượt đến",
    ],
    [
      "Đã xác nhận giữ chỗ",
      reservations.filter((row) => row.status === "RESERVED").length,
      "verified_user",
      "green",
      "đơn",
    ],
    [
      "Đã tiếp nhận check-in",
      reservations.filter((row) => row.status === "CHECKED_IN").length,
      "meeting_room",
      "blue",
      "hồ sơ",
    ],
  ];
  function clearFilters() {
    setSearch("");
    setStatus("");
    setType("");
    setDate("");
  }
  return (
    <StaffShell className="staff-reservation-list">
      <StaffHeading
        title={
          selected
            ? "Chi tiết đơn đặt & Check-in / Handover"
            : "Đơn đặt cần xử lý"
        }
        section="Nghiệp vụ cơ sở / Đơn đặt phòng"
        description={
          selected
            ? "Rà soát hồ sơ khách hàng và thông tin khoang trước khi thực hiện check-in và bàn giao."
            : `Xem và xử lý các đơn đặt liên quan đến hoạt động tại ${session?.user?.facility || "cơ sở được phân công"}.`
        }
        actions={
          selected ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setParams({})}
            >
              <StaffIcon name="arrow_back" />
              Quay lại danh sách đơn
            </button>
          ) : (
            <button type="button" onClick={remote.reload}>
              <StaffIcon name="sync" />
              Làm mới danh sách
            </button>
          )
        }
      />
      {selected ? (
        <>
          <div className="staff-summary-strip">
            <span className="staff-code">
              <StaffIcon name="tag" />
              MÃ: {selected.id}
            </span>
            <StaffStatus value={selected.status} />
            <span>
              <StaffIcon name="event" />
              {staffDate(selected.appointmentAt || selected.checkInAt, true)}
            </span>
          </div>
          <div className="staff-split">
            <div className="staff-stack">
              <StaffSection
                title="Thông tin khách hàng & Đối chiếu hồ sơ"
                icon="badge"
                description="Thông tin từ hồ sơ đặt chỗ của khách hàng"
              >
                <StaffFacts
                  items={[
                    ["Họ và tên khách hàng", selected.customerName],
                    ["Mã khách hàng", selected.userId],
                    ["Số điện thoại liên lạc", selected.customerPhone],
                    ["Email", selected.customerEmail || selected.email],
                    ["Đặt lúc", staffDate(selected.createdAt, true)],
                    ["Ghi chú", selected.notes],
                  ]}
                />
              </StaffSection>
              <StaffSection
                title="Thông tin khoang lưu trữ & Hợp đồng"
                icon="door_front"
              >
                <StaffFacts
                  items={[
                    ["Khoang chỉ định", selected.unitCode || "Chưa gán kho"],
                    ["Loại kho", selected.unitType],
                    ["Cơ sở", selected.facilityName || selected.facilityCode],
                    ["Ngày bắt đầu", staffDate(selected.startDate)],
                    [
                      "Thời hạn thuê",
                      selected.durationMonths
                        ? `${selected.durationMonths} tháng`
                        : "—",
                    ],
                    [
                      "Tiền cọc",
                      selected.depositAmount == null
                        ? "—"
                        : money(selected.depositAmount),
                    ],
                    [
                      "Trạng thái thanh toán",
                      selected.depositStatus || "Chưa có dữ liệu thanh toán",
                    ],
                    [
                      "Lịch hẹn Check-in",
                      staffDate(
                        selected.appointmentAt || selected.checkInAt,
                        true,
                      ),
                    ],
                  ]}
                />
              </StaffSection>
            </div>
            <aside className="staff-stack">
              <StaffSection
                title="Xử lý hồ sơ tại quầy"
                icon="assignment_turned_in"
                className="staff-action-panel"
              >
                <div className="staff-callout">
                  <h3>
                    <StaffIcon name="info" />
                    Điều kiện bàn giao
                  </h3>
                  <p>
                    Đối chiếu giấy tờ gốc và thẻ hẹn; chỉ bàn giao sau khi khách
                    đã xác nhận hợp đồng và thanh toán tiền thuê.
                  </p>
                </div>
                <div className="staff-form-actions staff-vertical-actions">
                  <Link
                    className="button"
                    to={`/facility/handovers/${encodeURIComponent(selected.id)}`}
                  >
                    <StaffIcon name="key" />
                    Mở Check-in / Handover
                  </Link>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setParams({})}
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </StaffSection>
              <section className="staff-callout">
                <h3>
                  <StaffIcon name="verified_user" />
                  Phạm vi xử lý
                </h3>
                <p>
                  Chỉ Staff được phân công công việc check-in mới có thể xác
                  minh và lập biên bản bàn giao.
                </p>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <>
          <div className="staff-metrics">
            {metrics.map(([label, value, icon, tone, unit]) => (
              <StaffMetric
                key={label}
                label={label}
                value={remote.busy ? "—" : String(value).padStart(2, "0")}
                icon={icon}
                tone={tone}
                unit={unit}
              />
            ))}
          </div>
          <StaffSection className="staff-table-panel">
            <div className="staff-toolbar">
              <label className="staff-search">
                <StaffIcon name="search" />
                <input
                  value={search}
                  type="search"
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearch("");
                  }}
                  placeholder="Tìm theo mã đơn đặt, tên khách hàng, số điện thoại..."
                  aria-label="Tìm đơn đặt"
                />
              </label>
              <select
                aria-label="Trạng thái"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {[...new Set(reservations.map((item) => item.status))].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
              <select
                aria-label="Loại kho"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">Tất cả loại kho</option>
                {["S", "M", "L", "CLIMATE"].map((value) => (
                  <option key={value} value={value}>
                    Kho {value}
                  </option>
                ))}
              </select>
              <input
                className="staff-filter-date"
                type="date"
                aria-label="Ngày hẹn Check-in"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <button
                type="button"
                className="secondary staff-icon-button"
                onClick={clearFilters}
                aria-label="Đặt lại bộ lọc"
              >
                <StaffIcon name="restart_alt" />
              </button>
            </div>
            {remote.busy ? (
              <StaffState loading />
            ) : remote.error ? (
              <StaffState error={remote.error} onRetry={remote.reload} />
            ) : !rows.length ? (
              <StaffState
                title="Không có đơn đặt cần xử lý"
                description="Không có đơn đặt phù hợp với bộ lọc tại cơ sở được phân công. Lịch hẹn mới sẽ hiển thị khi phát sinh."
                icon="assignment_turned_in"
                onRetry={remote.reload}
              />
            ) : (
              <div className="table-scroll">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Mã đơn đặt</th>
                      <th>Khách hàng</th>
                      <th>Khoang dự kiến</th>
                      <th>Thời hạn thuê</th>
                      <th>Lịch hẹn Check-in</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice((currentPage - 1) * 8, currentPage * 8)
                      .map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong className="staff-code">{row.id}</strong>
                            <small>
                              Tạo lúc {staffDate(row.createdAt, true)}
                            </small>
                          </td>
                          <td>
                            <StaffAvatar name={row.customerName}>
                              <small>{display(row.customerPhone)}</small>
                              <small>{display(row.userId)}</small>
                            </StaffAvatar>
                          </td>
                          <td>
                            <strong>{row.unitCode || "Chưa gán kho"}</strong>
                            <small>
                              Kho {display(row.unitType)} ·{" "}
                              {display(row.facilityCode)}
                            </small>
                          </td>
                          <td>
                            <strong>
                              {row.durationMonths
                                ? `${row.durationMonths} tháng`
                                : "—"}
                            </strong>
                            <small>Từ {staffDate(row.startDate)}</small>
                          </td>
                          <td>
                            <div className="staff-date-cell">
                              <StaffIcon name="schedule" />
                              {staffDate(
                                row.appointmentAt || row.checkInAt,
                                true,
                              )}
                            </div>
                            <small>{display(row.appointmentStatus)}</small>
                          </td>
                          <td>
                            <StaffStatus value={row.status} />
                            {row.depositStatus && (
                              <small>
                                <StaffStatus value={row.depositStatus} />
                              </small>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="staff-link"
                              onClick={() => setParams({ reservation: row.id })}
                            >
                              Xem chi tiết <StaffIcon name="arrow_forward" />
                            </button>
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
              noun="đơn đặt"
            />
          </StaffSection>
          <StaffOperations
            facility={session?.user?.facility || session?.user?.facilityCode}
            title="Quy chuẩn nghiệp vụ tiếp nhận tại quầy"
            steps={[
              [
                "badge",
                "Đối chiếu hồ sơ",
                "Kiểm tra mã đơn đặt và giấy tờ bản gốc của khách hàng tại quầy.",
              ],
              [
                "key",
                "Kiểm tra khoang",
                "Đối chiếu đúng kho đã được chỉ định và hiện trạng thực tế.",
              ],
              [
                "verified",
                "Bàn giao theo quy trình",
                "Khách xác nhận biên bản trước khi hợp đồng được kích hoạt.",
              ],
            ]}
          />
        </>
      )}
    </StaffShell>
  );
}
