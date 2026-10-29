import { useCallback, useState } from "react";
import { reportingApi } from "../api/reporting.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { useRemote } from "../../../shared/api/use-remote";
import { money, display } from "../../../shared/lib/format";
import {
  OfficeHeading,
  OfficeIcon,
  OfficeMetrics,
  OfficeState,
  OfficeGovernance,
} from "../../../shared/ui/office/OfficeUi";
import "../../../shared/ui/office/management-stitch.css";
async function load(params) {
  const [report, dashboard] = await Promise.all([
    reportingApi.facility(params),
    workforceApi.managerDashboard(),
  ]);
  return { report, dashboard };
}
export default function FacilityReportPage() {
  const [draft, setDraft] = useState({ startDate: "", endDate: "" });
  const [dates, setDates] = useState({});
  const fetcher = useCallback(() => load(dates), [dates]);
  const remote = useRemote(fetcher, [fetcher]);
  const report = remote.data?.report;
  const dashboard = remote.data?.dashboard;
  const units = Array.isArray(dashboard?.units) ? dashboard.units : [];
  const tasks = Array.isArray(dashboard?.tasks) ? dashboard.tasks : [];
  const types = [...new Set(units.map((unit) => unit.type))].map((type) => {
    const members = units.filter((unit) => unit.type === type);
    return {
      type,
      total: members.length,
      occupied: members.filter(
        (unit) => String(unit.status).toUpperCase() === "OCCUPIED",
      ).length,
      available: members.filter(
        (unit) => String(unit.status).toUpperCase() === "AVAILABLE",
      ).length,
      maintenance: members.filter((unit) =>
        ["MAINTENANCE", "CLEANING"].includes(String(unit.status).toUpperCase()),
      ).length,
    };
  });
  const support = tasks.filter((task) =>
    ["SUPPORT", "INCIDENT"].includes(task.taskType),
  );
  return (
    <div className="office-page office-facility-report">
      <OfficeHeading
        title="Báo cáo & tổng quan hoạt động"
        eyebrow="FACILITY MANAGER / BÁO CÁO CƠ SỞ"
        description="Tổng hợp năng lực khai thác khoang, công việc vận hành và tình trạng xử lý hỗ trợ trong phạm vi cơ sở."
      >
        <button className="secondary" onClick={remote.reload}>
          <OfficeIcon>sync</OfficeIcon>Làm mới dữ liệu
        </button>
      </OfficeHeading>
      <form
        className="office-filter"
        onSubmit={(event) => {
          event.preventDefault();
          setDates(
            Object.fromEntries(
              Object.entries(draft).filter(([, value]) => value),
            ),
          );
        }}
      >
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
        <button>
          <OfficeIcon>filter_list</OfficeIcon>Xem báo cáo
        </button>
      </form>
      {remote.error ? (
        <OfficeState error={remote.error} onRetry={remote.reload} />
      ) : remote.busy ? (
        <OfficeState busy />
      ) : !report ? (
        <OfficeState title="Chưa có dữ liệu báo cáo" onRetry={remote.reload} />
      ) : (
        <>
          <OfficeMetrics
            items={[
              {
                label: "Tổng số khoang",
                value: display(report.totalUnits),
                icon: "grid_view",
              },
              {
                label: "Đang sử dụng",
                value: display(report.occupiedUnits),
                icon: "lock",
                tone: "navy",
              },
              {
                label: "Trống sẵn sàng",
                value: display(report.availableUnits),
                icon: "door_open",
                tone: "teal",
              },
              {
                label: "Tỷ lệ lấp đầy",
                value: `${display(report.occupancyRate)}%`,
                icon: "monitoring",
                tone: "amber",
              },
            ]}
          />
          <section className="card office-table">
            <div className="office-table-header">
              <h2>Tổng quan hiện trạng khoang & mặt bằng</h2>
              <span className="badge">
                {display(dashboard?.facility?.code)}
              </span>
            </div>
            {!types.length ? (
              <OfficeState title="Chưa có dữ liệu khoang" />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Loại khoang</th>
                      <th>Tổng số Unit</th>
                      <th>Đang sử dụng (Thuê)</th>
                      <th>Còn trống sẵn sàng</th>
                      <th>Bảo trì / Vệ sinh</th>
                      <th>Tỷ lệ lấp đầy thực tế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((row) => (
                      <tr key={row.type}>
                        <td>
                          <strong>Kho {row.type}</strong>
                        </td>
                        <td>{row.total}</td>
                        <td>{row.occupied}</td>
                        <td>{row.available}</td>
                        <td>{row.maintenance}</td>
                        <td>
                          <span className="badge">
                            {Math.round((row.occupied / row.total) * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <div className="office-report-panels">
            <section className="card">
              <h2>
                <OfficeIcon>description</OfficeIcon>Báo cáo hoạt động hợp đồng &
                Đơn thuê
              </h2>
              <dl className="office-detail-grid">
                <div>
                  <dt>Công việc check-in</dt>
                  <dd>
                    {tasks.filter((task) => task.taskType === "CHECKIN").length}
                  </dd>
                </div>
                <div>
                  <dt>Công việc trả kho</dt>
                  <dd>
                    {tasks.filter((task) => task.taskType === "RETURN").length}
                  </dd>
                </div>
                <div>
                  <dt>Tiền thuê đã thu</dt>
                  <dd>{money(report.rentalReceipts)}</dd>
                </div>
                <div>
                  <dt>Tiền cọc đã thu</dt>
                  <dd>{money(report.depositReceipts)}</dd>
                </div>
              </dl>
            </section>
            <section className="card">
              <h2>
                <OfficeIcon>support_agent</OfficeIcon>Báo cáo xử lý sự cố & Yêu
                cầu hỗ trợ
              </h2>
              <dl className="office-detail-grid">
                <div>
                  <dt>Tổng công việc hỗ trợ</dt>
                  <dd>{support.length}</dd>
                </div>
                <div>
                  <dt>Đang chờ xử lý</dt>
                  <dd>
                    {support.filter((task) => task.status === "PENDING").length}
                  </dd>
                </div>
                <div>
                  <dt>Đang thực hiện</dt>
                  <dd>
                    {
                      support.filter((task) => task.status === "IN_PROGRESS")
                        .length
                    }
                  </dd>
                </div>
                <div>
                  <dt>Đã hoàn tất</dt>
                  <dd>
                    {
                      support.filter((task) =>
                        ["COMPLETED", "RESOLVED"].includes(task.status),
                      ).length
                    }
                  </dd>
                </div>
              </dl>
            </section>
          </div>
          <OfficeGovernance title="Quy chuẩn quản trị báo cáo & Ranh giới thẩm quyền">
            Báo cáo giới hạn trong cơ sở phụ trách. {report.occupancyBasis}
          </OfficeGovernance>
        </>
      )}
    </div>
  );
}
