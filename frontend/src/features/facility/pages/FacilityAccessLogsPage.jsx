import { useEffect, useState } from "react";
import { useSession } from "../../identity/session";
import { facilityApi } from "../api/facility.api";
import { rentalApi } from "../../rental/api/rental.api";
import { display } from "../../../shared/lib/format";

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
    const [actionBusy, setActionBusy] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchUnit, setSearchUnit] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [approvingReq, setApprovingReq] = useState(null);
    const [customPin, setCustomPin] = useState("");
    const [approvalNote, setApprovalNote] = useState("");

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
    const pendingRequests = logs.filter((l) => l.status === "PENDING_APPROVAL");
    const pinIssuedList = logs.filter((l) => l.status === "PIN_ISSUED");
    const deniedAttempts = logs.filter((l) => l.status === "DENIED" || l.status === "REJECTED");

    const filteredLogs = logs.filter((l) => {
        const matchUnit = !searchUnit || l.unitCode?.toLowerCase().includes(searchUnit.toLowerCase()) || l.customerName?.toLowerCase().includes(searchUnit.toLowerCase());
        const matchStatus = statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" ? (l.status === "GRANTED" && !l.checkoutAt) :
            statusFilter === "PENDING" ? (l.status === "PENDING_APPROVAL") :
            statusFilter === "PIN_ISSUED" ? (l.status === "PIN_ISSUED") :
            statusFilter === "DENIED" ? (l.status === "DENIED" || l.status === "REJECTED") :
            l.status === statusFilter);
        return matchUnit && matchStatus;
    });

    const startApprove = (req) => {
        setApprovingReq(req);
        // Pre-generate a 6-digit random PIN
        const random6 = String(Math.floor(100000 + Math.random() * 900000));
        setCustomPin(random6);
        setApprovalNote("Đã xác thực hợp đồng hiệu lực. Cấp mã PIN 6 số.");
    };

    const confirmApprove = async () => {
        if (!approvingReq) return;
        if (!customPin || !/^\d{6}$/.test(customPin)) {
            setError("Mã PIN cấp cho khách phải gồm đúng 6 chữ số.");
            return;
        }
        setActionBusy(true);
        setError("");
        setSuccessMessage("");
        try {
            await facilityApi.approveAccessRequest(facilityCode, approvingReq.id, {
                pin: customPin,
                notes: approvalNote
            });
            setSuccessMessage(`Đã duyệt và cấp mã PIN [${customPin}] cho khách hàng ${approvingReq.customerName} (Kho ${approvingReq.unitCode}) thành công!`);
            setApprovingReq(null);
            await loadLogs();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Duyệt yêu cầu thất bại");
        } finally {
            setActionBusy(false);
        }
    };

    const handleReject = async (req) => {
        const reason = window.prompt("Lý do từ chối yêu cầu vào kho:", "Kho đang bảo trì kỹ thuật");
        if (!reason) return;
        setActionBusy(true);
        setError("");
        setSuccessMessage("");
        try {
            await facilityApi.rejectAccessRequest(facilityCode, req.id, { reason });
            setSuccessMessage(`Đã từ chối yêu cầu của ${req.customerName}.`);
            await loadLogs();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Từ chối yêu cầu thất bại");
        } finally {
            setActionBusy(false);
        }
    };

    const handleStaffCheckout = async (contractId, customerName) => {
        if (!window.confirm(`Xác nhận khách hàng ${customerName} đã rời kho và hoàn tất check-out?`)) return;
        setActionBusy(true);
        setError("");
        setSuccessMessage("");
        try {
            await rentalApi.checkoutAccess(contractId, {
                notes: "Nhân viên xác nhận khách đã rời kho và buồng kho đã đóng an toàn"
            });
            setSuccessMessage(`Đã ghi nhận check-out cho khách ${customerName}.`);
            await loadLogs();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Check-out thất bại");
        } finally {
            setActionBusy(false);
        }
    };

    return (
        <main className="page-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
            <header className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                <div>
                    <span className="eyebrow" style={{ color: "#0066FF", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>
                        STORAGE / AN NINH &amp; VẬN HÀNH
                    </span>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0B192C", margin: "6px 0 4px" }}>
                        Quản lý Check-in &amp; Giám sát an ninh cơ sở {display(facilityCode)}
                    </h1>
                    <p style={{ color: "#475569", margin: 0, fontSize: "14px" }}>
                        Phê duyệt yêu cầu check-in, cấp mã PIN 6 số cho khách hàng và theo dõi thời gian thực lượt khách đang có mặt tại cơ sở.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn-figma btn-outline btn-sm"
                    onClick={loadLogs}
                    disabled={busy || actionBusy}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                    {busy ? "Đang cập nhật…" : "Làm mới dữ liệu"}
                </button>
            </header>

            {error && <section className="card error" role="alert" style={{ marginBottom: "20px" }}>{error}</section>}
            {successMessage && <section className="notice" role="status" style={{ background: "#DCFCE7", color: "#166534", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontWeight: "600", fontSize: "13.5px" }}>{successMessage}</section>}

            {/* KPI Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1.5px solid #FDE68A", background: "#FFFBEB" }}>
                    <small style={{ color: "#92400E", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase" }}>YÊU CẦU CHỜ DUYỆT PIN</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "900", color: "#D97706" }}>{pendingRequests.length}</span>
                        <span style={{ fontSize: "12px", color: "#78350F", background: "#FEF3C7", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Cần cấp mã PIN</span>
                    </div>
                </div>

                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1.5px solid #BBF7D0", background: "#F0FDF4" }}>
                    <small style={{ color: "#166534", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase" }}>ĐANG TRONG KHO (ACTIVE)</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "900", color: "#16A34A" }}>{activeInFacility.length}</span>
                        <span style={{ fontSize: "12px", color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Khách tại cơ sở</span>
                    </div>
                </div>

                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #BAE6FD", background: "#F0F9FF" }}>
                    <small style={{ color: "#0369A1", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase" }}>ĐÃ CẤP MÃ PIN (CHƯA VÀO)</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "900", color: "#0284C7" }}>{pinIssuedList.length}</span>
                        <span style={{ fontSize: "12px", color: "#0369A1", background: "#E0F2FE", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Chờ khách tới</span>
                    </div>
                </div>

                <div className="card" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <small style={{ color: "#64748B", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase" }}>TỪ CHỐI / SAI PIN</small>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <span style={{ fontSize: "26px", fontWeight: "900", color: deniedAttempts.length ? "#DC2626" : "#64748B" }}>{deniedAttempts.length}</span>
                        <span style={{ fontSize: "12px", color: deniedAttempts.length ? "#991B1B" : "#64748B", background: deniedAttempts.length ? "#FEE2E2" : "#F1F5F9", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Cảnh báo an ninh</span>
                    </div>
                </div>
            </div>

            {/* MODAL / APPROVAL FORM BOX */}
            {approvingReq && (
                <div className="card" style={{ padding: "20px 24px", borderRadius: "14px", border: "2px solid #0066FF", background: "#EFF6FF", marginBottom: "24px", boxShadow: "0 10px 15px -3px rgba(0, 102, 255, 0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0B192C", margin: 0 }}>
                            🔑 Duyệt &amp; Cấp mã PIN 6 số cho khách hàng: <span style={{ color: "#0066FF" }}>{approvingReq.customerName}</span>
                        </h3>
                        <button type="button" className="btn-figma btn-outline btn-sm" onClick={() => setApprovingReq(null)}>Đóng</button>
                    </div>

                    <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px" }}>
                        Yêu cầu vào khoang kho <strong>{approvingReq.unitCode}</strong> · Mục đích: <em>{display(approvingReq.purpose)}</em> · Đăng ký lúc: {formatDateTime(approvingReq.createdAt)}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                                Mã PIN 6 số cấp cho khách (Tự sinh hoặc chỉnh sửa)
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={customPin}
                                onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ""))}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "2px solid #0066FF", fontSize: "20px", fontWeight: "900", letterSpacing: "4px", fontFamily: "monospace", color: "#0066FF", background: "#FFFFFF" }}
                            />
                            <small style={{ color: "#64748B", fontSize: "11.5px" }}>Khách sẽ dùng 6 số này để nhập tại bàn phím buồng kho</small>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                                Ghi chú duyệt của Quản lý
                            </label>
                            <input
                                type="text"
                                value={approvalNote}
                                onChange={(e) => setApprovalNote(e.target.value)}
                                placeholder="Ghi chú an ninh hoặc lời nhắn gửi khách..."
                                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", background: "#FFFFFF" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button type="button" className="btn-figma btn-outline btn-sm" onClick={() => setApprovingReq(null)}>Hủy bỏ</button>
                        <button
                            type="button"
                            className="btn-figma btn-primary-dark"
                            onClick={confirmApprove}
                            disabled={actionBusy}
                            style={{ padding: "10px 24px", fontWeight: "800" }}
                        >
                            {actionBusy ? "Đang xử lý…" : "✓ Xác nhận cấp PIN & Gửi cho Khách"}
                        </button>
                    </div>
                </div>
            )}

            {/* SECTION 1: PENDING REQUESTS QUEUE */}
            {pendingRequests.length > 0 && (
                <section className="card" style={{ padding: "20px", borderRadius: "14px", border: "1.5px solid #FDE68A", background: "#FFFDF5", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <div>
                            <span style={{ background: "#D97706", color: "#FFFFFF", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                                HÀNG ĐỢI DUYỆT TRUY CẬP ({pendingRequests.length})
                            </span>
                            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#78350F", margin: "4px 0 0" }}>
                                Khách hàng đang chờ cấp mã PIN vào kho
                            </h2>
                        </div>
                    </div>

                    <div className="table-scroll">
                        <table style={{ width: "100%", fontSize: "13px" }}>
                            <thead>
                                <tr>
                                    <th>Thời điểm gửi</th>
                                    <th>Khách hàng</th>
                                    <th>Khoang kho</th>
                                    <th>Mục đích</th>
                                    <th>Dự kiến tới</th>
                                    <th>Ghi chú</th>
                                    <th>Hành động của Quản lý</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td><strong>{formatDateTime(req.createdAt)}</strong></td>
                                        <td>
                                            <strong>{display(req.customerName)}</strong>
                                            {req.customerPhone && <small style={{ display: "block", color: "#64748B" }}>{req.customerPhone}</small>}
                                        </td>
                                        <td><strong style={{ color: "#0066FF" }}>{display(req.unitCode)}</strong></td>
                                        <td>{display(req.purpose)}</td>
                                        <td>{formatDateTime(req.expectedAt)}</td>
                                        <td><small style={{ color: "#64748B" }}>{display(req.notes)}</small></td>
                                        <td>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    className="btn-figma btn-primary-dark btn-sm"
                                                    onClick={() => startApprove(req)}
                                                    disabled={actionBusy}
                                                    style={{ background: "#0066FF", padding: "6px 14px", fontWeight: "700" }}
                                                >
                                                    🔑 Duyệt &amp; Cấp PIN 6 số
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-figma btn-outline btn-sm"
                                                    onClick={() => handleReject(req)}
                                                    disabled={actionBusy}
                                                    style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* SECTION 2: ACTIVE VISITORS WITH STAFF CHECKOUT */}
            {activeInFacility.length > 0 && (
                <section className="card" style={{ padding: "20px", borderRadius: "14px", border: "1.5px solid #BBF7D0", background: "#F7FEE7", marginBottom: "24px" }}>
                    <div style={{ marginBottom: "14px" }}>
                        <span style={{ background: "#16A34A", color: "#FFFFFF", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                            🟢 KHÁCH ĐANG Ở TẠI CƠ SỞ ({activeInFacility.length})
                        </span>
                        <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#14532D", margin: "4px 0 0" }}>
                            Danh sách khách hàng đang có mặt trong buồng kho
                        </h2>
                    </div>

                    <div className="table-scroll">
                        <table style={{ width: "100%", fontSize: "13px" }}>
                            <thead>
                                <tr>
                                    <th>Thời gian check-in</th>
                                    <th>Khách hàng</th>
                                    <th>Buồng kho</th>
                                    <th>Mục đích</th>
                                    <th>Mã PIN đã cấp</th>
                                    <th>Thao tác hỗ trợ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeInFacility.map((visit) => (
                                    <tr key={visit.id}>
                                        <td><strong>{formatDateTime(visit.checkinAt)}</strong></td>
                                        <td>
                                            <strong>{display(visit.customerName)}</strong>
                                            {visit.customerPhone && <small style={{ display: "block", color: "#64748B" }}>{visit.customerPhone}</small>}
                                        </td>
                                        <td><strong style={{ color: "#0066FF" }}>{display(visit.unitCode)}</strong></td>
                                        <td>{display(visit.purpose || visit.notes)}</td>
                                        <td>
                                            <span style={{ fontFamily: "monospace", fontWeight: "800", color: "#0284C7", background: "#E0F2FE", padding: "2px 8px", borderRadius: "6px" }}>
                                                {visit.accessPin || "••••••"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn-figma btn-sm"
                                                onClick={() => handleStaffCheckout(visit.contractId, visit.customerName)}
                                                disabled={actionBusy}
                                                style={{ background: "#D97706", color: "#FFFFFF", padding: "6px 14px", fontWeight: "700" }}
                                            >
                                                🚪 Xác nhận khách rời kho (Check-out)
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* SECTION 3: FULL ACCESS LOGS */}
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
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "ALL" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("ALL")}
                    >
                        Tất cả ({logs.length})
                    </button>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "PENDING" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("PENDING")}
                    >
                        Chờ duyệt PIN ({pendingRequests.length})
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
                        className={`btn-figma btn-sm ${statusFilter === "PIN_ISSUED" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("PIN_ISSUED")}
                    >
                        Đã cấp PIN ({pinIssuedList.length})
                    </button>
                    <button
                        type="button"
                        className={`btn-figma btn-sm ${statusFilter === "DENIED" ? "btn-primary-dark" : "btn-outline"}`}
                        onClick={() => setStatusFilter("DENIED")}
                    >
                        Từ chối / Cảnh báo ({deniedAttempts.length})
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
                                <th>Mã PIN</th>
                                <th>Thời lượng</th>
                                <th>Trạng thái</th>
                                <th>Mục đích / Ghi chú</th>
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
                                    const isInside = log.status === "GRANTED" && !log.checkoutAt;
                                    const isCheckedOut = log.status === "CHECKED_OUT" || (log.status === "GRANTED" && log.checkoutAt);
                                    const isPinIssued = log.status === "PIN_ISSUED";
                                    const isPending = log.status === "PENDING_APPROVAL";
                                    const isDenied = log.status === "DENIED" || log.status === "REJECTED";

                                    return (
                                        <tr key={log.id}>
                                            <td>
                                                <strong>{log.checkinAt ? formatDateTime(log.checkinAt) : (log.expectedAt ? `Hẹn: ${formatDateTime(log.expectedAt)}` : formatDateTime(log.createdAt))}</strong>
                                            </td>
                                            <td>
                                                {log.checkoutAt ? (
                                                    formatDateTime(log.checkoutAt)
                                                ) : isInside ? (
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
                                                {log.accessPin ? (
                                                    <span style={{ fontFamily: "monospace", fontWeight: "800", color: "#0284C7", background: "#E0F2FE", padding: "2px 8px", borderRadius: "6px" }}>
                                                        {log.accessPin}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#94A3B8" }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {log.durationMinutes ? `${log.durationMinutes} phút` : log.checkoutAt ? "1 phút" : isInside ? "Đang tính giờ" : "—"}
                                            </td>
                                            <td>
                                                {isInside ? (
                                                    <span className="badge success" style={{ fontSize: "11px", fontWeight: "700" }}>Đang trong kho</span>
                                                ) : isCheckedOut ? (
                                                    <span className="badge" style={{ fontSize: "11px", fontWeight: "700", background: "#F1F5F9", color: "#475569" }}>Đã check-out</span>
                                                ) : isPinIssued ? (
                                                    <span className="badge" style={{ fontSize: "11px", fontWeight: "700", background: "#E0F2FE", color: "#0369A1" }}>Đã cấp PIN</span>
                                                ) : isPending ? (
                                                    <span className="badge pending" style={{ fontSize: "11px", fontWeight: "700" }}>Chờ duyệt PIN</span>
                                                ) : isDenied ? (
                                                    <span className="badge danger" style={{ fontSize: "11px", fontWeight: "700" }}>Từ chối ({display(log.denyReason || "Sai PIN")})</span>
                                                ) : (
                                                    <span className="badge">{display(log.status)}</span>
                                                )}
                                            </td>
                                            <td>
                                                <small style={{ color: "#475569" }}>{display(log.purpose || log.notes)}</small>
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
