import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { supportApi } from "../api/support.api";
import { display, statusClass } from "../../../shared/lib/format";

export default function IncidentDeskPage() {
    const { data, error, busy, reload } = useRemote(supportApi.list);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [status, setStatus] = useState("IN_PROGRESS");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");

    const tickets = Array.isArray(data) ? data : [];

    async function handleUpdate(e) {
        e.preventDefault();
        if (!selectedTicket) return;
        setSubmitting(true);
        setMsg("");
        try {
            await supportApi.progress({
                id: selectedTicket.id,
                status,
                notes,
            });
            setMsg("Đã cập nhật xử lý sự cố thành công!");
            setSelectedTicket(null);
            setNotes("");
            reload();
        } catch (err) {
            setMsg(err instanceof Error ? err.message : "Cập nhật thất bại.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STAFF · ON-SITE INCIDENT DESK</span>
                    <h1>Tiếp nhận & Xử lý sự cố tại quầy</h1>
                    <p>Theo dõi ticket sự cố, xem ảnh hiện trạng hư hỏng và cập nhật tiến độ giải quyết.</p>
                </div>
                <button className="secondary" onClick={reload}>Làm mới</button>
            </header>

            {msg && <section className={msg.includes("thất bại") ? "card error" : "card notice"} role="status">{msg}</section>}
            {error && <section className="card error" role="alert">{error}</section>}

            {selectedTicket && (
                <section className="card action-card">
                    <h2>Cập nhật xử lý sự cố: {selectedTicket.id}</h2>
                    <form onSubmit={handleUpdate} style={{ display: "grid", gap: "12px", maxWidth: "600px" }}>
                        <div>
                            <strong>Khách hàng:</strong> {selectedTicket.customerName} · <strong>Kho:</strong> {selectedTicket.unitCode}
                        </div>
                        <div>
                            <strong>Nội dung:</strong> {selectedTicket.title} - {selectedTicket.description}
                        </div>
                        {selectedTicket.attachmentUrl && (
                            <div>
                                <strong>Ảnh hiện trạng khách gửi:</strong>{" "}
                                <button type="button" className="link-button" onClick={() => supportApi.openAttachment(selectedTicket.attachmentUrl).catch(err => setMsg(err.message))}>
                                    📷 Bấm vào để xem ảnh
                                </button>
                            </div>
                        )}
                        <div>
                            <label>Tiến độ xử lý: *</label>
                            <select value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                                <option value="RESOLVED">Đã giải quyết xong (RESOLVED)</option>
                            </select>
                        </div>
                        <div>
                            <label>Ghi chú hướng xử lý / kết quả khắc phục: *</label>
                            <textarea required rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập biện pháp khắc phục sự cố..." />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button type="submit" disabled={submitting}>
                                {submitting ? "Đang lưu..." : "Lưu cập nhật"}
                            </button>
                            <button type="button" className="ghost" onClick={() => setSelectedTicket(null)}>
                                Hủy
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="card">
                <h2>Danh sách sự cố cần giải quyết ({tickets.length})</h2>
                {busy ? <p>Đang tải dữ liệu...</p> : !tickets.length ? <p>Hiện không có sự cố nào cần xử lý.</p> : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Khách hàng</th>
                                    <th>Kho</th>
                                    <th>Phân loại</th>
                                    <th>Tiêu đề / Nội dung</th>
                                    <th>Ảnh hiện trạng</th>
                                    <th>Trạng thái</th>
                                    <th>Ghi chú xử lý</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.id}</strong></td>
                                        <td>{display(t.customerName)}</td>
                                        <td>{display(t.unitCode)}</td>
                                        <td>{display(t.category)}</td>
                                        <td>
                                            <strong>{t.title}</strong>
                                            <div><small>{t.description}</small></div>
                                        </td>
                                        <td>
                                            {t.attachmentUrl ? (
                                                <button type="button" className="link-button" onClick={() => supportApi.openAttachment(t.attachmentUrl).catch(err => setMsg(err.message))}>
                                                    📷 Xem ảnh
                                                </button>
                                            ) : "—"}
                                        </td>
                                        <td>
                                            <span className={"badge " + statusClass(t.status)}>{t.status}</span>
                                        </td>
                                        <td>
                                            {t.notes || "Chưa có"}
                                            {t.rating && <div><small>Đánh giá khách: {t.rating} ⭐</small></div>}
                                        </td>
                                        <td>
                                            {["OPEN", "IN_PROGRESS"].includes(t.status) && (
                                                <button className="secondary" onClick={() => { setSelectedTicket(t); setNotes(t.notes || ""); }}>
                                                    Xử lý
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
