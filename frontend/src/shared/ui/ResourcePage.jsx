import { useState } from "react";
import { useRemote } from "../api/use-remote";
import { display, money, sortByNewest, statusClass, statusLabel } from "../lib/format";
import { fieldLabel } from "../lib/field-labels";
import { ReloadContext } from "./resource-context";
export { Form } from "./Form";

export function ResourcePage({
    title,
    eyebrow = "STORAGE / HỆ THỐNG",
    description,
    load,
    columns,
    children,
    actions,
    childrenTitle = "Thao tác nghiệp vụ",
}) {
    const { data, error, busy, reload } = useRemote(load);
    const [search, setSearch] = useState("");
    const rows = sortByNewest(Array.isArray(data) ? data : data ? [data] : []);
    const cols =
        columns ??
        Object.keys(rows[0] ?? {})
            .filter(
                (k) =>
                    ![
                        "pinCode",
                        "password",
                        "cccd",
                        "priceSnapshot",
                        "idempotencyKey",
                        "evidencePath",
                    ].includes(k)
            )
            .slice(0, 7)
            .map((k) => [k, fieldLabel(k)]);

    const filtered = rows.filter((r) =>
        Object.values(r).some((v) =>
            display(v).toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <div className="resource-page-container">
            {/* Page Header */}
            <header className="page-heading">
                <div>
                    <span className="eyebrow-pill">{eyebrow}</span>
                    <h1>{title}</h1>
                    <p className="page-description">
                        {description ||
                            "Dữ liệu được cập nhật trực tiếp theo phân quyền tài khoản của bạn."}
                    </p>
                </div>
                <div className="action-row">
                    {actions}
                    <button className="btn-figma btn-outline btn-sm" onClick={reload}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Làm mới
                    </button>
                </div>
            </header>

            {/* Action Card (If child actions exist) */}
            {children && (
                <section className="clean-card action-card">
                    <h2>{childrenTitle}</h2>
                    <ReloadContext.Provider value={reload}>
                        {children}
                    </ReloadContext.Provider>
                </section>
            )}

            {/* Data Table Section */}
            <section className="clean-card table-section-card">
                <div className="table-toolbar">
                    <div className="toolbar-title-group">
                        <h2>Danh sách dữ liệu</h2>
                        <span className="count-badge">{filtered.length} bản ghi</span>
                    </div>
                    <div className="table-search-input-box">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            aria-label="Tìm trong danh sách"
                            placeholder="Tìm kiếm nhanh trong bảng…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {error ? (
                    <div className="empty error" role="alert">
                        <p>{error}</p>
                        <button className="btn-figma btn-outline btn-sm" onClick={reload}>
                            Thử lại
                        </button>
                    </div>
                ) : busy ? (
                    <div className="empty" aria-live="polite">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu…</p>
                    </div>
                ) : !filtered.length ? (
                    <div className="empty">
                        <span className="empty-icon">▤</span>
                        <h3>Chưa có dữ liệu phù hợp</h3>
                        <p>Dữ liệu sẽ xuất hiện khi có giao dịch hoặc thử thay đổi từ khóa tìm kiếm.</p>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    {cols.map(([key, label]) => (
                                        <th key={key}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={String(r.id ?? r.code ?? i)}>
                                        {cols.map(([key, _label, render]) => (
                                            <td key={key}>
                                                {typeof render === "function" ? (
                                                    render(r, reload)
                                                ) : /status/i.test(key) ? (
                                                    r[key] == null || r[key] === "" ? (
                                                        <span style={{ color: "#94A3B8" }}>—</span>
                                                    ) : (
                                                        <span className={"badge " + statusClass(r[key])}>
                                                            {statusLabel(r[key])}
                                                        </span>
                                                    )
                                                ) : /amount|price|fee|deposit/i.test(key) ? (
                                                    <strong>{money(r[key])}</strong>
                                                ) : (
                                                    display(r[key])
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
