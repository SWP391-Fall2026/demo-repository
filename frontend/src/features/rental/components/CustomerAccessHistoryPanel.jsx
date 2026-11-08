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
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [purpose, setPurpose] = useState("Cất thêm tài sản vào khoang kho");
    const [expectedTime, setExpectedTime] = useState("");
    const [requestNotes, setRequestNotes] = useState("");
    const [inputPin, setInputPin] = useState("");
    const [checkoutConfirmedLock, setCheckoutConfirmedLock] = useState(true);
    const [checkoutConfirmedClean, setCheckoutConfirmedClean] = useState(true);
    const [checkoutNotes, setCheckoutNotes] = useState("");
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

    // Active session inside unit
    const activeVisit = logs.find((l) => l.status === "GRANTED" && !l.checkoutAt);
    // Request with issued 6-digit PIN waiting for customer to enter unit
    const issuedRequest = logs.find((l) => l.status === "PIN_ISSUED");
    // Request waiting for Manager approval
    const pendingRequest = logs.find((l) => l.status === "PENDING_APPROVAL");

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await rentalApi.createAccessRequest(contract.id, {
                purpose,
                expectedAt: expectedTime || new Date().toISOString(),
                notes: requestNotes,
                method: "PIN_CODE"
            });
            setMessage("Đã gửi yêu cầu check-in tới Quản lý cơ sở thành công! Vui lòng chờ cấp mã PIN.");
            setShowRequestForm(false);
            setRequestNotes("");
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không gửi được yêu cầu check-in");
        } finally {
            setBusy(false);
        }
    };

    const handleCheckinWithPin = async (pinToUse) => {
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await rentalApi.checkinAccess(contract.id, {
                pin: pinToUse || inputPin || issuedRequest?.accessPin || contract.pinCode,
                method: "PIN_CODE",
                notes: `Khách hàng check-in mở chốt khoang ${contract.unitCode}`
            });
            setMessage("Check-in mở cửa thành công! Chốt khóa phòng kho đã mở.");
            setInputPin("");
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Mã PIN không hợp lệ hoặc check-in thất bại");
        } finally {
            setBusy(false);
        }
    };

    const handleCheckout = async () => {
        if (!checkoutConfirmedLock) {
            setError("Vui lòng xác nhận bạn đã khóa cửa buồng kho trước khi check-out.");
            return;
        }
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await rentalApi.checkoutAccess(contract.id, {
                notes: checkoutNotes || "Khách hàng check-out rời kho, đã khóa cửa an toàn"
            });
            setMessage("Đã hoàn tất check-out rời kho. Mã PIN truy cập đã được hủy an toàn.");
            setCheckoutNotes("");
            await loadHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Check-out thất bại");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="card" style={{ marginTop: "24px", padding: "24px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                <div>
                    <span className="eyebrow" style={{ color: "#0066FF", fontWeight: "700", fontSize: "11px", textTransform: "uppercase" }}>
                        AN NINH &amp; TRUY CẬP BUỒNG KHO
                    </span>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0B192C", margin: "4px 0" }}>
                        Quy trình Check-in &amp; Check-out ra vào kho
                    </h2>
                    <p style={{ color: "#64748B", fontSize: "13.5px", margin: 0 }}>
                        Khoang kho: <strong style={{ color: "#0066FF" }}>{display(contract?.unitCode)}</strong> · Cơ sở: <strong>{display(contract?.facilityCode)}</strong>
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {activeVisit ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#DCFCE7", color: "#166534", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
                            Đang trong phòng kho
                        </div>
                    ) : issuedRequest ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#E0F2FE", color: "#0369A1", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284C7" }} />
                            Đã có mã PIN vào kho
                        </div>
                    ) : pendingRequest ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FEF3C7", color: "#92400E", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                            Chờ Manager duyệt PIN
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F1F5F9", color: "#475569", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                            Chưa có lịch vào kho
                        </div>
                    )}

                    <button type="button" className="btn-figma btn-outline btn-sm" onClick={loadHistory} disabled={busy}>
                        Làm mới
                    </button>
                </div>
            </div>

            {error && <div className="notice" role="alert" style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}
            {message && <div className="notice" role="status" style={{ background: "#DCFCE7", color: "#166534", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{message}</div>}

            {/* FLOW STEP PANELS */}

            {/* 1. STATE: ACTIVE INSIDE UNIT -> SHOW CHECK-OUT ACTION */}
            {activeVisit && (
                <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "12px", padding: "20px", marginBottom: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <span style={{ display: "inline-block", background: "#16A34A", color: "#FFFFFF", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                                🟢 ĐANG THỰC HIỆN GIAO DỊCH TẠI KHO
                            </span>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#14532D", margin: "2px 0 4px" }}>
                                Bạn đã check-in vào lúc {formatDateTime(activeVisit.checkinAt)}
                            </h3>
                            <p style={{ color: "#166534", fontSize: "13px", margin: 0 }}>
                                Mục đích: {display(activeVisit.purpose || activeVisit.notes || "Cất/lấy tài sản")} · Khoang {display(contract.unitCode)}
                            </p>
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "12px", color: "#15803D", fontWeight: "700" }}>MÃ PHIÊN TRUY CẬP</span>
                            <div style={{ fontSize: "15px", fontFamily: "monospace", fontWeight: "800", color: "#065F46" }}>{activeVisit.id}</div>
                        </div>
                    </div>

                    {/* Check-out Safety Checklist */}
                    <div style={{ background: "#FFFFFF", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534", marginBottom: "10px" }}>
                            📋 Quy trình an toàn trước khi rời kho (Check-out):
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1E293B", marginBottom: "8px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={checkoutConfirmedLock}
                                onChange={(e) => setCheckoutConfirmedLock(e.target.checked)}
                            />
                            <span>Tôi xác nhận <strong>đã đóng chặt chốt khóa buồng kho</strong> an toàn.</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1E293B", marginBottom: "12px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={checkoutConfirmedClean}
                                onChange={(e) => setCheckoutConfirmedClean(e.target.checked)}
                            />
                            <span>Không để quên đồ đạc, rác thải hoặc chướng ngại vật ở hành lang chung.</span>
                        </label>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <input
                                type="text"
                                placeholder="Ghi chú khi rời kho (tùy chọn: đã cất 3 thùng hàng, mọi thứ ổn định...)"
                                value={checkoutNotes}
                                onChange={(e) => setCheckoutNotes(e.target.value)}
                                style={{ flex: "1 1 280px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                            />
                            <button
                                type="button"
                                className="btn-figma"
                                onClick={handleCheckout}
                                disabled={busy}
                                style={{ background: "#DC2626", color: "#FFFFFF", padding: "10px 22px", borderRadius: "8px", fontWeight: "700", fontSize: "13.5px", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                            >
                                {busy ? "Đang xử lý…" : "🚪 Xác nhận & Check-out rời kho"}
                            </button>
                        </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#15803D" }}>
                        ℹ️ <em>Khi bấm Check-out, hệ thống sẽ tính thời lượng lưu trú và lập tức thu hồi/khóa mã PIN check-in này để bảo mật tuyệt đối.</em>
                    </div>
                </div>
            )}

            {/* 2. STATE: PIN ISSUED BY MANAGER -> READY FOR CHECK-IN */}
            {!activeVisit && issuedRequest && (
                <div style={{ background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: "12px", padding: "20px", marginBottom: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "14px" }}>
                        <div>
                            <span style={{ display: "inline-block", background: "#0284C7", color: "#FFFFFF", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                                🔑 MÃ PIN ĐÃ ĐƯỢC QUẢN LÝ CẤP DUYỆT
                            </span>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0C4A6E", margin: "2px 0 4px" }}>
                                Mã PIN check-in mở cửa khoang {display(contract.unitCode)}
                            </h3>
                            <p style={{ color: "#0369A1", fontSize: "13px", margin: 0 }}>
                                Được duyệt bởi: <strong>{display(issuedRequest.approvedBy || "Quản lý cơ sở")}</strong> lúc {formatDateTime(issuedRequest.approvedAt)}
                            </p>
                        </div>

                        {/* Large 6-digit PIN Box */}
                        <div style={{ background: "#FFFFFF", border: "2px solid #0284C7", borderRadius: "12px", padding: "10px 20px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                            <span style={{ display: "block", fontSize: "11px", color: "#64748B", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
                                MÃ PIN 6 SỐ CỦA BẠN
                            </span>
                            <span style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "6px", color: "#0284C7", fontFamily: "monospace" }}>
                                {issuedRequest.accessPin}
                            </span>
                        </div>
                    </div>

                    <div style={{ background: "#FFFFFF", borderRadius: "10px", padding: "14px 18px", border: "1px solid #E0F2FE", marginBottom: "14px" }}>
                        <div style={{ fontSize: "13px", color: "#334155", marginBottom: "8px" }}>
                            📍 <strong>Hướng dẫn vào kho:</strong> Khi bạn đã có mặt tại cơ sở {display(contract.facilityCode)}, bạn có thể nhập 6 số <strong>{issuedRequest.accessPin}</strong> tại bàn phím cửa kho hoặc bấm nút xác nhận check-in ngay dưới đây để mở chốt tự động.
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button
                                type="button"
                                className="btn-figma btn-primary-dark"
                                onClick={() => handleCheckinWithPin(issuedRequest.accessPin)}
                                disabled={busy}
                                style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "800", background: "#0066FF" }}
                            >
                                {busy ? "Đang mở chốt…" : "⚡ Check-in mở cửa vào kho ngay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STATE: PENDING APPROVAL FROM MANAGER */}
            {!activeVisit && !issuedRequest && pendingRequest && (
                <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "12px", padding: "20px", marginBottom: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <span style={{ display: "inline-block", background: "#D97706", color: "#FFFFFF", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
                                ⏳ ĐANG CHỜ QUẢN LÝ DUYỆT &amp; CẤP MÃ PIN
                            </span>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#78350F", margin: "2px 0 4px" }}>
                                Yêu cầu vào khoang {display(contract.unitCode)} đã được gửi
                            </h3>
                            <p style={{ color: "#92400E", fontSize: "13px", margin: "4px 0" }}>
                                Mục đích: <strong>{display(pendingRequest.purpose)}</strong> · Gửi lúc: {formatDateTime(pendingRequest.createdAt)}
                            </p>
                            <p style={{ color: "#B45309", fontSize: "12.5px", margin: 0 }}>
                                ℹ️ Quản lý cơ sở sẽ kiểm tra và cấp mã PIN 6 số cho bạn trong giây lát. Hệ thống sẽ tự động cập nhật khi được duyệt.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-figma btn-outline btn-sm"
                            onClick={loadHistory}
                            disabled={busy}
                            style={{ background: "#FFFFFF", borderColor: "#D97706", color: "#B45309" }}
                        >
                            Kiểm tra trạng thái duyệt
                        </button>
                    </div>
                </div>
            )}

            {/* 4. STATE: NORMAL -> BUTTON TO CREATE NEW CHECK-IN REQUEST */}
            {!activeVisit && !issuedRequest && !pendingRequest && (
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", marginBottom: "22px" }}>
                    {!showRequestForm ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0B192C", margin: "0 0 4px" }}>
                                    Bạn muốn tới khoang kho cất hoặc lấy tài sản?
                                </h3>
                                <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
                                    Tạo yêu cầu check-in để Quản lý cơ sở phê duyệt và sinh mã PIN 6 số dùng để mở cửa.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-figma btn-primary-dark"
                                onClick={() => setShowRequestForm(true)}
                                style={{ padding: "10px 22px", fontSize: "13.5px", fontWeight: "700" }}
                            >
                                + Gửi yêu cầu Check-in vào kho
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateRequest}>
                            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0B192C", marginBottom: "12px" }}>
                                📝 Đăng ký vào khoang kho {display(contract.unitCode)}
                            </h3>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Mục đích vào kho
                                    </label>
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", background: "#FFFFFF" }}
                                    >
                                        <option value="Cất thêm tài sản vào khoang kho">Cất thêm tài sản vào khoang kho</option>
                                        <option value="Lấy bớt đồ đạc / tài liệu">Lấy bớt đồ đạc / tài liệu</option>
                                        <option value="Kiểm tra hiện trạng & dọn dẹp">Kiểm tra hiện trạng &amp; dọn dẹp buồng kho</option>
                                        <option value="Khác">Mục đích khác</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Thời gian dự kiến tới kho
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={expectedTime}
                                        onChange={(e) => setExpectedTime(e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                                    />
                                    <small style={{ color: "#64748B", fontSize: "11px" }}>Để trống nếu bạn tới ngay bây giờ</small>
                                </div>
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    Ghi chú bổ sung gửi Quản lý (tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Đi cùng 1 xe chở hàng, mang đồ gia dụng lớn..."
                                    value={requestNotes}
                                    onChange={(e) => setRequestNotes(e.target.value)}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    className="btn-figma btn-outline btn-sm"
                                    onClick={() => setShowRequestForm(false)}
                                    disabled={busy}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="btn-figma btn-primary-dark"
                                    disabled={busy}
                                    style={{ padding: "9px 22px" }}
                                >
                                    {busy ? "Đang gửi…" : "Gửi yêu cầu lên Manager"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* ACCESS LOGS & REQUESTS HISTORY TABLE */}
            <div style={{ marginBottom: "12px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0B192C", margin: "0 0 6px" }}>
                    Nhật ký lịch sử ra vào khoang {display(contract.unitCode)}
                </h4>
            </div>

            <div className="table-scroll">
                <table style={{ width: "100%", fontSize: "13px" }}>
                    <thead>
                        <tr>
                            <th>Mã yêu cầu/phiên</th>
                            <th>Thời gian vào</th>
                            <th>Thời gian ra</th>
                            <th>Thời lượng</th>
                            <th>Mã PIN cấp</th>
                            <th>Trạng thái</th>
                            <th>Mục đích / Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#64748B" }}>
                                    Chưa có lượt vào/ra nào được ghi nhận cho khoang kho này.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const isInside = log.status === "GRANTED" && !log.checkoutAt;
                                const isCheckedOut = log.status === "CHECKED_OUT" || (log.status === "GRANTED" && log.checkoutAt);
                                const isPending = log.status === "PENDING_APPROVAL";
                                const isPinIssued = log.status === "PIN_ISSUED";
                                const isDenied = log.status === "DENIED" || log.status === "REJECTED";

                                return (
                                    <tr key={log.id}>
                                        <td>
                                            <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155" }}>{log.id}</span>
                                        </td>
                                        <td>
                                            <strong>{log.checkinAt ? formatDateTime(log.checkinAt) : (log.expectedAt ? `Dự kiến: ${formatDateTime(log.expectedAt)}` : formatDateTime(log.createdAt))}</strong>
                                        </td>
                                        <td>
                                            {log.checkoutAt ? (
                                                formatDateTime(log.checkoutAt)
                                            ) : isInside ? (
                                                <span style={{ color: "#16A34A", fontWeight: "800" }}>🟢 Đang trong kho</span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>
                                            {log.durationMinutes ? `${log.durationMinutes} phút` : isCheckedOut ? "1 phút" : isInside ? "Đang đếm giờ" : "—"}
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
                                            {isInside ? (
                                                <span className="badge success" style={{ fontSize: "11px", fontWeight: "700" }}>Đang trong kho</span>
                                            ) : isCheckedOut ? (
                                                <span className="badge" style={{ fontSize: "11px", fontWeight: "700", background: "#F1F5F9", color: "#475569" }}>Đã check-out</span>
                                            ) : isPinIssued ? (
                                                <span className="badge" style={{ fontSize: "11px", fontWeight: "700", background: "#E0F2FE", color: "#0369A1" }}>Đã cấp mã PIN</span>
                                            ) : isPending ? (
                                                <span className="badge pending" style={{ fontSize: "11px", fontWeight: "700" }}>Chờ duyệt</span>
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
    );
}
