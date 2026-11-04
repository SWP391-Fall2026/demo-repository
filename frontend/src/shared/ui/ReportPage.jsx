import { useRemote } from "../api/use-remote";
import { display, money } from "../lib/format";

export function ReportPage({ title, load }) {
    const { data, error, busy, reload } = useRemote(load);

    const labels = {
        totalBranches: "Chi nhánh cơ sở",
        totalUnits: "Tổng số phòng kho",
        occupiedUnits: "Kho đang cho thuê",
        availableUnits: "Kho khả dụng",
        occupancyRate: "Tỷ lệ lấp đầy",
        rentalReceipts: "Tổng tiền thuê đã thu",
        depositReceipts: "Tổng tiền cọc đảm bảo",
        completedRefunds: "Tổng tiền cọc đã hoàn",
    };

    const icons = {
        totalBranches: "🏢",
        totalUnits: "📦",
        occupiedUnits: "🔒",
        availableUnits: "🟢",
        occupancyRate: "📈",
        rentalReceipts: "💰",
        depositReceipts: "💳",
        completedRefunds: "🔄",
    };

    function exportCsv() {
        if (!data) return;
        const csvContent =
            "data:text/csv;charset=utf-8," +
            "ChiSo,GiaTri\n" +
            Object.entries(data)
                .map(([k, v]) => `"${labels[k] || k}","${v}"`)
                .join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bao-cao-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="report-page-container">
            <header className="page-heading">
                <div>
                    <span className="eyebrow-pill">STORAGE / BÁO CÁO KINH DOANH</span>
                    <h1>{title}</h1>
                    <p className="page-description">
                        Dữ liệu tổng hợp theo thời gian thực theo phạm vi phân quyền quản trị của bạn.
                    </p>
                </div>
                <div className="action-row">
                    <button className="btn-figma btn-outline btn-sm" onClick={exportCsv} disabled={!data || busy}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Xuất file CSV
                    </button>
                    <button className="btn-figma btn-primary-dark btn-sm" onClick={reload}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Làm mới
                    </button>
                </div>
            </header>

            {error ? (
                <div role="alert" className="clean-card empty-state error-state">
                    <div className="state-icon">⚠️</div>
                    <h4>Không thể tải dữ liệu báo cáo</h4>
                    <p>{error}</p>
                    <button className="btn-figma btn-outline btn-sm" onClick={reload}>Thử lại</button>
                </div>
            ) : busy ? (
                <div className="clean-card empty-state" aria-live="polite">
                    <div className="loading-spinner"></div>
                    <p>Hệ thống đang đối soát và tổng hợp dữ liệu báo cáo…</p>
                </div>
            ) : (
                <div className="metric-grid modern-kpi-grid">
                    {Object.entries(data ?? {}).map(([key, value]) => {
                        const isMoney = /revenue|funds|amount|receipts|refunds/i.test(key);
                        const isRate = /rate|ratio|percent/i.test(key);
                        const rateNum = parseFloat(String(value).replace("%", "")) || 0;

                        return (
                            <article className="clean-card kpi-card" key={key}>
                                <div className="kpi-top">
                                    <span className="kpi-icon">{icons[key] || "📊"}</span>
                                    <span className="kpi-label">{labels[key] || key}</span>
                                </div>
                                <div className="kpi-value-row">
                                    <strong className="kpi-number">
                                        {isMoney ? money(value) : display(value)}
                                    </strong>
                                </div>
                                {isRate && (
                                    <div className="kpi-progress-bar">
                                        <div
                                            className="kpi-progress-fill"
                                            style={{ width: `${Math.min(100, Math.max(0, rateNum))}%` }}
                                        ></div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
