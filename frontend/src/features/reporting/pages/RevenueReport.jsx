import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { reportingApi } from "../api/reporting.api";

function toCsv(rows) {
    const header = "period,amount";
    const lines = rows.map((r) => `${r.period},${r.amount}`);
    return [header, ...lines].join("\n");
}

function BarChart({ rows }) {
    const max = Math.max(1, ...rows.map((r) => Number(r.amount) || 0));
    return (
        <div className="chart">
            {rows.map((r) => (
                <div className="chart-row" key={r.period}>
                    <span className="chart-label">{display(r.period)}</span>
                    <div className="chart-track">
                        <div
                            className="chart-bar"
                            style={{ width: `${Math.round(((Number(r.amount) || 0) / max) * 100)}%` }}
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
        const blob = new Blob([toCsv(timeline)], { type: "text/csv;charset=utf-8" });
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
                    {timeline.length > 0 && (
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
                    <p>Chưa phát sinh thanh toán PAID hoặc kho nào trong phạm vi đã chọn.</p>
                </div>
            ) : (
                <>
                    <div className="metric-grid">
                        <article className="card metric"><span>Tổng tiền thuê đã thu</span><strong>{money(data.rentalReceipts)}</strong></article>
                        <article className="card metric"><span>Tiền cọc đã thu</span><strong>{money(data.depositReceipts)}</strong></article>
                        <article className="card metric"><span>Phí phạt đã thu</span><strong>{money(data.penaltyReceipts)}</strong></article>
                        <article className="card metric"><span>Tỷ lệ lấp đầy</span><strong>{display(data.occupancyRate)}%</strong></article>
                    </div>
                    <section className="card">
                        <h2>Doanh thu theo kỳ</h2>
                        {timeline.length ? <BarChart rows={timeline} /> : <p>Chưa có doanh thu trong khoảng đã chọn.</p>}
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
                        <h2>Lấp đầy theo chi nhánh</h2>
                        {branches.length ? (
                            <div className="table-scroll">
                                <table>
                                    <thead><tr><th>Chi nhánh</th><th>Tổng kho</th><th>Đang thuê</th><th>Tỷ lệ</th></tr></thead>
                                    <tbody>
                                        {branches.map((b) => (
                                            <tr key={b.facilityCode}>
                                                <td>{display(b.facilityCode)}</td>
                                                <td>{display(b.totalUnits)}</td>
                                                <td>{display(b.occupiedUnits)}</td>
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
