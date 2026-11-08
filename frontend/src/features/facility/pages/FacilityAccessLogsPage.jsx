import { useEffect, useState } from "react";
import { useSession } from "../../identity/session";
import { facilityApi } from "../api/facility.api";
import { display, statusClass, statusLabel } from "../../../shared/lib/format";

function formatDateTime(val) {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString("vi-VN");
}

export default function FacilityAccessLogsPage() {
    const session = useSession();
    const facilityCode = session?.user?.facilityCode || "HN-CG";

    const [logs, setLogs] = useState([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState("");
    const [searchUnit, setSearchUnit] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadLogs = async () => {
        setBusy(true);
        setError("");
        try {
            const data = await facilityApi.accessLogs(facilityCode);
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không tải được nhật ký an ninh");
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [facilityCode]);

    const activeInFacility = logs.filter((l) => l.status === "GRANTED" && !l.checkoutAt);
    const deniedAttempts = logs.filter((l) => l.status === "DENIED");

    const filteredLogs = logs.filter((l) => {
        const matchUnit = !searchUnit || l.unitCode?.toLowerCase().includes(searchUnit.toLowerCase()) || l.customerName?.toLowerCase().includes(searchUnit.toLowerCase());
        const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? (l.status === "GRANTED" && !l.checkoutAt) : l.status === statusFilter);
        return matchUnit && matchStatus;
    });

    return (
        <main className="page-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
            <header className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                <div>
                    <span className="eyebrow" style={{ color: "#0066FF", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
                        STORAGE / AN NINH &amp; VẬN HÀNH
                    </span>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0B192C", margin: "6px 0 4px" }}>
                        Nhật ký ra vào &amp; Giám sát an ninh cơ sở {display(facilityCode)}
                    </h1>
                    <p style={{ color: "#475569", margin: 0, fontSize: "14px" }}>
                        Theo dõi thời gian thực các lượt khách hàng check-in mở khóa cửa, mã PIN và ra vào buồng kho tại chi nhánh.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn-figma btn-outline btn-sm"
                    onClick={loadLogs}
                    disabled={busy}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                    {busy ? "Đang cập nhật…" : "Làm mới dữ liệu"}
                </button>
            </header>

            {error && <section className="card error" role="alert" style={{ marginBottom: "20px" }}>{error}</section>}

            {/* KPI Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <small style={{ color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>ĐANG TRONG KHO (ACTIVE)</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "800", color: "#16A34A" }}>{activeInFacility.length}</span>
                        <span style={{ fontSize: "12.5px", color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Khách tại cơ sở</span>
                    </div>
                </div>

                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <small style={{ color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>TỔNG LƯỢT TRUY CẬP</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "800", color: "#0B192C" }}>{logs.length}</span>
                        <span style={{ fontSize: "12.5px", color: "#64748B" }}>lượt ghi nhận</span>
                    </div>
                </div>

                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <small style={{ color: "#64748B", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>TỪ CHỐI / CẢNH BÁO</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "800", color: deniedAttempts.length ? "#DC2626" : "#64748B" }}>{deniedAttempts.length}</span>
                        <span style={{ fontSize: "12.5px", color: deniedAttempts.length ? "#991B1B" : "#64748B", background: deniedAttempts.length ? "#FEE2E2" : "#F1F5F9", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Sai PIN / Khóa nợ</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: "16px 20px", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center" }}>
                <div style={{ flex: "1 1 240px" }}>
                    <input
                        type="text"
                        placeholder="Tìm theo Mã kho (vd: HN-CG-001) hoặc tên khách..."
                        value={searchUnit}
                        onChange={(e) => setSearchUnit(e.target.value)}
                        style={{ width: "100%", padding: "8px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                    />
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "ALL" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("ALL")}
                    >
                        Tất cả ({logs.length})
                    </button>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "ACTIVE" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("ACTIVE")}
                    >
                        Đang trong kho ({activeInFacility.length})
                    </button>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "DENIED" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("DENIED")}
                    >
                        Bị từ chối ({deniedAttempts.length})
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <section className="card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div className="table-scroll">
                    <table style={{ width: "100%", fontSize: "13px" }}>
                        <thead>
                            <tr>
                                <th>Thời gian vào</th>
                                <th>Thời gian ra</th>
                                <th>Buồng kho</th>
                                <th>Khách hàng</th>
                                <th>Thời lượng</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Ghi chú / Mục đích</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                                        Không tìm thấy lượt vào ra nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isSuccess = log.status === "GRANTED";
                                    return (
                                        <tr key={log.id}>
                                            <td>
                                                <strong>{formatDateTime(log.checkinAt)}</strong>
                                            </td>
                                            <td>
                                                {log.checkoutAt ? (
                                                    formatDateTime(log.checkoutAt)
                                                ) : isSuccess ? (
                                                    <span style={{ color: "#16A34A", fontWeight: "700" }}>🟢 Đang trong kho</span>
                                                ) : "—"}
                                            </td>
                                            <td>
                                                <strong style={{ color: "#0066FF" }}>{display(log.unitCode)}</strong>
                                            </td>
                                            <td>
                                                <strong>{display(log.customerName)}</strong>
                                                {log.customerPhone && <small style={{ display: "block", color: "#64748B" }}>{log.customerPhone}</small>}
                                            </td>
                                            <td>
                                                {log.durationMinutes ? `${log.durationMinutes} phút` : log.checkoutAt ? "1 phút" : isSuccess ? "Đang ở" : "—"}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "11px", background: "#F1F5F9", padding: "2px 8px", borderRadius: "6px", fontWeight: "600" }}>
                                                    {log.accessMethod === "QR_SCAN" ? "📱 Mã QR" : "🔢 Bàn phím PIN"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${isSuccess ? "success" : "danger"}`} style={{ fontSize: "11px", fontWeight: "700" }}>
                                                    {isSuccess ? "Cho phép vào" : `Từ chối (${display(log.denyReason || "Sai PIN")})`}
                                                </span>
                                            </td>
                                            <td>
                                                <small style={{ color: "#475569" }}>{display(log.notes)}</small>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

