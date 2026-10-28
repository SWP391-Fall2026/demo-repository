import { useState, useCallback } from "react";
import { useRemote } from "../api/use-remote";
import { display, money } from "../lib/format";
import { reportingApi } from "../../features/reporting/api/reporting.api";

export function ReportPage({ title, load, facilityCode }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetcher = useCallback(() => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return load(params);
    }, [load, startDate, endDate]);

    const { data, error, busy, reload } = useRemote(fetcher);

    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    async function handleExport(format = "csv") {
        const params = {};
        if (facilityCode) params.facilityCode = facilityCode;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        setExporting(true);
        setExportError("");
        try { await reportingApi.exportFile(params, format); }
        catch (cause) { setExportError(cause instanceof Error ? cause.message : "Không xuất được báo cáo."); }
        finally { setExporting(false); }
    }

    return (<>
      <header className="page-heading">
        <div>
          <span className="eyebrow">STORAGE / BÁO CÁO</span>
          <h1>{title}</h1>
          <p>Tổng hợp theo phạm vi dữ liệu được cấp quyền.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {Array.isArray(data?.byFacility) && <><button className="secondary" onClick={() => handleExport("xlsx")} disabled={exporting}>{exporting ? "Đang xuất…" : "Xuất Excel"}</button>
          <button className="ghost" onClick={() => handleExport("csv")} disabled={exporting}>CSV</button></>}
          <button onClick={reload}>Cập nhật</button>
        </div>
      </header>
      {exportError && <p role="alert" className="card error">{exportError}</p>}
      {data?.occupancyBasis && <p className="notice">{data.occupancyBasis}</p>}

      <section className="card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
            Từ ngày:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border, #ccc)" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
            Đến ngày:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border, #ccc)" }}
            />
          </label>
          {(startDate || endDate) && (
            <button
              type="button"
              className="ghost"
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ fontSize: "0.9rem" }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>

      {error ? (<div role="alert" className="card error">
          {error}
        </div>) : busy ? (<div className="card empty">Đang tổng hợp…</div>) : (<div className="metric-grid">
          {Object.entries(data ?? {}).filter(([key]) => ["totalBranches", "totalUnits", "occupiedUnits", "availableUnits", "occupancyRate", "rentalReceipts", "depositReceipts", "feeReceipts", "completedRefunds", "users", "facilities"].includes(key)).map(([key, value]) => (<article className="card metric" key={key}>
              <span>
                {{
                    totalBranches: "Chi nhánh",
                    totalUnits: "Tổng kho",
                    occupiedUnits: "Đang thuê",
                    availableUnits: "Sẵn sàng",
                    occupancyRate: "Tỷ lệ lấp đầy",
                    rentalReceipts: "Tổng tiền thuê đã thu",
                    depositReceipts: "Tổng tiền cọc đã thu",
                    feeReceipts: "Phụ phí đã thu",
                    completedRefunds: "Tổng tiền đã hoàn",
                    users: "Tài khoản", facilities: "Cơ sở",
                }[key] || key}
              </span>
              <strong>
                {/revenue|funds|amount|receipts|refunds/i.test(key)
                    ? money(value)
                    : key === "occupancyRate" ? `${display(value)}%` : display(value)}
              </strong>
            </article>))}
        </div>)}
      {!error && !busy && Array.isArray(data?.byFacility) && <div className="report-charts">
        <section className="card"><h2>Tỷ lệ lấp đầy theo cơ sở</h2>{data.byFacility.map(row => <div className="report-bar-row" key={row.facilityCode}><span>{row.facilityCode}</span><meter min="0" max="100" value={row.occupancyRate} aria-label={`Lấp đầy ${row.facilityCode}`} /><strong>{row.occupancyRate}%</strong></div>)}</section>
        <section className="card"><h2>Dòng tiền đã thu theo cơ sở</h2><p>Tiền thuê · tiền cọc · phụ phí (VND)</p>{data.byFacility.map(row => { const max = Math.max(1, ...data.byFacility.map(r => Number(r.rentalReceipts) + Number(r.depositReceipts) + Number(r.feeReceipts))); return <div className="report-revenue-row" key={row.facilityCode}><strong>{row.facilityCode}</strong><div className="report-revenue-bar" role="img" aria-label={`${row.facilityCode}: thuê ${money(row.rentalReceipts)}, cọc ${money(row.depositReceipts)}, phụ phí ${money(row.feeReceipts)}`}><span className="rent" style={{width: `${Number(row.rentalReceipts) / max * 100}%`}} /><span className="deposit" style={{width: `${Number(row.depositReceipts) / max * 100}%`}} /><span className="fees" style={{width: `${Number(row.feeReceipts) / max * 100}%`}} /></div><small>{money(Number(row.rentalReceipts) + Number(row.depositReceipts) + Number(row.feeReceipts))}</small></div>})}<p className="report-legend"><span>Tiền thuê</span><span>Tiền cọc</span><span>Phụ phí</span></p></section>
      </div>}
      {!error && !busy && Array.isArray(data?.byFacility) && data.byFacility.length > 0 && <section className="card report-breakdown"><h2>So sánh theo cơ sở</h2><div className="table-scroll"><table><thead><tr><th>Cơ sở</th><th>Tổng kho</th><th>Đang thuê</th><th>Lấp đầy</th><th>Tiền thuê</th><th>Tiền cọc</th><th>Phụ phí</th><th>Đã hoàn</th></tr></thead><tbody>{data.byFacility.map((row) => <tr key={row.facilityCode}><td><strong>{display(row.facilityCode)}</strong><br /><small>{display(row.facilityName)}</small></td><td>{display(row.totalUnits)}</td><td>{display(row.occupiedUnits)}</td><td>{display(row.occupancyRate)}%</td><td>{money(row.rentalReceipts)}</td><td>{money(row.depositReceipts)}</td><td>{money(row.feeReceipts)}</td><td>{money(row.completedRefunds)}</td></tr>)}</tbody></table></div></section>}
    </>);
}
