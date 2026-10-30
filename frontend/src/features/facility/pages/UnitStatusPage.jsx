import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { facilityApi } from "../api/facility.api";
import { rentalApi } from "../../rental/api/rental.api";
import { display, money } from "../../../shared/lib/format";
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
} from "../../../shared/ui/stitch/StaffUi";

export default function UnitStatusPage() {
  const remote = useRemote(facilityApi.managedUnits);
  const contracts = useRemote(rentalApi.list);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const units = Array.isArray(remote.data) ? remote.data : [];
  const selected = units.find((row) => String(row.code) === params.get("unit"));
  const activeContract = (
    Array.isArray(contracts.data) ? contracts.data : []
  ).find(
    (row) =>
      row.unitCode === selected?.code &&
      ["ACTIVE", "EXPIRING_SOON", "OVERDUE"].includes(row.status),
  );
  const rows = useMemo(
    () =>
      units.filter(
        (row) =>
          (!status || String(row.status).toLowerCase() === status) &&
          (!search ||
            [row.code, row.type, row.facilityCode, row.tenantName].some(
              (value) =>
                String(value || "")
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
            )),
      ),
    [units, status, search],
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 10)));
  useEffect(() => setPage(1), [search, status]);
  async function save(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await facilityApi.ready({ code: selected.code, notes });
      setMessage("Đã gửi yêu cầu kho sẵn sàng tới Manager.");
      setParams({});
      setNotes("");
      remote.reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  const metrics = [
    ["Tổng khoang", units.length, "inventory_2", "blue"],
    [
      "Còn trống",
      units.filter((row) => row.status === "available").length,
      "meeting_room",
      "green",
    ],
    [
      "Đang thuê",
      units.filter((row) => row.status === "occupied").length,
      "lock",
      "blue",
    ],
    [
      "Vệ sinh / Bảo trì",
      units.filter((row) => ["cleaning", "maintenance"].includes(row.status))
        .length,
      "cleaning_services",
      "amber",
    ],
  ];
  return (
    <StaffShell className="staff-unit-list">
      <StaffHeading
        title={
          selected ? `Chi tiết kho / Unit #${selected.code}` : "Kho / Unit"
        }
        section="Nghiệp vụ cơ sở / Quản lý khoang"
        description={
          selected
            ? "Thông tin kỹ thuật, môi trường và trạng thái thuê của khoang được chọn."
            : "Theo dõi hiện trạng khoang, thông số kỹ thuật và trạng thái vận hành tại cơ sở."
        }
        actions={
          selected ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setParams({})}
            >
              <StaffIcon name="arrow_back" />
              Quay lại danh sách
            </button>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setParams({ demo: "empty" })}
              >
                <StaffIcon name="visibility" />
                Xem chế độ trống (Demo)
              </button>
              <button type="button" onClick={remote.reload}>
                <StaffIcon name="sync" />
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
          <div className="staff-stack">
            <StaffSection
              title="Thông tin kho / Unit & Thông số kỹ thuật"
              icon="inventory_2"
            >
              <div className="staff-detail-title">
                <h3>{selected.code}</h3>
                <StaffStatus value={String(selected.status).toUpperCase()} />
              </div>
              <StaffFacts
                items={[
                  ["Mã Unit", selected.code],
                  ["Loại kho", selected.type],
                  ["Kích thước", selected.sizeDesc],
                  ["Diện tích", `${display(selected.sizeSqm)} m²`],
                  [
                    "Cơ sở / Tầng",
                    `${display(selected.facilityCode)} · ${display(selected.floor)}`,
                  ],
                  ["Giá / tháng", money(selected.pricePerMonth)],
                  ["Khóa / PIN", "Quyền truy cập quản lý theo hợp đồng"],
                ]}
              />
            </StaffSection>
            <StaffSection
              title="Thông số môi trường & IoT thời gian thực"
              icon="sensors"
            >
              <div className="staff-iot-unavailable">
                <StaffIcon name="sensors" />
                <strong>Chưa có dữ liệu cảm biến trực tiếp</strong>
                <p>
                  Hệ thống hiện chỉ quản lý trạng thái kho và quy trình nghiệp
                  vụ; nhiệt độ, độ ẩm, CCTV và khóa IoT chưa được kết nối API.
                </p>
              </div>
            </StaffSection>
            <StaffSection
              title="Thông tin thuê & Hợp đồng đang hoạt động"
              icon="description"
            >
              <StaffFacts
                items={[
                  [
                    "Khách thuê",
                    activeContract?.customerName || selected.tenantName,
                  ],
                  ["Mã hợp đồng", activeContract?.id],
                  ["Ngày bắt đầu", activeContract?.startDate],
                  ["Ngày kết thúc", activeContract?.endDate],
                  [
                    "Trạng thái",
                    contracts.busy ? (
                      "Đang tải hợp đồng…"
                    ) : contracts.error ? (
                      "Chưa tải được hợp đồng"
                    ) : activeContract ? (
                      <StaffStatus value={activeContract.status} />
                    ) : (
                      "Chưa có hợp đồng hoạt động"
                    ),
                  ],
                ]}
              />
            </StaffSection>
          </div>
          <aside className="staff-stack">
            <StaffSection
              title="Cập nhật trạng thái khoang"
              icon="published_with_changes"
              className="staff-action-panel"
            >
              <form className="staff-form" onSubmit={save}>
                <label>
                  Trạng thái đề nghị
                  <select value="READY_FOR_REVIEW" disabled>
                    <option value="READY_FOR_REVIEW">
                      Sẵn sàng · Chờ Manager duyệt
                    </option>
                  </select>
                </label>
                <label>
                  Lý do / Ghi chú nghiệp vụ
                  <textarea
                    required
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Ghi nhận vệ sinh, bảo trì hoặc hiện trạng sau kiểm tra..."
                  />
                </label>
                {["cleaning", "maintenance"].includes(selected.status) ? (
                  <button disabled={busy}>
                    <StaffIcon name="check_circle" />
                    {busy ? "Đang gửi…" : "Gửi yêu cầu kho sẵn sàng"}
                  </button>
                ) : (
                  <div className="staff-callout">
                    <p>
                      Chỉ kho đang vệ sinh hoặc bảo trì mới được gửi yêu cầu sẵn
                      sàng tới Manager.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setParams({})}
                >
                  Hủy
                </button>
              </form>
            </StaffSection>
            <StaffOperations
              title="Hỗ trợ kỹ thuật & Điều phối trạm"
              facility={selected.facilityCode}
              steps={[
                [
                  "lock",
                  "Kiểm tra an ninh ổ khóa IoT",
                  "Đối chiếu khóa và trạng thái truy cập tại kho.",
                ],
                [
                  "thermostat",
                  "Đối soát vi khí hậu & PCCC",
                  "Ghi nhận thủ công nếu có cảnh báo tại cơ sở.",
                ],
                [
                  "cleaning_services",
                  "Cập nhật sau nghiệm thu / dọn dẹp",
                  "Chỉ gửi Manager duyệt sau khi hoàn tất công việc.",
                ],
              ]}
            />
          </aside>
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
                unit="khoang"
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
                  placeholder="Tìm theo mã Unit, loại kho, cơ sở..."
                />
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="available">Còn trống</option>
                <option value="reserved">Đang giữ chỗ</option>
                <option value="occupied">Đang thuê</option>
                <option value="cleaning">Đang vệ sinh</option>
                <option value="maintenance">Bảo trì</option>
              </select>
              <button
                type="button"
                className="secondary staff-icon-button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
              >
                <StaffIcon name="filter_alt_off" />
              </button>
            </div>
            {params.get("demo") === "empty" ? (
              <StaffState
                title="Không có kho / Unit"
                description="Chế độ trống minh họa. Quay lại danh sách để xem dữ liệu từ hệ thống."
                onRetry={() => setParams({})}
                icon="inventory_2"
              />
            ) : remote.busy ? (
              <StaffState loading />
            ) : remote.error ? (
              <StaffState error={remote.error} onRetry={remote.reload} />
            ) : !rows.length ? (
              <StaffState
                title="Không có kho / Unit"
                description="Kiểm tra lại bộ lọc hoặc làm mới dữ liệu cơ sở."
                onRetry={remote.reload}
              />
            ) : (
              <div className="table-scroll">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Mã Unit</th>
                      <th>Loại kho & Kích thước</th>
                      <th>Vị trí tại trạm</th>
                      <th>Thông số vi khí hậu & Khóa IoT</th>
                      <th>Trạng thái hiện tại</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice((currentPage - 1) * 10, currentPage * 10)
                      .map((row) => (
                        <tr key={row.code}>
                          <td>
                            <div className="staff-cell-title">
                              <span className="staff-cell-icon">
                                <StaffIcon name="inventory_2" />
                              </span>
                              <strong>{row.code}</strong>
                            </div>
                          </td>
                          <td>
                            <strong>Kho {display(row.type)}</strong>
                            <small>
                              {display(row.sizeSqm)} m² ·{" "}
                              {display(row.sizeDesc)}
                            </small>
                          </td>
                          <td>
                            {display(row.facilityCode)}
                            <small>Tầng {display(row.floor)}</small>
                          </td>
                          <td>
                            <span className="staff-iot-muted">
                              <StaffIcon name="sensors" />
                              Chưa kết nối IoT
                            </span>
                            <small>Quyền truy cập theo hợp đồng</small>
                          </td>
                          <td>
                            <StaffStatus
                              value={String(row.status).toUpperCase()}
                            />
                            <small>
                              {row.readinessStatus === "PENDING"
                                ? "Chờ Manager duyệt sẵn sàng"
                                : display(row.readinessStatus)}
                            </small>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="staff-link"
                              onClick={() => {
                                setParams({ unit: row.code });
                                setNotes(row.readinessNotes || "");
                              }}
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
              noun="khoang"
            />
          </StaffSection>
        </>
      )}
    </StaffShell>
  );
}
