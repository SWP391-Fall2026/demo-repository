import { useState } from "react";
import { reservationApi } from "../api/reservation.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";

export default function AssignUnitPage() {
    const reservationsQuery = useRemote(reservationApi.list);
    const unitsQuery = useRemote(facilityApi.managedUnits);

    const [busyId, setBusyId] = useState("");
    const [selectedUnits, setSelectedUnits] = useState({});
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const reservations = Array.isArray(reservationsQuery.data)
        ? reservationsQuery.data.filter((r) => r.status === "RESERVED")
        : [];

    const units = Array.isArray(unitsQuery.data) ? unitsQuery.data : [];

    function reloadAll() {
        reservationsQuery.reload();
        unitsQuery.reload();
    }

    async function handleAssign(reservationId, auto = false) {
        setBusyId(reservationId);
        setMessage("");
        setError("");
        try {
            const unitCode = auto ? "" : selectedUnits[reservationId];
            const updated = await reservationApi.assign({
                reservationId,
                unitCode: unitCode || undefined,
            });
            setMessage(`Đã gán thành công kho ${updated.unitCode} cho đơn ${reservationId}.`);
            reloadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không gán được phòng kho.");
        } finally {
            setBusyId("");
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">FACILITY MANAGER · FLOW 5</span>
                    <h1>Gán phòng kho cho đơn đặt (Assign Unit)</h1>
                    <p>
                        Theo dõi danh sách đơn đặt chỗ đã cọc thành công và gán chính xác mã phòng kho (Unit Code) phù hợp tại chi nhánh.
                    </p>
                </div>
                <button className="secondary" onClick={reloadAll}>
                    Làm mới
                </button>
            </header>

            {message && <section className="card notice" role="status"><p>{message}</p></section>}
            {error && <section className="card error" role="alert"><p>{error}</p></section>}

            <section className="card">
                <h2>Danh sách đơn đặt chỗ cần gán phòng ({reservations.length})</h2>
                {reservationsQuery.busy ? (
                    <p>Đang tải danh sách đơn đặt...</p>
                ) : reservations.length === 0 ? (
                    <p>Hiện không có đơn đặt chỗ nào đang chờ gán kho tại cơ sở phụ trách.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Loại kho yêu cầu</th>
                                    <th>Thời hạn</th>
                                    <th>Kho hiện tại</th>
                                    <th>Chọn phòng kho khả dụng</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.map((r) => {
                                    const availableUnits = units.filter(
                                        (u) =>
                                            u.type?.toLowerCase() === r.unitType?.toLowerCase() &&
                                            (u.status?.toLowerCase() === "available" || u.code === r.unitCode)
                                    );
                                    const currentSelected = selectedUnits[r.id] ?? (r.unitCode || "");
                                    const isBusy = busyId === r.id;

                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <strong>{display(r.id)}</strong>
                                                <br />
                                                <small>Cơ sở {display(r.facilityCode)}</small>
                                            </td>
                                            <td>
                                                {display(r.customerName)}
                                                <br />
                                                <small>{display(r.customerPhone || "")}</small>
                                            </td>
                                            <td>
                                                <span className="badge">Loại {display(r.unitType)}</span>
                                            </td>
                                            <td>
                                                {display(r.rentalMonths || r.durationMonths || 1)} tháng
                                                <br />
                                                <small>Từ: {display(r.startDate || "Hôm nay")}</small>
                                            </td>
                                            <td>
                                                {r.unitCode ? (
                                                    <strong style={{ color: "#10b981" }}>{display(r.unitCode)}</strong>
                                                ) : (
                                                    <span style={{ color: "#f59e0b" }}>Chưa gán</span>
                                                )}
                                            </td>
                                            <td>
                                                <select
                                                    value={currentSelected}
                                                    onChange={(e) =>
                                                        setSelectedUnits({ ...selectedUnits, [r.id]: e.target.value })
                                                    }
                                                    disabled={isBusy || availableUnits.length === 0}
                                                >
                                                    <option value="">-- Chọn mã kho trống --</option>
                                                    {availableUnits.map((u) => (
                                                        <option key={u.code} value={u.code}>
                                                            {u.code} ({u.sizeSqm || u.size}m² - {money(u.pricePerMonth)}/tháng)
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableUnits.length === 0 && (
                                                    <small className="error" style={{ display: "block" }}>
                                                        Hết kho trống loại {r.unitType}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAssign(r.id, false)}
                                                        disabled={isBusy || !currentSelected}
                                                    >
                                                        {isBusy ? "Đang lưu..." : "Gán kho"}
                                                    </button>
                                                    {!r.unitCode && (
                                                        <button
                                                            type="button"
                                                            className="secondary"
                                                            onClick={() => handleAssign(r.id, true)}
                                                            disabled={isBusy || availableUnits.length === 0}
                                                        >
                                                            Tự động
                                                        </button>
                                                    )}
                                                </div>
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
