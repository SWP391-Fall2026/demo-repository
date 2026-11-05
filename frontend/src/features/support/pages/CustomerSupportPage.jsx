import { useEffect, useState } from "react";
import { supportApi } from "../api/support.api";
import { rentalApi } from "../../rental/api/rental.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";

export default function CustomerSupportPage() {
    const ticketsRemote = useRemote(supportApi.list);
    const contractsRemote = useRemote(rentalApi.list);

    const [unitCode, setUnitCode] = useState("");
    const [category, setCategory] = useState("ACCESS");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [priority, setPriority] = useState("NORMAL");

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Rating modal state for closing resolved ticket
    const [closingTicketId, setClosingTicketId] = useState(null);
    const [rating, setRating] = useState(5);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    const tickets = Array.isArray(ticketsRemote.data) ? ticketsRemote.data : [];
    const contracts = Array.isArray(contractsRemote.data) ? contractsRemote.data : [];
    const activeContracts = contracts.filter((c) =>
        ["ACTIVE", "EXPIRING_SOON", "OVERDUE"].includes(String(c.status).toUpperCase())
    );

    // Auto-select first contract unitCode if available
    useEffect(() => {
        if (!unitCode && activeContracts.length > 0) {
            setUnitCode(activeContracts[0].unitCode || "");
        }
    }, [activeContracts.length]);

    async function handleCreate(e) {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setErrorMessage("Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố.");
            return;
        }

        setSubmitting(true);
        setMessage("");
        setErrorMessage("");

        try {
            await supportApi.create({
                unitCode: unitCode.trim(),
                category,
                title: title.trim(),
                description: description.trim(),
                priority,
                attachmentUrl: attachmentUrl.trim() || undefined,
            });
            setMessage("Đã gửi yêu cầu hỗ trợ thành công. Đội ngũ kỹ thuật sẽ tiếp nhận và xử lý sớm nhất.");
            setTitle("");
            setDescription("");
            setAttachmentUrl("");
            ticketsRemote.reload();
        } catch (cause) {
            setErrorMessage(cause instanceof Error ? cause.message : "Không gửi được yêu cầu hỗ trợ.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCloseTicket(ticketId) {
        setRatingSubmitting(true);
        try {
            await supportApi.progress({
                id: ticketId,
                status: "CLOSED",
                rating,
            });
            setClosingTicketId(null);
            setMessage("Cảm ơn bạn đã đánh giá chất lượng phục vụ và đóng phiếu hỗ trợ!");
            ticketsRemote.reload();
        } catch (cause) {
            setErrorMessage(cause instanceof Error ? cause.message : "Không đóng được phiếu.");
        } finally {
            setRatingSubmitting(false);
        }
    }

    const counts = {
        ALL: tickets.length,
        OPEN: tickets.filter((t) => t.status === "OPEN").length,
        IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        RESOLVED: tickets.filter((t) => t.status === "RESOLVED").length,
        CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
    };

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">KHÁCH HÀNG · HỖ TRỢ</span>
                    <h1>Yêu cầu hỗ trợ & Báo cáo sự cố</h1>
                    <p>Tiếp nhận xử lý kẹt cửa kho, quên mã PIN, kiểm tra nhiệt độ hoặc sự cố cơ sở vật chất 24/7.</p>
                </div>
                <button className="secondary" onClick={() => { ticketsRemote.reload(); contractsRemote.reload(); }}>
                    Làm mới
                </button>
            </header>

            {message && <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>{message}</div>}
            {errorMessage && <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>{errorMessage}</div>}

            {/* Quick KPI stats */}
            <section className="summary-grid" style={{ marginBottom: "28px" }}>
                <article className="card">
                    <span>Tổng yêu cầu</span>
                    <strong>{counts.ALL}</strong>
                </article>
                <article className="card">
                    <span>Chờ tiếp nhận</span>
                    <strong style={{ color: "var(--color-brand-blue)" }}>{counts.OPEN}</strong>
                </article>
                <article className="card">
                    <span>Đang xử lý</span>
                    <strong style={{ color: "var(--color-accent-amber)" }}>{counts.IN_PROGRESS}</strong>
                </article>
                <article className="card">
                    <span>Đã giải quyết</span>
                    <strong style={{ color: "var(--color-accent-green)" }}>{counts.RESOLVED}</strong>
                </article>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "28px", alignItems: "start" }}>
                {/* Form tạo ticket */}
                <section className="card">
                    <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Gửi phiếu hỗ trợ mới</h2>
                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                Kho lưu trữ liên quan
                            </label>
                            {activeContracts.length > 0 ? (
                                <select
                                    className="input-with-icon"
                                    style={{ paddingLeft: "14px" }}
                                    value={unitCode}
                                    onChange={(e) => setUnitCode(e.target.value)}
                                    required
                                >
                                    {activeContracts.map((c) => (
                                        <option key={String(c.id)} value={c.unitCode}>
                                            Kho {c.unitCode} ({c.facilityCode}) · Hợp đồng {c.id}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="input-with-icon"
                                    style={{ paddingLeft: "14px" }}
                                    placeholder="Nhập mã kho (vd: HN-CG-001)"
                                    value={unitCode}
                                    onChange={(e) => setUnitCode(e.target.value)}
                                    required
                                />
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                    Phân loại sự cố
                                </label>
                                <select
                                    className="input-with-icon"
                                    style={{ paddingLeft: "14px" }}
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="ACCESS">Kẹt cửa / Quên mã PIN / Khóa</option>
                                    <option value="DAMAGE">Hư hỏng kho / Ẩm mốc / Thiết bị</option>
                                    <option value="PAYMENT">Hóa đơn / Tiền cọc / Phí</option>
                                    <option value="OTHER">Yêu cầu hỗ trợ khác</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                    Mức độ ưu tiên
                                </label>
                                <select
                                    className="input-with-icon"
                                    style={{ paddingLeft: "14px" }}
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                >
                                    <option value="NORMAL">Bình thường</option>
                                    <option value="HIGH">Ưu tiên cao</option>
                                    <option value="URGENT">Khẩn cấp</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                Tiêu đề sự cố
                            </label>
                            <input
                                className="input-with-icon"
                                style={{ paddingLeft: "14px" }}
                                placeholder="Tóm tắt ngắn gọn vấn đề gặp phải"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                Mô tả chi tiết
                            </label>
                            <textarea
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "10px",
                                    border: "1.5px solid #E2E8F0",
                                    fontSize: "13.5px",
                                    fontFamily: "inherit",
                                }}
                                placeholder="Mô tả cụ thể thời gian, hiện tượng gặp phải để nhân viên xử lý nhanh nhất..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                                Link ảnh / Bằng chứng minh họa (không bắt buộc)
                            </label>
                            <input
                                className="input-with-icon"
                                style={{ paddingLeft: "14px" }}
                                placeholder="https://example.com/photo.jpg"
                                value={attachmentUrl}
                                onChange={(e) => setAttachmentUrl(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-figma btn-primary-dark"
                            style={{ width: "100%", marginTop: "6px" }}
                            disabled={submitting}
                        >
                            {submitting ? "Đang gửi phiếu…" : "Gửi yêu cầu hỗ trợ →"}
                        </button>
                    </form>
                </section>

                {/* Danh sách ticket của tôi */}
                <section className="card">
                    <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
                        Danh sách phiếu đã gửi ({tickets.length})
                    </h2>

                    {ticketsRemote.busy ? (
                        <p>Đang tải danh sách yêu cầu…</p>
                    ) : !tickets.length ? (
                        <div className="empty" style={{ padding: "36px 20px" }}>
                            <span className="empty-icon">🎧</span>
                            <h3>Bạn chưa gửi yêu cầu hỗ trợ nào</h3>
                            <p>Khi gặp bất kỳ sự cố nào về phòng kho hoặc thanh toán, hãy gửi phiếu bên cạnh để được hỗ trợ kịp thời.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {tickets.map((t) => {
                                const status = String(t.status || "").toUpperCase();
                                return (
                                    <div
                                        key={String(t.id)}
                                        style={{
                                            border: "1px solid #E2E8F0",
                                            borderRadius: "12px",
                                            padding: "16px 18px",
                                            background: status === "RESOLVED" ? "#F0FDF4" : "#FFFFFF",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                    <strong style={{ fontSize: "15px", color: "#0F172A" }}>{display(t.title)}</strong>
                                                    <span className={`badge ${
                                                        status === "RESOLVED" ? "badge-success" :
                                                        status === "IN_PROGRESS" ? "badge-pending" :
                                                        status === "CLOSED" ? "badge-neutral" : "badge"
                                                    }`}>
                                                        {status === "OPEN" ? "Chờ xử lý" :
                                                         status === "IN_PROGRESS" ? "Đang xử lý" :
                                                         status === "RESOLVED" ? "Đã khắc phục" : "Đã đóng"}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                                                    Mã phiếu: <strong>{display(t.id)}</strong> · Kho: <strong>{display(t.unitCode)}</strong> · Cơ sở: <strong>{display(t.facilityCode)}</strong>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                                                {display(t.createdAt)}
                                            </span>
                                        </div>

                                        <p style={{ margin: "10px 0 8px", fontSize: "13.5px", color: "#334155", lineHeight: "1.5" }}>
                                            {display(t.description)}
                                        </p>

                                        {t.attachmentUrl && (
                                            <div style={{ margin: "8px 0" }}>
                                                <a href={t.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12.5px", color: "#0066FF" }}>
                                                    🔗 Xem ảnh đính kèm
                                                </a>
                                            </div>
                                        )}

                                        {t.notes && (
                                            <div style={{ background: "#F8FAFC", borderLeft: "3px solid #0066FF", padding: "8px 12px", margin: "10px 0 6px", borderRadius: "0 8px 8px 0", fontSize: "13px" }}>
                                                <strong>Phản hồi từ nhân viên:</strong> {display(t.notes)}
                                            </div>
                                        )}

                                        {t.rating && (
                                            <div style={{ fontSize: "13px", color: "#D97706", marginTop: "6px" }}>
                                                Đánh giá của bạn: {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)} ({t.rating}/5 sao)
                                            </div>
                                        )}

                                        {status === "RESOLVED" && (
                                            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #CBD5E1" }}>
                                                {closingTicketId === t.id ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: 700 }}>Đánh giá chất lượng phục vụ:</span>
                                                        <select
                                                            value={rating}
                                                            onChange={(e) => setRating(Number(e.target.value))}
                                                            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1" }}
                                                        >
                                                            <option value={5}>⭐⭐⭐⭐⭐ Xuất sắc (5 sao)</option>
                                                            <option value={4}>⭐⭐⭐⭐ Rất tốt (4 sao)</option>
                                                            <option value={3}>⭐⭐⭐ Bình thường (3 sao)</option>
                                                            <option value={2}>⭐⭐ Chưa hài lòng (2 sao)</option>
                                                            <option value={1}>⭐ Kém (1 sao)</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            className="btn-figma btn-primary-dark btn-sm"
                                                            onClick={() => handleCloseTicket(t.id)}
                                                            disabled={ratingSubmitting}
                                                        >
                                                            {ratingSubmitting ? "Đang lưu…" : "Xác nhận đóng phiếu"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="secondary"
                                                            style={{ fontSize: "12px", padding: "4px 8px" }}
                                                            onClick={() => setClosingTicketId(null)}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn-figma btn-primary-dark btn-sm"
                                                        onClick={() => setClosingTicketId(t.id)}
                                                    >
                                                        ✓ Sự cố đã xong: Đóng phiếu & Đánh giá sao
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
