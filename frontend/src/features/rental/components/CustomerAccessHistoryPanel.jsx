import { useEffect, useState } from "react";
import { rentalApi } from "../api/rental.api";
import { display } from "../../../shared/lib/format";

function formatDateTime(val) {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString("vi-VN");
}

export default function CustomerAccessHistoryPanel({ contract }) {
    const [logs, setLogs] = useState([]);
    const [busy, setBusy] = useState(false);
    const [pin, setPin] = useState("");
    const [notes, setNotes] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadHistory = async () => {
        if (!contract?.id) return;
        try {
            const data = await rentalApi.accessHistory(contract.id);
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Không tải được lịch sử truy cập:", err);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [contract?.id]);

    const activeVisit = logs.find((l) => l.status === "GRANTED" && !l.checkoutAt);

    const handleCheckin = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await rentalApi.checkinAccess(contract.id, {
                pin: pin || contract.pinCode,
                method: "PIN_CODE",
                notes: notes || "Check-in vào kho cất/lấy đồ",
            });
            setMessage("Check-in vào kho thành công! Cửa khoang kho đã mở chốt.");
            setPin("");
            setNotes("");
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Check-in thất bại");
        } finally {
            setBusy(false);
        }
    };

    const handleCheckout = async () => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await rentalApi.checkoutAccess(contract.id, {
                notes: "Check-out ra về, đã đóng chốt khóa an toàn",
            });
            setMessage("Đã ghi nhận rời kho an toàn.");
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Check-out thất bại");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="card" style={{ marginTop: "24px", padding: "24px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                    <span className="eyebrow" style={{ color: "#0066FF", fontWeight: "700", fontSize: "11px", textTransform: "uppercase" }}>
                        AN NINH &amp; RA VÀO KHO
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0B192C", margin: "4px 0" }}>
                        Nhật ký vào/ra &amp; Check-in mở cửa
                    </h2>
                    <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
                        Ghi nhận thời gian thực mọi lượt mở cửa khoang <strong>{display(contract?.unitCode)}</strong> để đảm bảo an ninh tuyệt đối.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {activeVisit ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#DCFCE7", color: "#166534", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
                            Đang trong khoang kho
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F1F5F9", color: "#475569", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                            Đã rời kho
                        </div>
                    )}
                    <button type="button" className="btn-figma btn-outline btn-sm" onClick={loadHistory} disabled={busy}>
                        Làm mới
                    </button>
                </div>
            </div>

            {error && <div className="notice" role="alert" style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}
            {message && <div className="notice" role="status" style={{ background: "#DCFCE7", color: "#166534", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{message}</div>}

            {/* Check-in / Check-out Action Card */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
                {activeVisit ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <strong style={{ fontSize: "14px", color: "#0B192C", display: "block" }}>
                                Bạn đã check-in vào lúc {formatDateTime(activeVisit.checkinAt)}
                            </strong>
                            <span style={{ fontSize: "12.5px", color: "#64748B" }}>
                                Khi kết thúc cất/lấy đồ, vui lòng bấm Check-out để đóng phiên ra vào an toàn.
                            </span>
                        </div>
                        <button
                            type="button"
                            className="btn-figma btn-primary-dark"
                            onClick={handleCheckout}
                            disabled={busy}
                            style={{ background: "#D97706", borderColor: "#D97706" }}
                        >
                            {busy ? "Đang xử lý…" : "🚪 Check-out rời kho"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCheckin} style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                Mã PIN mở kho (mặc định theo HĐ)
                            </label>
                            <input
                                type="password"
                                placeholder={`PIN: ${contract?.pinCode || "123456"}`}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                            />
                        </div>
                        <div style={{ flex: "2 1 240px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                Mục đích lần này
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Cất thêm tài liệu, lấy đồ gia dụng..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-figma btn-primary-dark"
                            disabled={busy}
                            style={{ padding: "9px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                            {busy ? "Đang mở chốt…" : "🔑 Check-in vào kho"}
                        </button>
                    </form>
                )}
            </div>

            {/* Access History Log Table */}
            <div className="table-scroll">
                <table style={{ width: "100%", fontSize: "13px" }}>
                    <thead>
                        <tr>
                            <th>Thời gian vào</th>
                            <th>Thời gian ra</th>
                            <th>Thời lượng</th>
                            <th>Hình thức</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú / Mục đích</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748B" }}>
                                    Chưa có lượt vào/ra nào được ghi nhận cho khoang kho này.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const isSuccess = log.status === "GRANTED";
                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <strong>{formatDateTime(log.checkinAt)}</strong>
                                        </td>
                                        <td>
                                            {log.checkoutAt ? (
                                                formatDateTime(log.checkoutAt)
                                            ) : (
                                                <span style={{ color: "#16A34A", fontWeight: "700" }}>Đang trong kho</span>
                                            )}
                                        </td>
                                        <td>
                                            {log.durationMinutes ? `${log.durationMinutes} phút` : log.checkoutAt ? "1 phút" : "—"}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: "11.5px", background: "#F1F5F9", padding: "2px 8px", borderRadius: "6px", fontWeight: "600" }}>
                                                {log.accessMethod === "QR_SCAN" ? "📱 Quét mã QR" : "🔢 Bàn phím PIN"}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${isSuccess ? "success" : "danger"}`}
                                                style={{ fontSize: "11px", fontWeight: "700" }}
                                            >
                                                {isSuccess ? "Cho phép mở cửa" : `Từ chối (${display(log.denyReason || "Sai PIN")})`}
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
    );
}

