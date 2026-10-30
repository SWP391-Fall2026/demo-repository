import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { supportApi } from "../api/support.api";
import { display } from "../../../shared/lib/format";
import { sessionStore } from "../../identity/session";
import {
  StaffFacts,
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

export default function IncidentDeskPage() {
  const remote = useRemote(supportApi.list);
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("ALL"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [status, setStatus] = useState("IN_PROGRESS"),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [submitting, setSubmitting] = useState(false),
    [demoEmpty, setDemoEmpty] = useState(false);
  const [attachment, setAttachment] = useState("");
  const tickets = Array.isArray(remote.data) ? remote.data : [];
  const selected = tickets.find(
    (row) => String(row.id) === params.get("ticket"),
  );
  const rows = useMemo(
    () =>
      tickets.filter(
        (row) =>
          !demoEmpty &&
          (filter === "ALL" || row.status === filter) &&
          (!search ||
            [
              row.id,
              row.title,
              row.customerName,
              row.unitCode,
              row.category,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
            )),
      ),
    [tickets, filter, search, demoEmpty],
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 8)));
  useEffect(() => setPage(1), [filter, search, demoEmpty]);
  useEffect(() => {
    if (selected) {
      setStatus(selected.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS");
      setNotes(selected.notes || "");
    }
  }, [selected?.id]);
  useEffect(() => {
    let imageUrl;
    let active = true;
    const controller = new AbortController();
    setAttachment("");
    const path = selected?.attachmentUrl;
    if (!path || !/^\/api\/files\/[a-zA-Z0-9.-]+$/.test(path)) return;
    const token = sessionStore.get()?.token;
    const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
      /\/$/,
      "",
    );
    fetch(base + path.slice(4), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được ảnh hiện trạng.");
        return response.blob();
      })
      .then((blob) => {
        if (active) {
          imageUrl = URL.createObjectURL(blob);
          setAttachment(imageUrl);
        }
      })
      .catch((cause) => {
        if (active && cause.name !== "AbortError") setError(cause.message);
      });
    return () => {
      active = false;
      controller.abort();
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [selected?.attachmentUrl]);
  async function handleUpdate(event) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await supportApi.progress({ id: selected.id, status, notes });
      setMessage("Đã gửi phản hồi và cập nhật trạng thái yêu cầu.");
      setParams({});
      setNotes("");
      remote.reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSubmitting(false);
    }
  }
  async function openAttachment(url) {
    try {
      await supportApi.openAttachment(url);
    } catch (cause) {
      setError(cause.message);
    }
  }
  const metrics = [
    ["Tất cả yêu cầu", tickets.length, "support_agent", "blue"],
    [
      "Mới tiếp nhận",
      tickets.filter((row) => row.status === "OPEN").length,
      "mark_email_unread",
      "amber",
    ],
    [
      "Đang xử lý",
      tickets.filter((row) => row.status === "IN_PROGRESS").length,
      "pending_actions",
      "blue",
    ],
    [
      "Đã giải quyết",
      tickets.filter((row) => row.status === "RESOLVED").length,
      "task_alt",
      "green",
    ],
  ];
  return (
    <StaffShell className="staff-support-list">
      <StaffHeading
        title={selected ? `Chi tiết yêu cầu #${selected.id}` : "Yêu cầu hỗ trợ"}
        section="Nghiệp vụ cơ sở / Yêu cầu hỗ trợ"
        description={
          selected
            ? "Kiểm tra hiện trường, phản hồi khách và ghi nhận kết quả xử lý."
            : "Tiếp nhận phản ánh của khách, kiểm tra hiện trường và cập nhật kết quả xử lý tại cơ sở."
        }
        actions={
          selected ? (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setParams({})}
              >
                <StaffIcon name="arrow_back" />
                Quay lại danh sách
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setDemoEmpty((value) => !value)}
              >
                <StaffIcon name={demoEmpty ? "table_rows" : "visibility"} />
                {demoEmpty ? "Quay lại danh sách" : "Xem chế độ trống (Demo)"}
              </button>
              <button type="button" onClick={remote.reload}>
                <StaffIcon name="refresh" />
                Làm mới danh sách
              </button>
            </>
          )
        }
      />
      <StaffNotice error={Boolean(error || remote.error)}>
        {error || remote.error || message}
      </StaffNotice>
      {selected ? (
        <div className="staff-split staff-detail-layout">
          <StaffSection
            title={`Chi tiết yêu cầu #${selected.id}`}
            icon="description"
          >
            <div className="staff-detail-title">
              <div>
                <h3>{display(selected.title)}</h3>
                <p>
                  {display(selected.category)} ·{" "}
                  {staffDate(selected.createdAt, true)}
                </p>
              </div>
              <StaffStatus value={selected.status} />
            </div>
            <StaffFacts
              items={[
                ["Khách hàng", selected.customerName],
                ["Kho / Unit", selected.unitCode],
                ["Mã cơ sở", selected.facilityCode],
                ["Ngày gửi", staffDate(selected.createdAt, true)],
                ["Mức ưu tiên", selected.priority],
              ]}
            />
            <p className="staff-detail-copy">{display(selected.description)}</p>
            {attachment && (
              <figure className="staff-support-photo">
                <img
                  src={attachment}
                  alt="Ảnh hiện trạng do khách đính kèm yêu cầu"
                />
                <figcaption>Ảnh hiện trạng khách hàng cung cấp</figcaption>
              </figure>
            )}
            {selected.attachmentUrl && (
              <button
                type="button"
                className="secondary staff-attachment"
                onClick={() => openAttachment(selected.attachmentUrl)}
              >
                <StaffIcon name="image" />
                Xem ảnh hiện trạng
              </button>
            )}
            <div className="staff-form-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setParams({})}
              >
                Quay lại danh sách
              </button>
            </div>
          </StaffSection>
          <StaffSection title="Phản hồi & Xử lý yêu cầu" icon="rate_review">
            <form className="staff-form" onSubmit={handleUpdate}>
              <label>
                Trạng thái sau phản hồi
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                </select>
              </label>
              <label>
                Nội dung phản hồi khách hàng
                <textarea
                  required
                  rows={6}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ghi rõ hiện trạng, phương án xử lý và kết quả..."
                />
              </label>
              <label className="staff-check">
                <input type="checkbox" required />
                Đã kiểm tra nội dung phản hồi và kết quả xử lý trước khi gửi cho
                khách.
              </label>
              <div className="staff-form-actions">
                <button disabled={submitting}>
                  <StaffIcon name="check_circle" />
                  {submitting ? "Đang gửi…" : "Gửi phản hồi"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setParams({})}
                >
                  Quay lại danh sách
                </button>
              </div>
            </form>
          </StaffSection>
        </div>
      ) : (
        <>
          <div className="staff-metrics">
            {metrics.map(([label, value, icon, tone]) => (
              <StaffMetric
                key={label}
                label={label}
                value={remote.busy ? "—" : String(value).padStart(2, "0")}
                icon={icon}
                tone={tone}
                unit="phiếu"
              />
            ))}
          </div>
          <StaffSection className="staff-table-panel">
            <div className="staff-toolbar">
              <label className="staff-search">
                <StaffIcon name="search" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === "Escape" && setSearch("")}
                  placeholder="Tìm theo mã yêu cầu, tên khách hàng, khoang..."
                />
              </label>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="OPEN">Mới tiếp nhận</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã giải quyết</option>
              </select>
              <button
                type="button"
                className="secondary staff-icon-button"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                aria-label="Đặt lại"
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
                title="Không có yêu cầu hỗ trợ"
                description={
                  demoEmpty
                    ? "Chế độ trống minh họa. Quay lại danh sách thực tế để xem dữ liệu từ hệ thống."
                    : "Các yêu cầu mới từ khách hàng sẽ hiển thị tại đây."
                }
                icon="inbox"
                onRetry={remote.reload}
              />
            ) : (
              <div className="table-scroll">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Mã yêu cầu & Thời gian</th>
                      <th>Khách hàng</th>
                      <th>Vị trí kho (Unit)</th>
                      <th>Nội dung yêu cầu & Ghi chú</th>
                      <th>Trạng thái & Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice((currentPage - 1) * 8, currentPage * 8)
                      .map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.id}</strong>
                            <small>
                              {display(row.category)} ·{" "}
                              {staffDate(row.createdAt, true)}
                            </small>
                          </td>
                          <td>
                            <strong>{display(row.customerName)}</strong>
                            <small>{display(row.userId)}</small>
                          </td>
                          <td>
                            {display(row.unitCode)}
                            <small>{display(row.facilityCode)}</small>
                          </td>
                          <td>
                            <strong>{display(row.title)}</strong>
                            <small>
                              {display(row.notes || row.description)}
                            </small>
                          </td>
                          <td>
                            <StaffStatus value={row.status} />
                            <button
                              type="button"
                              className="staff-link"
                              onClick={() => setParams({ ticket: row.id })}
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
              noun="yêu cầu"
            />
          </StaffSection>
          <StaffOperations
            title="Quy chuẩn tiếp nhận & giải quyết yêu cầu hỗ trợ tại cơ sở"
            facility="Cơ sở được phân công"
            steps={[
              [
                "fact_check",
                "Tiếp nhận & Kiểm tra",
                "Đối chiếu khách hàng, Unit và nội dung phản ánh trước khi xử lý.",
              ],
              [
                "location_on",
                "Hiện trường thực địa",
                "Kiểm tra kho và thiết bị liên quan; ghi nhận biện pháp khắc phục.",
              ],
              [
                "forum",
                "Cập nhật & Phản hồi",
                "Phản hồi kết quả rõ ràng để khách theo dõi tiến độ trên tài khoản.",
              ],
            ]}
          />
        </>
      )}
    </StaffShell>
  );
}
