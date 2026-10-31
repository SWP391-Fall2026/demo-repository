import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { reportingApi } from "../api/reporting.api";

function csvCell(value) {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(data) {
    const header = ["section", "period", "facility_code", "facility_name", "metric", "amount", "total_units", "occupied_units", "available_units", "reserved_units", "maintenance_units", "occupancy_rate"];
    const rows = [];
    for (const row of data?.revenueTimeline ?? []) {
        rows.push(["revenue_timeline", row.period, "", "", "gross_receipts", row.grossReceipts]);
        rows.push(["revenue_timeline", row.period, "", "", "rental_refunds", row.rentalRefunds]);
        rows.push(["revenue_timeline", row.period, "", "", "net_operating_receipts", row.amount]);
    }
    for (const [source, amount] of Object.entries(data?.revenueBySource ?? {})) {
        rows.push(["revenue_source", "", "", "", source, amount]);
    }
    for (const metric of [
        "rentalReceipts",
        "renewalReceipts",
        "penaltyReceipts",
        "grossOperatingReceipts",
        "rentalRefunds",
        "netOperatingReceipts",
        "depositReceipts",
        "depositRefunds",
        "depositDeductions",
    ]) {
        rows.push(["financial_summary", "", "", "", metric, data?.[metric]]);
    }
    for (const branch of data?.occupancyByBranch?.branches ?? []) {
        rows.push([
            "occupancy",
            "",
            branch.facilityCode,
            branch.facilityName,
            "physical_units",
            "",
            branch.totalUnits,
            branch.occupiedUnits,
            branch.vacantUnits,
            branch.reservedUnits,
            branch.maintenanceUnits,
            branch.occupancyRate,
        ]);
    }
    return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function BarChart({ rows }) {
    const max = Math.max(1, ...rows.map((r) => Math.abs(Number(r.amount) || 0)));
    return (
        <div className="chart">
            {rows.map((r) => (
                <div className="chart-row" key={r.period}>
                    <span className="chart-label">{display(r.period)}</span>
                    <div className="chart-track">
                        <div
                            className={`chart-bar ${(Number(r.amount) || 0) < 0 ? "negative" : ""}`}
                            style={{ width: `${Math.round((Math.abs(Number(r.amount) || 0) / max) * 100)}%` }}
                        />
                    </div>
                    <span className="chart-value">{money(r.amount)}</span>
                </div>
            ))}
        </div>
    );
}

export function RevenueReport({ title, fixedFacility }) {
    const [filters, setFilters] = useState({ facilityCode: fixedFacility ?? "", from: "", to: "", granularity: "month" });
    const { data, error, busy, reload } = useRemote(() => reportingApi.revenue(filters), [JSON.stringify(filters)]);
    const timeline = Array.isArray(data?.revenueTimeline) ? data.revenueTimeline : [];
    const branches = Array.isArray(data?.occupancyByBranch?.branches) ? data.occupancyByBranch.branches : [];
    const sources = data?.revenueBySource ?? {};
    function downloadCsv() {
        const blob = new Blob(["\uFEFF", toCsv(data)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "revenue.csv";
        link.click();
        URL.revokeObjectURL(url);
    }
    return (
        <>
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STORAGE / BÁO CÁO</span>
                    <h1>{title}</h1>
                    <p>Lọc theo thời gian (yyyy-MM-dd), chi nhánh và kỳ day/month/quarter. Xuất CSV khi có dữ liệu.</p>
                </div>
                <button className="secondary" onClick={reload}>Cập nhật</button>
            </header>
            <section className="card">
                <form
                    className="inline-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setFilters({
                            facilityCode: fixedFacility ?? String(fd.get("facilityCode") ?? ""),
                            from: String(fd.get("from") ?? ""),
                            to: String(fd.get("to") ?? ""),
                            granularity: String(fd.get("granularity") ?? "month"),
                        });
                    }}
                >
                    {!fixedFacility && <input name="facilityCode" placeholder="Mã chi nhánh (trống = toàn chuỗi)" defaultValue={filters.facilityCode} />}
                    <input name="from" placeholder="Từ (yyyy-MM-dd)" defaultValue={filters.from} />
                    <input name="to" placeholder="Đến (yyyy-MM-dd)" defaultValue={filters.to} />
                    <select name="granularity" defaultValue={filters.granularity}>
                        <option value="day">day</option>
                        <option value="month">month</option>
                        <option value="quarter">quarter</option>
                    </select>
                    <button>Lọc</button>
                    {(timeline.length > 0 || branches.length > 0 || Object.keys(sources).length > 0) && (
                        <button type="button" className="secondary" onClick={downloadCsv}>
                            Xuất CSV
                        </button>
                    )}
                </form>
            </section>
            {error ? (
                <div role="alert" className="card error">{error}</div>
            ) : busy ? (
                <div className="card empty">Đang tổng hợp…</div>
            ) : !data?.hasData ? (
                <div className="card empty">
                    <h3>Chưa có dữ liệu</h3>
                    <p>Chưa có giao dịch, hoàn tiền hoặc kho thuộc phạm vi báo cáo.</p>
                </div>
            ) : (
                <>
                    <div className="metric-grid financial-summary">
                        <article className="card metric financial-summary-primary"><span>Doanh thu vận hành thuần</span><strong>{money(data.netOperatingReceipts)}</strong><small>Không bao gồm tiền cọc</small></article>
                        <article className="card financial-deposit-summary"><span>Tiền cọc (tách khỏi doanh thu)</span><div><small>Đã thu</small><strong>{money(data.depositReceipts)}</strong></div><div><small>Đã hoàn</small><strong>{money(data.depositRefunds)}</strong></div><div><small>Khấu trừ sau nghiệm thu</small><strong>{money(data.depositDeductions)}</strong></div></article>
                        <article className="card metric financial-summary-occupancy"><span>Tỷ lệ lấp đầy</span><strong>{display(data.occupancyRate)}%</strong><small>Kho đang thuê / toàn bộ kho vật lý</small></article>
                    </div>
                    <section className="card">
                        <h2>Tóm tắt thu vận hành</h2>
                        <div className="table-scroll"><table>
                            <thead><tr><th>Khoản mục</th><th>Số tiền</th><th>Phạm vi</th></tr></thead>
                            <tbody>
                                <tr><td>Tiền thuê đã thu</td><td>{money(data.rentalReceipts)}</td><td>Doanh thu vận hành</td></tr>
                                <tr><td>Tiền gia hạn đã thu</td><td>{money(data.renewalReceipts)}</td><td>Doanh thu vận hành</td></tr>
                                <tr><td>Phụ phí đã thu</td><td>{money(data.penaltyReceipts)}</td><td>Doanh thu vận hành</td></tr>
                                <tr><td>Hoàn tiền thuê</td><td>{money(data.rentalRefunds)}</td><td>Đã thực hiện</td></tr>
                                <tr><td>Thu vận hành gộp</td><td>{money(data.grossOperatingReceipts)}</td><td>Không gồm tiền cọc</td></tr>
                            </tbody>
                        </table></div>
                    </section>
                    <section className="card">
                        <h2>Thu vận hành thuần theo kỳ</h2>
                        {timeline.length ? <BarChart rows={timeline} /> : <p>Chưa có doanh thu trong khoảng đã chọn.</p>}
                        {timeline.length > 0 && (
                            <div className="table-scroll">
                                <table>
                                    <thead><tr><th>Kỳ</th><th>Thu gộp</th><th>Hoàn tiền thuê</th><th>Thu thuần</th></tr></thead>
                                    <tbody>{timeline.map((row) => (
                                        <tr key={row.period}>
                                            <td>{display(row.period)}</td>
                                            <td>{money(row.grossReceipts)}</td>
                                            <td>{money(row.rentalRefunds)}</td>
                                            <td>{money(row.amount)}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </section>
                    <section className="card">
                        <h2>Doanh thu theo nguồn</h2>
                        <div className="table-scroll">
                            <table>
                                <thead><tr><th>Nguồn</th><th>Số tiền</th></tr></thead>
                                <tbody>
                                    {Object.entries(sources).map(([k, v]) => (
                                        <tr key={k}><td>{display(k)}</td><td>{money(v)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section className="card">
                        <h2>Lấp đầy hiện tại theo chi nhánh</h2>
                        {branches.length ? (
                            <div className="table-scroll">
                                <table>
                                    <thead><tr><th>Chi nhánh</th><th>Tổng kho vật lý</th><th>Đang thuê</th><th>Đang giữ</th><th>Trống</th><th>Bảo trì</th><th>Tỷ lệ</th></tr></thead>
                                    <tbody>
                                        {branches.map((b) => (
                                            <tr key={b.facilityCode}>
                                                <td>{display(b.facilityName)} ({display(b.facilityCode)})</td>
                                                <td>{display(b.totalUnits)}</td>
                                                <td>{display(b.occupiedUnits)}</td>
                                                <td>{display(b.reservedUnits)}</td>
                                                <td>{display(b.vacantUnits)}</td>
                                                <td>{display(b.maintenanceUnits)}</td>
                                                <td>{display(b.occupancyRate)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p>Chưa có kho nào trong phạm vi.</p>}
                    </section>
                </>
            )}
        </>
    );
}
