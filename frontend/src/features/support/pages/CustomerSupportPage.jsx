import { useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { supportApi } from "../api/support.api";
import { rentalApi } from "../../rental/api/rental.api";
import { display, statusClass } from "../../../shared/lib/format";

export default function CustomerSupportPage() {
    const { data, error, busy, reload } = useRemote(supportApi.list);
    const rentals = useRemote(rentalApi.list);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");
    const [fileBusy, setFileBusy] = useState(false);

    // Form fields
    const [unitCode, setUnitCode] = useState("");
    const [category, setCategory] = useState("DAMAGE");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");

    // Review Modal
    const [closingTicketId, setClosingTicketId] = useState(null);
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState("");

    const tickets = Array.isArray(data) ? data : [];

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileBusy(true);
        setMsg("");
        try {
            const res = await supportApi.uploadAttachment(file);
            setAttachmentUrl(res.attachmentUrl);
            setMsg("Đã tải ảnh đính kèm thành công.");
        } catch (err) {
            setMsg(err instanceof Error ? err.message : "Không tải được ảnh.");
        } finally {
            setFileBusy(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setMsg("");
        try {
            await supportApi.create({
                unitCode,
                category,
                title,
                description,
                attachmentUrl: attachmentUrl || undefined,
            });
            setMsg("Đã gửi yêu cầu hỗ trợ thành công!");
            setTitle("");
            setDescription("");
            setAttachmentUrl("");
            reload();
        } catch (err) {
            setMsg(err instanceof Error ? err.message : "Gửi yêu cầu thất bại.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCloseWithRating(e) {
        e.preventDefault();
        if (!closingTicketId) return;
        try {
            await supportApi.closeTicket(closingTicketId, rating, feedback);
            setMsg("Đã đóng yêu cầu và gửi đánh giá thành công!");
            setClosingTicketId(null);
            setFeedback("");
            reload();
        } catch (err) {
            setMsg(err instanceof Error ? err.message : "Đóng yêu cầu thất bại.");
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">CUSTOMER · HỖ TRỢ</span>
                    <h1>Yêu cầu hỗ trợ & Báo cáo sự cố</h1>
                    <p>Gửi khiếu nại, báo hỏng kho, đính kèm ảnh hiện trạng và đánh giá chất lượng xử lý.</p>
                </div>
                <button className="secondary" onClick={reload}>Làm mới</button>
            </header>

            {msg && <section className={msg.includes("thất bại") || msg.includes("Không") ? "card error" : "card notice"} role="status">{msg}</section>}
            {error && <section className="card error" role="alert">{error}</section>}

            <section className="card action-card">
                <h2>Tạo yêu cầu hỗ trợ mới (Kèm ảnh minh chứng)</h2>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px", maxWidth: "600px" }}>
                    <div>
                        <label>Mã kho cần hỗ trợ: *</label>
                        <select required value={unitCode} onChange={e => setUnitCode(e.target.value)}>
                            <option value="">Chọn kho đang thuê</option>
                            {(Array.isArray(rentals.data) ? rentals.data : []).filter(c => ["ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"].includes(String(c.status))).map(c => (
                                <option key={c.id} value={c.unitCode}>{c.unitCode} · {c.status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Phân loại sự cố: *</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="DAMAGE">Hư hỏng kho / Ổ khóa</option>
                            <option value="ACCESS">Không mở được cửa / Lỗi PIN</option>
                            <option value="PAYMENT">Thắc mắc cước phí / Hóa đơn</option>
                            <option value="OTHER">Vấn đề khác</option>
                        </select>
                    </div>
                    <div>
                        <label>Tiêu đề tóm tắt: *</label>
                        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề yêu cầu..." />
                    </div>
                    <div>
                        <label>Mô tả chi tiết: *</label>
                        <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Mô tả cụ thể sự cố gặp phải..." />
                    </div>
                    <div>
                        <label>Đính kèm ảnh hiện trạng sự cố (PNG / JPG):</label>
                        <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={fileBusy} />
                        {fileBusy && <small>Đang tải ảnh lên...</small>}
                        {attachmentUrl && (
                            <div style={{ marginTop: "6px" }}>
                                <small style={{ color: "green" }}>✓ Ảnh đính kèm: {attachmentUrl}</small>
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={submitting || fileBusy}>
                        {submitting ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
                    </button>
                </form>
            </section>

            {closingTicketId && (
                <section className="card" style={{ borderColor: "#2563eb", background: "#f8fafc" }}>
                    <h3>Đánh giá chất lượng xử lý sự cố ({closingTicketId})</h3>
                    <form onSubmit={handleCloseWithRating} style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
                        <div>
                            <label>Mức độ hài lòng (1 - 5 sao): </label>
                            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
                                <option value={5}>⭐⭐⭐⭐⭐ 5 sao - Rất hài lòng</option>
                                <option value={4}>⭐⭐⭐⭐ 4 sao - Hài lòng</option>
                                <option value={3}>⭐⭐⭐ 3 sao - Bình thường</option>
                                <option value={2}>⭐⭐ 2 sao - Chưa tốt</option>
                                <option value={1}>⭐ 1 sao - Rất kém</option>
                            </select>
                        </div>
                        <div>
                            <label>Nhận xét bổ sung:</label>
                            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Ý kiến phản hồi của bạn..." />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button type="submit">Xác nhận đóng & Đánh giá</button>
                            <button type="button" className="ghost" onClick={() => setClosingTicketId(null)}>Hủy</button>
                        </div>
                    </form>
                </section>
            )}

            <section className="card">
                <h2>Lịch sử yêu cầu hỗ trợ của bạn ({tickets.length})</h2>
                {busy ? <p>Đang tải danh sách...</p> : !tickets.length ? <p>Bạn chưa có yêu cầu hỗ trợ nào.</p> : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Kho</th>
                                    <th>Phân loại</th>
                                    <th>Tiêu đề</th>
                                    <th>Ảnh hiện trạng</th>
                                    <th>Trạng thái</th>
                                    <th>Phản hồi / Ghi chú</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td><strong>{t.id}</strong></td>
                                        <td>{t.unitCode}</td>
                                        <td>{display(t.category)}</td>
                                        <td>{t.title}</td>
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
                                            {t.notes || "Chưa có phản hồi"}
                                            {t.rating && <div><small>Đánh giá: {t.rating} ⭐</small></div>}
                                        </td>
                                        <td>
                                            {t.status === "RESOLVED" && (
                                                <button className="secondary" onClick={() => setClosingTicketId(t.id)}>
                                                    Đóng & Đánh giá
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
