import { useState } from "react";
import { facilityApi } from "../api/facility.api";

/**
 * Interactive readiness cell for facility unit tables.
 * Handles both Staff ("report") and Manager ("approve") transitions cleanly.
 */
export default function UnitReadinessAction({ row, reload, mode = "approve" }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const unitStatus = String(row.status || "").toLowerCase();
    const readiness = String(row.readinessStatus || "").toUpperCase();
    const needsCleaning = unitStatus === "cleaning" || unitStatus === "maintenance";

    async function handleAction() {
        setBusy(true);
        setErr("");
        try {
            if (mode === "approve") {
                await facilityApi.approveReady({
                    code: row.code,
                    reason: "Quản lý đã kiểm tra và duyệt kho sẵn sàng cho thuê",
                });
            } else {
                await facilityApi.ready({
                    code: row.code,
                    notes: "Nhân viên đã hoàn tất vệ sinh, khử khuẩn và kiểm tra kỹ thuật",
                });
            }
            reload();
        } catch (e) {
            setErr(e?.message || "Thao tác thất bại");
        } finally {
            setBusy(false);
        }
    }

    if (mode === "approve") {
        if (readiness === "PENDING") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                    <button
                        type="button"
                        className="btn-figma btn-primary btn-sm"
                        disabled={busy}
                        onClick={handleAction}
                        style={{ background: "#059669", borderColor: "#059669" }}
                    >
                        {busy ? "Đang duyệt..." : "Duyệt sẵn sàng"}
                    </button>
                    {err && <small style={{ color: "#DC2626", fontSize: "11px" }}>{err}</small>}
                </div>
            );
        }
        if (readiness === "APPROVED") {
            return <span className="badge success">Đã duyệt</span>;
        }
        if (needsCleaning) {
            return <span className="badge pending">Chờ Staff báo vệ sinh</span>;
        }
        return (
            <span style={{ color: "#64748B", fontSize: "12.5px" }} title="Chỉ cần duyệt khi kho ở bước vệ sinh/bảo trì">
                Không cần duyệt
            </span>
        );
    }

    // Staff report mode
    if (readiness === "PENDING") {
        return <span className="badge pending">Chờ Manager duyệt</span>;
    }
    if (readiness === "APPROVED") {
        return <span className="badge success">Đã duyệt</span>;
    }
    if (needsCleaning) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                <button
                    type="button"
                    className="btn-figma btn-primary btn-sm"
                    disabled={busy}
                    onClick={handleAction}
                >
                    {busy ? "Đang gửi..." : "Báo vệ sinh xong"}
                </button>
                {err && <small style={{ color: "#DC2626", fontSize: "11px" }}>{err}</small>}
            </div>
        );
    }
    return <span style={{ color: "#64748B", fontSize: "12.5px" }}>Đang vận hành</span>;
}

