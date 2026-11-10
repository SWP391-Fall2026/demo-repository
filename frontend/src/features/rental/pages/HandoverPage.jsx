import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDate, statusClass, statusLabel } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";

export default function HandoverPage() {
    const { reservationId: routeReservationId = "" } = useParams();
    const [evidence, setEvidence] = useState();
    const { data, error: listError, busy: listBusy, reload } = useRemote(async () => {
        const [contractList, eligibleList] = await Promise.all([
            rentalApi.list().catch(() => []),
            rentalApi.eligibleHandovers(),
        ]);
        return {
            contracts: Array.isArray(contractList) ? contractList : [],
            eligible: Array.isArray(eligibleList) ? eligibleList : [],
        };
    });
    const contracts = Array.isArray(data?.contracts) ? data.contracts : [];
    const eligibleList = Array.isArray(data?.eligible) ? data.eligible : [];
    const pendingPaymentContracts = contracts.filter((row) => String(row.status) === "PENDING_PAYMENT");
    const [selectedId, setSelectedId] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (routeReservationId && eligibleList.some((item) => String(item.reservationId) === routeReservationId)) {
            setSelectedId(routeReservationId);
            return;
        }
        if (eligibleList.length === 1 && !selectedId) {
            setSelectedId(String(eligibleList[0].reservationId));
        }
    }, [routeReservationId, eligibleList]);

    const selectedRow = eligibleList.find((item) => String(item.reservationId) === selectedId);

    async function submit(event) {
        event.preventDefault();
        if (!eligibleList.length || !selectedId) {
            setError("Chưa có hồ sơ đủ điều kiện bàn giao để lập biên bản.");
            return;
        }
        const form = event.currentTarget;
        setBusy(true);
        setError("");
        setDone("");
        const formData = new FormData(form);
        const payload = {};
        formData.forEach((value, key) => {
            if (key !== "evidence")
                payload[key] = value;
        });
        payload.handoverEligibleConfirmed = formData.get("handoverEligibleConfirmed") === "on";
        try {
            await rentalApi.handover(payload, evidence);
            setDone("Đã lập biên bản, chờ khách xác nhận.");
            form.reset();
            setSelectedId("");
            setEvidence(undefined);
            reload();
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không lập được biên bản.");
        }
        finally {
            setBusy(false);
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STORAGE / THỦ TỤC NHẬN KHO</span>
                    <h1>Check-in và bàn giao kho</h1>
                    <p>Staff lập biên bản hiện trạng bàn giao. Customer xem biên bản và ký nhận; hợp đồng chuyển ACTIVE.</p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link className="btn-figma btn-outline btn-sm" to="/facility/tasks/my">
                        Hàng đợi công việc
                    </Link>
                    <button type="button" className="btn-figma btn-outline btn-sm" onClick={reload} disabled={listBusy}>
                        {listBusy ? "Đang tải…" : "Làm mới"}
                    </button>
                </div>
            </header>

            {listError && <section className="card error" role="alert">{listError}</section>}

            <section className="card">
                <h2>Danh sách hợp đồng tại cơ sở</h2>
                {listBusy ? (
                    <p>Đang tải danh sách hợp đồng…</p>
                ) : !contracts.length ? (
                    <p className="empty">Chưa có hợp đồng nào.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã hợp đồng</th>
                                    <th>Khách hàng</th>
                                    <th>Kho</th>
                                    <th>Cơ sở</th>
                                    <th>Ngày nhận kho</th>
                                    <th>Trạng thái hợp đồng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.map((row) => (
                                    <tr key={String(row.id)}>
                                        <td><strong>{display(row.id)}</strong></td>
                                        <td>{display(row.customerName)}</td>
                                        <td><strong>{display(row.unitCode)}</strong></td>
                                        <td>{display(row.facilityCode)}</td>
                                        <td>{formatDate(row.startDate || row.startAt)}</td>
                                        <td><span className={`badge ${statusClass(row.status)}`}>{statusLabel(row.status)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="card">
                <h2>Thao tác nghiệp vụ</h2>
                <form className="form-grid" onSubmit={submit}>
                    <section className="handover-form-section">
                        <h3>A. Reservation và hợp đồng</h3>
                        {listBusy ? (
                            <p>Đang tải danh sách hồ sơ đã thanh toán chờ bàn giao…</p>
                        ) : !eligibleList.length ? (
                            <div style={{ gridColumn: "1 / -1", display: "grid", gap: "12px", padding: "16px 18px", background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "10px" }}>
                                <div>
                                    <strong style={{ color: "#92400E", display: "block", marginBottom: "4px" }}>
                                        Hiện chưa có hồ sơ nào sẵn sàng bàn giao (trạng thái hợp đồng phải là Chờ bàn giao · PENDING_HANDOVER)
                                    </strong>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#78350F" }}>
                                        Một hồ sơ chỉ xuất hiện trong mục <strong>Chọn hồ sơ</strong> sau khi hoàn tất đủ quy trình:
                                        Customer đặt cọc → Staff xác minh CCCD/thẻ hẹn tại <Link to="/facility/tasks/my" style={{ color: "#0066FF", fontWeight: 700 }}>Hàng đợi công việc</Link> → Customer xác nhận điều khoản &amp; thanh toán hóa đơn tiền thuê (<strong>RENT = PAID</strong>).
                                    </p>
                                </div>
                                {pendingPaymentContracts.length > 0 && (
                                    <div style={{ background: "#FFFFFF", border: "1px solid #FDE68A", borderRadius: "8px", padding: "10px 12px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#92400E", marginBottom: "6px" }}>
                                            HỒ SƠ ĐANG CHỜ KHÁCH XÁC NHẬN / THANH TOÁN TIỀN THUÊ ({pendingPaymentContracts.length}):
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155", display: "grid", gap: "4px" }}>
                                            {pendingPaymentContracts.map((c) => (
                                                <li key={String(c.id)}>
                                                    <strong>{display(c.reservationId || c.id)}</strong> · Kho <strong>{display(c.unitCode)}</strong> · Khách: {display(c.customerName)} (hợp đồng {display(c.id)} đang chờ thanh toán tiền thuê)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button type="button" className="btn-figma btn-outline btn-sm" onClick={reload}>
                                        Kiểm tra lại danh sách
                                    </button>
                                    <Link className="btn-figma btn-primary-dark btn-sm" to="/facility/tasks/my">
                                        Đi tới Hàng đợi check-in
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <label>Hồ sơ đã thanh toán, chờ bàn giao
                                    <select name="reservationId" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required>
                                        <option value="">Chọn hồ sơ</option>
                                        {eligibleList.map((row) => (
                                            <option key={String(row.reservationId)} value={String(row.reservationId)}>
                                                {String(row.reservationId)} · {String(row.customerName)} · {String(row.unitCode)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {selectedRow ? (
                                    <div className="handover-context-grid">
                                        <div><small>MÃ RESERVATION</small><strong>{String(selectedRow.reservationId)}</strong></div>
                                        <div><small>MÃ HỢP ĐỒNG</small><strong>{String(selectedRow.contractId)}</strong></div>
                                        <div><small>KHÁCH HÀNG</small><strong>{String(selectedRow.customerName)} · {String(selectedRow.customerPhone)}</strong></div>
                                        <div><small>CƠ SỞ / UNIT</small><strong>{String(selectedRow.facilityName)} · {String(selectedRow.facilityCode)} / {String(selectedRow.unitCode)}</strong></div>
                                        <div><small>THANH TOÁN</small><strong>DEPOSIT {String(selectedRow.depositStatus)} · RENT {String(selectedRow.rentStatus)}</strong></div>
                                        {Boolean(selectedRow.previousIssueNotes) && <div><small>KHÁCH ĐÃ BÁO</small><strong>{String(selectedRow.previousIssueNotes)}</strong></div>}
                                        {Boolean(selectedRow.previousConditionNotes) && <div><small>HIỆN TRẠNG TRƯỚC</small><strong>{String(selectedRow.previousConditionNotes)}</strong></div>}
                                        <input type="hidden" name="unitCode" value={String(selectedRow.unitCode)} />
                                    </div>
                                ) : (
                                    <p>Chọn hồ sơ; thông tin khách, cơ sở và Unit được nạp từ hệ thống.</p>
                                )}
                            </>
                        )}
                    </section>

                    <section className="handover-form-section">
                        <h3>B. Bàn giao thực tế</h3>
                        <label>Tình trạng kho
                            <select name="conditionStatus" defaultValue="CLEAN" disabled={!eligibleList.length}>
                                <option value="CLEAN">Kho sạch sẽ, sử dụng bình thường</option>
                                <option value="ISSUE">Có vấn đề cần ghi nhận</option>
                            </select>
                        </label>
                        <label>Hiện trạng / hư hỏng<textarea name="unitConditionNotes" required disabled={!eligibleList.length} /></label>
                        <label>Ghi chú Staff<textarea name="staffNotes" disabled={!eligibleList.length} /></label>
                        <label>Ảnh hiện trạng<input name="evidence" type="file" accept="image/png,image/jpeg" disabled={!eligibleList.length} onChange={(event) => setEvidence(event.target.files?.[0])} /></label>
                        <label className="check-row"><input name="handoverEligibleConfirmed" type="checkbox" required disabled={!eligibleList.length} /> Đã xác nhận khách đủ điều kiện nhận bàn giao</label>
                    </section>

                    <div className="form-actions">
                        {error && <p className="error" role="alert">{error}</p>}
                        {done && <p className="notice" role="status">{done}</p>}
                        <button className="btn-figma btn-primary-dark" disabled={busy || !eligibleList.length || !selectedId}>
                            {busy ? "Đang lập biên bản…" : "Lập biên bản bàn giao"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
