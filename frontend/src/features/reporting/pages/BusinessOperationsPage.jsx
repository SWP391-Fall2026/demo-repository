import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { reportingApi } from "../api/reporting.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import {
  OfficeHeading,
  OfficeIcon,
  OfficeState,
  OfficeGovernance,
} from "../../../shared/ui/office/OfficeUi";
import "../../../shared/ui/office/management-stitch.css";

export default function BusinessOperationsPage() {
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [applied, setApplied] = useState({});
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  const fetcher = useCallback(() => reportingApi.chain(applied), [applied]);
  const remote = useRemote(fetcher, [fetcher]);
  const data = remote.data;
  const rows = Array.isArray(data?.byFacility) ? data.byFacility : [];
  const totalCash =
    Number(data?.rentalReceipts || 0) +
    Number(data?.depositReceipts || 0) +
    Number(data?.feeReceipts || 0);
  const period =
    [applied.startDate, applied.endDate].filter(Boolean).join(" – ") ||
    "Tất cả thời gian";
  async function exportReport() {
    if (exportBusy) return;
    setExportBusy(true);
    setExportError("");
    try {
      await reportingApi.exportFile(applied, "xlsx");
    } catch (cause) {
      setExportError(cause?.message || "Không xuất được báo cáo.");
    } finally {
      setExportBusy(false);
    }
  }
  return (
    <div className="office-page office-settlement">
      <OfficeHeading
        title="Báo cáo tổng hợp kinh doanh"
        eyebrow="BAN ĐIỀU HÀNH / QUYẾT TOÁN VẬN HÀNH CHUỖI"
        description="Tra cứu và xuất số liệu vận hành mạng lưới lưu trữ theo kỳ."
      >
        <button
          className="secondary"
          onClick={remote.reload}
          disabled={remote.busy}
        >
          <OfficeIcon>sync</OfficeIcon>Làm mới dữ liệu
        </button>
      </OfficeHeading>
      <form
        className="office-filter"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(
            Object.fromEntries(
              Object.entries(dates).filter(([, value]) => value),
            ),
          );
        }}
      >
        <label>
          Từ ngày
          <input
            type="date"
            value={dates.startDate}
            max={dates.endDate || undefined}
            onChange={(event) =>
              setDates({ ...dates, startDate: event.target.value })
            }
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={dates.endDate}
            min={dates.startDate || undefined}
            onChange={(event) =>
              setDates({ ...dates, endDate: event.target.value })
            }
          />
        </label>
        <button>
          <OfficeIcon>filter_list</OfficeIcon>Áp dụng kỳ báo cáo
        </button>
      </form>
      {remote.error ? (
        <OfficeState error={remote.error} onRetry={remote.reload} />
      ) : remote.busy ? (
        <OfficeState busy />
      ) : !rows.length ? (
        <OfficeState
          title="Chưa có dữ liệu"
          icon="inbox"
          onRetry={remote.reload}
        >
          Hiện tại chưa có dữ liệu báo cáo phù hợp trong kỳ đã chọn.
        </OfficeState>
      ) : (
        <section className="card office-settlement-card">
          <header>
            <span className="office-settlement-icon">
              <OfficeIcon>assignment_turned_in</OfficeIcon>
            </span>
            <div>
              <span className="eyebrow">HỒ SƠ TỔNG HỢP VẬN HÀNH</span>
              <h2>Thông tin quyết toán kỳ vận hành chuỗi</h2>
            </div>
            <span className="badge">Dữ liệu tổng hợp hiện tại</span>
          </header>
          <dl className="office-settlement-facts">
            <div>
              <OfficeIcon>date_range</OfficeIcon>
              <dt>Kỳ báo cáo</dt>
              <dd>{period}</dd>
            </div>
            <div>
              <OfficeIcon>hub</OfficeIcon>
              <dt>Phạm vi đối soát</dt>
              <dd>
                {rows.length} cơ sở ·{" "}
                {rows.map((row) => row.facilityCode).join(", ")}
              </dd>
            </div>
            <div>
              <OfficeIcon>grid_view</OfficeIcon>
              <dt>Quy mô khoang</dt>
              <dd>
                {display(data.totalUnits)} khoang ·{" "}
                {display(data.occupancyRate)}% lấp đầy
              </dd>
            </div>
            <div>
              <OfficeIcon>payments</OfficeIcon>
              <dt>Dòng tiền đã thu</dt>
              <dd>{money(totalCash)}</dd>
            </div>
            <div>
              <OfficeIcon>currency_exchange</OfficeIcon>
              <dt>Tiền đã hoàn</dt>
              <dd>{money(data.completedRefunds)}</dd>
            </div>
          </dl>
          <p className="notice">{data.occupancyBasis}</p>
          <footer>
            <Link className="button secondary" to="/operations/reports">
              <OfficeIcon>arrow_back</OfficeIcon>Quay lại báo cáo
            </Link>
            <button className="button" type="button" onClick={exportReport} disabled={exportBusy}>
              <OfficeIcon>download</OfficeIcon>{exportBusy ? "Đang xuất…" : "Xuất số liệu đối soát"}
            </button>
          </footer>
        </section>
      )}
      {exportError && <p className="error" role="alert">{exportError}</p>}
      <OfficeGovernance title="Phạm vi xử lý quyết toán">
        Báo cáo cung cấp số liệu để đối soát. Chức năng phê duyệt và kết chuyển
        chưa được kết nối; xuất báo cáo không thay đổi số liệu kế toán.
      </OfficeGovernance>
    </div>
  );
}
