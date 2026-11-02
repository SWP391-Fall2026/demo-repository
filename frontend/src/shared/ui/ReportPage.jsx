import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useRemote } from "../api/use-remote";
import { display, money, statusClass } from "../lib/format";
import { reportingApi } from "../../features/reporting/api/reporting.api";
import {
  OfficeHeading,
  OfficeMetrics,
  OfficeIcon,
  OfficeState,
  OfficeDetailPage,
  OfficeGovernance,
} from "./office/OfficeUi";
import "./office/office.css";
import "./office/management-stitch.css";
const receipts = (row) =>
  Number(row?.rentalReceipts || 0) +
  Number(row?.depositReceipts || 0) +
  Number(row?.feeReceipts || 0);
export function ReportPage({ title, load, facilityCode, mode = "report" }) {
  const [draft, setDraft] = useState({ startDate: "", endDate: "", contractStatus: "" });
  const [dates, setDates] = useState({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  const fetcher = useCallback(() => load(dates), [load, dates]);
  const remote = useRemote(fetcher, [fetcher]);
  const rows = Array.isArray(remote.data?.byFacility)
    ? remote.data.byFacility
    : [];
  const data = remote.data;
  const overview = mode === "overview";
  const period =
    [dates.startDate, dates.endDate].filter(Boolean).join(" – ") ||
    "Tất cả thời gian";
  const visible = rows.filter((row) =>
    `${row.facilityCode} ${row.facilityName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const totalOther = Math.max(
    0,
    Number(data?.totalUnits || 0) -
      Number(data?.occupiedUnits || 0) -
      Number(data?.availableUnits || 0),
  );
  const apply = (event) => {
    event.preventDefault();
    setDates(
      Object.fromEntries(Object.entries(draft).filter(([, value]) => value)),
    );
  };
  async function exportReport(format) {
    if (exportBusy) return;
    setExportBusy(true); setExportError("");
    try { await reportingApi.exportFile({ ...dates, ...(facilityCode ? { facilityCode } : {}) }, format); }
    catch (cause) { setExportError(cause.message || "Không xuất được báo cáo."); }
    finally { setExportBusy(false); }
  }
  if (selected)
    return (
      <OfficeDetailPage
        title="Chi tiết báo cáo kinh doanh"
        eyebrow="BAN ĐIỀU HÀNH / BÁO CÁO"
        onBack={() => setSelected(false)}
      >
        <section className="card office-report-identity">
          <div className="office-detail-icon">
            <OfficeIcon>analytics</OfficeIcon>
          </div>
          <div>
            <span className="eyebrow">HỒ SƠ TỔNG HỢP VẬN HÀNH</span>
            <h2>Báo cáo tổng hợp toàn chuỗi</h2>
            <p>
              Kỳ báo cáo: {period} · Phạm vi: {display(data?.scope)}
            </p>
          </div>
        </section>
        <OfficeMetrics
          items={[
            { label: "Cơ sở trong báo cáo", value: rows.length, icon: "hub" },
            {
              label: "Tổng số khoang",
              value: display(data?.totalUnits),
              icon: "grid_view",
            },
            {
              label: "Tổng tiền đã thu",
              value: money(receipts(data)),
              icon: "payments",
              tone: "teal",
            },
            {
              label: "Tỷ lệ lấp đầy",
              value: `${display(data?.occupancyRate)}%`,
              icon: "donut_large",
              tone: "navy",
            },
          ]}
        />
        <section className="card office-table">
          <div className="office-table-header">
            <h2>Tổng hợp dữ liệu kỳ đối soát cơ sở mạng lưới</h2>
            <span className="count">{rows.length}</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã cơ sở</th>
                  <th>Tên cơ sở</th>
                  <th>Quy mô khoang</th>
                  <th>Tình trạng dữ liệu trạm</th>
                  <th>Tình trạng đối soát</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.facilityCode}>
                    <td>{row.facilityCode}</td>
                    <td>{row.facilityName}</td>
                    <td>
                      {display(row.totalUnits)} khoang
                      <small>
                        {display(row.occupiedUnits)} đang thuê ·{" "}
                        {display(row.availableUnits)} còn trống
                      </small>
                    </td>
                    <td>
                      <span className="badge success">Có dữ liệu tổng hợp</span>
                    </td>
                    <td>
                      {money(receipts(row))}
                      <small>Tiền thuê, cọc và phụ phí</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <ReportCharts rows={rows} />
        <section className="card office-table"><h2>Hợp đồng theo trạng thái thuê</h2><div className="table-scroll"><table><thead><tr><th>Cơ sở</th><th>Trạng thái thuê</th><th>Số hợp đồng</th></tr></thead><tbody>{(data?.byContractStatus || []).map((row) => <tr key={`${row.facilityCode}-${row.status}`}><td>{row.facilityCode}</td><td>{row.status}</td><td>{row.count}</td></tr>)}</tbody></table></div></section>
        <div className="button-row"><button disabled={exportBusy} onClick={() => exportReport("csv")}>Xuất CSV</button><button disabled={exportBusy} onClick={() => exportReport("xlsx")}>Xuất XLSX</button></div>
        {exportError && <p className="error" role="alert">{exportError}</p>}
        <OfficeGovernance title="Phạm vi báo cáo kinh doanh">
          Số liệu tổng hợp theo quyền truy cập và kỳ đã chọn.{" "}
          {data?.occupancyBasis}
        </OfficeGovernance>
      </OfficeDetailPage>
    );
  return (
    <div
      className={`office-page ${overview ? "office-chain-overview" : "office-business-report"}`}
    >
      <OfficeHeading
        title={overview ? "Business Overview" : title || "Business Report"}
        eyebrow={
          overview
            ? "BAN ĐIỀU HÀNH / PHẠM VI TOÀN HỆ THỐNG"
            : "BAN ĐIỀU HÀNH / BÁO CÁO TỔNG HỢP"
        }
        description={
          overview
            ? "Tổng quan hoạt động kinh doanh và tình trạng phân bổ năng lực khoang lưu trữ chuỗi."
            : "Tổng hợp và theo dõi các báo cáo vận hành, kinh doanh theo kỳ của mạng lưới cơ sở lưu trữ."
        }
      >
        <button className="secondary" onClick={remote.reload}>
          <OfficeIcon>sync</OfficeIcon>Đồng bộ dữ liệu
        </button>
        <button onClick={() => setSelected(true)} disabled={!rows.length}>
          <OfficeIcon>visibility</OfficeIcon>Xem chi tiết
        </button>
        <button className="secondary" disabled={!data || exportBusy} onClick={() => exportReport("csv")}>Xuất CSV</button>
        <button className="secondary" disabled={!data || exportBusy} onClick={() => exportReport("xlsx")}>Xuất XLSX</button>
      </OfficeHeading>
      <form className="office-filter" onSubmit={apply}>
        <label>
          Từ ngày
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
          />
        </label>
        <label>
          Trạng thái thuê
          <select
            value={draft.contractStatus}
            onChange={(e) => setDraft({ ...draft, contractStatus: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            {["PENDING_PAYMENT", "PENDING_HANDOVER", "ACTIVE", "EXPIRING_SOON", "OVERDUE", "TERMINATED", "CANCELLED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <button>
          <OfficeIcon>filter_list</OfficeIcon>Áp dụng bộ lọc
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setDraft({ startDate: "", endDate: "", contractStatus: "" });
            setDates({});
          }}
        >
          Đặt lại
        </button>
      </form>
      {exportError && <p className="error" role="alert">{exportError}</p>}
      {remote.error ? (
        <OfficeState error={remote.error} onRetry={remote.reload} />
      ) : remote.busy ? (
        <OfficeState busy />
      ) : !data ? (
        <OfficeState
          title={overview ? "Chưa có dữ liệu tổng quan" : "Chưa có báo cáo"}
          icon="folder_off"
          onRetry={remote.reload}
        />
      ) : (
        <>
          <OfficeMetrics
            items={
              overview
                ? [
                    {
                      label: "Tổng số cơ sở",
                      value: display(data.totalBranches),
                      icon: "corporate_fare",
                      note: "Mạng lưới vận hành",
                    },
                    {
                      label: "Tổng số khoang lưu trữ",
                      value: display(data.totalUnits),
                      icon: "grid_view",
                      tone: "navy",
                    },
                    {
                      label: "Khoang đang cho thuê",
                      value: display(data.occupiedUnits),
                      icon: "lock",
                      tone: "teal",
                      note: `Tỷ lệ lấp đầy: ${display(data.occupancyRate)}%`,
                    },
                    {
                      label: "Khoang trống sẵn sàng",
                      value: display(data.availableUnits),
                      icon: "door_open",
                      tone: "amber",
                      note: `Trạng thái khác: ${totalOther}`,
                    },
                  ]
                : [
                    {
                      label: "Tổng số báo cáo",
                      value: rows.length ? 1 : 0,
                      icon: "folder_copy",
                    },
                    {
                      label: "Phạm vi báo cáo",
                      value: `${rows.length} cơ sở`,
                      icon: "hub",
                      tone: "navy",
                    },
                    {
                      label: "Tình trạng dữ liệu",
                      value: rows.length ? "Đã tổng hợp" : "Chưa có dữ liệu",
                      icon: "verified",
                      tone: "teal",
                    },
                  ]
            }
          />
          {overview && (
            <div className="office-network-capacity">
              <div>
                <i
                  style={{
                    width: `${(Number(data.occupiedUnits || 0) / Math.max(1, Number(data.totalUnits))) * 100}%`,
                  }}
                />
                <i
                  className="available"
                  style={{
                    width: `${(Number(data.availableUnits || 0) / Math.max(1, Number(data.totalUnits))) * 100}%`,
                  }}
                />
              </div>
              <p>
                <span>Khoang đang thuê: {display(data.occupiedUnits)}</span>
                <span>Khoang trống: {display(data.availableUnits)}</span>
                <span>Trạng thái khác: {totalOther}</span>
              </p>
            </div>
          )}
          {overview && Array.isArray(data.byContractStatus) && (
            <section className="card office-table">
              <div className="office-table-header"><h2>Hợp đồng theo trạng thái thuê</h2><span className="badge">{data.contractStatus || "Tất cả"}</span></div>
              <div className="table-scroll"><table><thead><tr><th>Cơ sở</th><th>Trạng thái</th><th>Số hợp đồng</th></tr></thead><tbody>
                {data.byContractStatus.map((row) => <tr key={`${row.facilityCode}-${row.status}`}><td>{row.facilityCode}</td><td>{row.status}</td><td>{row.count}</td></tr>)}
              </tbody></table></div>
            </section>
          )}
          {overview && (
            <section className="card office-table">
              <div className="office-table-header">
                <h2>Quá hạn & phân bổ loại kho</h2>
                <span className="badge">Quá hạn: {display(data.overdueContracts || 0)}</span>
              </div>
              {Array.isArray(data.byUnitType) && data.byUnitType.length ? (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Cơ sở</th><th>Loại kho</th><th>Tổng</th><th>Đang thuê</th><th>Đang giữ</th><th>Trống</th><th>Bảo trì / vệ sinh</th></tr></thead>
                    <tbody>{data.byUnitType.map((row) => <tr key={`${row.facilityCode}-${row.unitType}`}><td>{row.facilityCode}</td><td>Kho {row.unitType}</td><td>{row.totalUnits}</td><td>{row.occupiedUnits}</td><td>{row.reservedUnits}</td><td>{row.availableUnits}</td><td>{Number(row.cleaningUnits || 0) + Number(row.maintenanceUnits || 0)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <OfficeState title="Chưa có phân bổ loại kho" />}
            </section>
          )}
          <section className="card office-table">
            <div className="office-table-header">
              <div>
                <h2>
                  {overview
                    ? "Hiện trạng mạng lưới cơ sở lưu trữ"
                    : "Danh sách hồ sơ báo cáo định kỳ"}
                </h2>
                <p>
                  {overview
                    ? "Theo dõi tình trạng hoạt động và phân bổ khoang lưu trữ tại từng chi nhánh trực thuộc."
                    : `Kỳ đối soát: ${period}`}
                </p>
              </div>
              <span className="office-readonly">
                {overview ? "BOM READ-ONLY" : "BÁO CÁO TOÀN HỆ THỐNG"}
              </span>
            </div>
            {overview && (
              <label className="office-report-search">
                <OfficeIcon>search</OfficeIcon>
                <input
                  placeholder="Tìm kiếm cơ sở theo tên hoặc mã định danh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            )}
            {!visible.length ? (
              <OfficeState
                title={overview ? "Không có cơ sở phù hợp" : "Chưa có báo cáo"}
                icon="folder_off"
                onRetry={() => setSearch("")}
              />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    {overview ? (
                      <tr>
                        <th>Mã cơ sở</th>
                        <th>Tên cơ sở & địa chỉ</th>
                        <th>Quy mô khoang</th>
                        <th>Đang sử dụng</th>
                        <th>Còn trống</th>
                        <th>Trạng thái trạm</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Mã báo cáo</th>
                        <th>Tên báo cáo / phân loại</th>
                        <th>Kỳ báo cáo</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {overview ? (
                      visible.map((row) => (
                        <tr key={row.facilityCode}>
                          <td>
                            <strong>{row.facilityCode}</strong>
                          </td>
                          <td>
                            <strong>{row.facilityName}</strong>
                            <small>{display(row.city)}</small>
                          </td>
                          <td>{display(row.totalUnits)}</td>
                          <td>
                            {display(row.occupiedUnits)}
                            <small>{display(row.occupancyRate)}%</small>
                          </td>
                          <td>{display(row.availableUnits)}</td>
                          <td>
                            <span className={`badge ${statusClass(row.status)}`}>
                              {row.status || "CHƯA CẬP NHẬT"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td>TỔNG HỢP HIỆN TẠI</td>
                        <td>
                          <strong>Báo cáo tổng hợp vận hành toàn chuỗi</strong>
                          <small>
                            Tình trạng khoang và dòng tiền theo cơ sở
                          </small>
                        </td>
                        <td>{period}</td>
                        <td>
                          <span className="badge success">Đã tổng hợp</span>
                        </td>
                        <td>
                          <button
                            className="office-row-action"
                            onClick={() => setSelected(true)}
                          >
                            Xem chi tiết <OfficeIcon>arrow_forward</OfficeIcon>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {overview && (
            <div className="office-network-summary">
              <section className="card">
                <h2>
                  <OfficeIcon>insights</OfficeIcon>Tổng hợp vận hành kinh doanh
                  chuỗi
                </h2>
                <p>
                  Hiện trạng sử dụng và dòng tiền đã thu trong kỳ: {period}.
                </p>
                <dl className="office-detail-grid">
                  <div>
                    <dt>Tiền thuê đã thu</dt>
                    <dd>{money(data.rentalReceipts)}</dd>
                  </div>
                  <div>
                    <dt>Tiền cọc đã thu</dt>
                    <dd>{money(data.depositReceipts)}</dd>
                  </div>
                  <div>
                    <dt>Phụ phí đã thu</dt>
                    <dd>{money(data.feeReceipts)}</dd>
                  </div>
                </dl>
                <Link className="office-row-link" to="/operations/reports">
                  Xem báo cáo tổng hợp kinh doanh
                  <OfficeIcon>arrow_forward</OfficeIcon>
                </Link>
              </section>
              <OfficeGovernance title="Thẩm quyền điều hành & quản trị (BOM)">
                Giám sát quy mô mạng lưới, khung giá và báo cáo toàn hệ thống.
                Nghiệp vụ thực địa thuộc nhân viên cơ sở được phân công.
              </OfficeGovernance>
            </div>
          )}
        </>
      )}
    </div>
  );
}
function ReportCharts({ rows }) {
  const max = Math.max(1, ...rows.map(receipts));
  return (
    <div className="report-charts">
      <section className="card">
        <h2>Tỷ lệ lấp đầy theo cơ sở</h2>
        {rows.map((row) => (
          <div className="report-bar-row" key={row.facilityCode}>
            <span>{row.facilityCode}</span>
            <meter min="0" max="100" value={Number(row.occupancyRate || 0)} />
            <strong>{display(row.occupancyRate)}%</strong>
          </div>
        ))}
      </section>
      <section className="card">
        <h2>Dòng tiền đã thu</h2>
        {rows.map((row) => (
          <div className="report-revenue-row" key={row.facilityCode}>
            <strong>{row.facilityCode}</strong>
            <div className="report-revenue-bar">
              <span
                className="rent"
                style={{
                  width: `${(Number(row.rentalReceipts || 0) / max) * 100}%`,
                }}
              />
              <span
                className="deposit"
                style={{
                  width: `${(Number(row.depositReceipts || 0) / max) * 100}%`,
                }}
              />
              <span
                className="fees"
                style={{
                  width: `${(Number(row.feeReceipts || 0) / max) * 100}%`,
                }}
              />
            </div>
            <small>{money(receipts(row))}</small>
          </div>
        ))}
      </section>
    </div>
  );
}
