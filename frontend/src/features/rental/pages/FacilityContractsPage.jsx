import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDate, money, sortByNewest, statusClass, statusLabel } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

export default function FacilityContractsPage() {
    const { data, error, busy, reload } = useRemote(rentalApi.list);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const rows = sortByNewest(Array.isArray(data) ? data : []);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((row) => {
            const matchStatus = statusFilter === "ALL" || String(row.status) === statusFilter;
            const matchSearch = !q || [row.id, row.customerName, row.unitCode, row.facilityCode].some((v) => String(v || "").toLowerCase().includes(q));
            return matchStatus && matchSearch;
        });
    }, [rows, search, statusFilter]);

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STORAGE / QUẢN LÝ HỢP ĐỒNG</span>
                    <h1>Hợp đồng thuê kho tại cơ sở</h1>
                    <p>Danh sách hợp đồng thuê kho đang hoạt động, sắp hết hạn hoặc đang làm thủ tục bàn giao, trả kho tại chi nhánh.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link className="btn-figma btn-primary-dark btn-sm" to="/facility/inspections">
                        Danh sách nghiệm thu trả kho
                    </Link>
                    <button type="button" className="btn-figma btn-primary-dark btn-sm" onClick={reload} disabled={busy}>
                        {busy ? "Đang tải…" : "Làm mới"}
                    </button>
                </div>
            </header>

            {error && <section className="card error" role="alert">{error}</section>}

            <section className="card" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã hợp đồng, khách hàng, mã kho…"
                    style={{ flex: "1 1 260px", padding: "9px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700" }}>
                    Trạng thái
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">Tất cả ({rows.length})</option>
                        <option value="ACTIVE">Đang thuê</option>
                        <option value="CHECKOUT_REQUESTED">Yêu cầu trả kho</option>
                        <option value="EXPIRING_SOON">Sắp hết hạn</option>
                        <option value="OVERDUE">Quá hạn</option>
                        <option value="TERMINATED">Đã kết thúc</option>
                    </select>
                </label>
            </section>

            <section className="card">
                {busy ? (
                    <p>Đang tải danh sách hợp đồng…</p>
                ) : !visible.length ? (
                    <p className="empty">Không có hợp đồng nào phù hợp với bộ lọc hiện tại.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã hợp đồng</th>
                                    <th>Khách hàng</th>
                                    <th>Kho lưu trữ</th>
                                    <th>Cơ sở</th>
                                    <th>Giá thuê / tháng</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày kết thúc</th>
                                    <th>Trạng thái hợp đồng</th>
                                    <th>Thao tác trả kho</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((row) => {
                                    const isCheckoutRequested = row.status === "CHECKOUT_REQUESTED";
                                    const hasInspection = Boolean(row.inspectionStatus);
                                    return (
                                        <tr key={String(row.id)}>
                                            <td><strong>{display(row.id)}</strong></td>
                                            <td>{display(row.customerName)}</td>
                                            <td><strong>{display(row.unitCode)}</strong></td>
                                            <td>{display(row.facilityCode)}</td>
                                            <td>{money(row.monthlyFee)}</td>
                                            <td>{formatDate(row.startDate || row.startAt)}</td>
                                            <td>{formatDate(row.endDate || row.endAt)}</td>
                                            <td>
                                                <span className={`badge ${statusClass(row.status)}`}>
                                                    {statusLabel(row.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {isCheckoutRequested || hasInspection ? (
                                                    <Link
                                                        className="btn-figma btn-primary-dark btn-sm"
                                                        to={`/facility/inspections/${encodeURIComponent(String(row.id))}`}
                                                    >
                                                        Trả kho / Nghiệm thu
                                                    </Link>
                                                ) : row.status === "TERMINATED" ? (
                                                    <span style={{ fontSize: "12.5px", color: "#64748B" }}>Đã tất toán</span>
                                                ) : (
                                                    <Link
                                                        className="btn-figma btn-primary-dark btn-sm"
                                                        to="/facility/inspections"
                                                    >
                                                        Theo dõi trả kho
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
