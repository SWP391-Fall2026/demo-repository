import { useState } from "react";
import { supportApi } from "../api/support.api";
import { useRemote } from "../../../shared/api/use-remote";
import { display, sortByNewest } from "../../../shared/lib/format";

export default function IncidentDeskPage() {
    const ticketsRemote = useRemote(supportApi.list);
    const tickets = sortByNewest(ticketsRemote.data);

    const [resolvingTicketId, setResolvingTicketId] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [actionBusy, setActionBusy] = useState(false);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const counts = {
        ALL: tickets.length,
        OPEN: tickets.filter((t) => t.status === "OPEN").length,
        IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        RESOLVED: tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length,
    };

    const filteredTickets = statusFilter === "ALL"
        ? tickets
        : statusFilter === "RESOLVED"
        ? tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status))
        : tickets.filter((t) => t.status === statusFilter);

    async function handleTakeTask(ticket) {
        setActionBusy(true);
        setActionMessage("");
        setActionError("");
        try {
            await supportApi.progress({
                id: ticket.id,
                status: "IN_PROGRESS",
                notes: "Nhân viên đã tiếp nhận và đang tiến hành kiểm tra xử lý.",
            });
            setActionMessage(`Đã tiếp nhận phiếu ${ticket.id}. Vui lòng kiểm tra hiện trường.`);
            ticketsRemote.reload();
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : "Không thể tiếp nhận phiếu.");
        } finally {
            setActionBusy(false);
        }
    }

    async function handleResolve(ticketId) {
        if (!resolutionNotes.trim()) {
            setActionError("Vui lòng nhập ghi chú kết quả xử lý trước khi hoàn tất.");
            return;
        }

        setActionBusy(true);
        setActionMessage("");
        setActionError("");
        try {
            await supportApi.progress({
                id: ticketId,
                status: "RESOLVED",
                notes: resolutionNotes.trim(),
            });
            setActionMessage(`Đã cập nhật phiếu ${ticketId} thành Đã giải quyết.`);
            setResolvingTicketId(null);
            setResolutionNotes("");
            ticketsRemote.reload();
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : "Không thể cập nhật phiếu.");
        } finally {
            setActionBusy(false);
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STAFF / CƠ SỞ · SỰ CỐ</span>
                    <h1>Tiếp nhận & Xử lý sự cố cơ sở</h1>
                    <p>Hàng đợi các phiếu yêu cầu trợ giúp kỹ thuật, kẹt cửa, mã PIN và hư hại khoang kho tại chi nhánh.</p>
                </div>
                <button className="secondary" onClick={ticketsRemote.reload}>
                    Làm mới
                </button>
            </header>

            {actionMessage && <div className="alert-banner alert-success" style={{ marginBottom: "20px" }}>{actionMessage}</div>}
            {actionError && <div className="alert-banner alert-error" style={{ marginBottom: "20px" }}>{actionError}</div>}

            {/* KPI Summary Grid */}
            <section className="summary-grid" style={{ marginBottom: "28px" }}>
                <article className="card">
                    <span>Tổng số sự cố</span>
                    <strong>{counts.ALL}</strong>
                </article>
                <article className="card">
                    <span>Mới phát sinh (Chờ nhận)</span>
                    <strong style={{ color: "var(--color-brand-blue)" }}>{counts.OPEN}</strong>
                </article>
                <article className="card">
                    <span>Đang xử lý tại chỗ</span>
                    <strong style={{ color: "var(--color-accent-amber)" }}>{counts.IN_PROGRESS}</strong>
                </article>
                <article className="card">
                    <span>Đã xử lý xong</span>
                    <strong style={{ color: "var(--color-accent-green)" }}>{counts.RESOLVED}</strong>
                </article>
            </section>

            {/* Incident Table Card */}
            <section className="card">
                <div className="table-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                        Hàng đợi sự cố tại cơ sở <span className="count">{filteredTickets.length}</span>
                    </h2>
                    <div className="segmented" role="group" aria-label="Lọc trạng thái">
                        {[
                            ["ALL", "Tất cả"],
                            ["OPEN", "Chờ nhận"],
                            ["IN_PROGRESS", "Đang xử lý"],
                            ["RESOLVED", "Đã xử lý"],
                        ].map(([key, label]) => (
                            <button
                                type="button"
                                key={key}
                                className={statusFilter === key ? "selected" : ""}
                                onClick={() => setStatusFilter(key)}
                            >
                                {label} ({counts[key]})
                            </button>
                        ))}
                    </div>
                </div>

                {ticketsRemote.busy ? (
                    <p>Đang tải danh sách sự cố…</p>
                ) : !filteredTickets.length ? (
                    <div className="empty" style={{ padding: "40px 20px" }}>
                        <span className="empty-icon">✓</span>
                        <h3>Không có sự cố nào trong mục này</h3>
                        <p>Tất cả các khoang kho tại cơ sở đang hoạt động ổn định và an toàn.</p>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Khách hàng</th>
                                    <th>Khoang kho</th>
                                    <th>Tiêu đề & Nội dung</th>
                                    <th>Mức ưu tiên</th>
                                    <th>Trạng thái</th>
                                    <th>Thời gian</th>
                                    <th>Thao tác xử lý</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map((t) => {
                                    const status = String(t.status || "").toUpperCase();
                                    return (
                                        <tr key={String(t.id)}>
                                            <td>
                                                <strong style={{ fontSize: "13px" }}>{display(t.id)}</strong>
                                                <br />
                                                <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>
                                                    {display(t.category)}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{display(t.customerName)}</strong>
                                                <br />
                                                <small style={{ color: "#64748B" }}>Mã KH: {display(t.userId)}</small>
                                            </td>
                                            <td>
                                                <span className="badge badge-pending">
                                                    {display(t.unitCode || "Cơ sở")}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: "260px" }}>
                                                <strong>{display(t.title)}</strong>
                                                <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B", lineHeight: "1.4" }}>
                                                    {display(t.description)}
                                                </p>
                                                {t.attachmentUrl && (
                                                    <a href={t.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11.5px", color: "#0066FF" }}>
                                                        🔗 Ảnh minh họa
                                                    </a>
                                                )}
                                                {t.notes && (
                                                    <div style={{ marginTop: "4px", fontSize: "12px", color: "#059669" }}>
                                                        ✓ Ghi chú: {display(t.notes)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    t.priority === "URGENT" ? "badge-danger" :
                                                    t.priority === "HIGH" ? "badge-pending" : "badge-neutral"
                                                }`}>
                                                    {t.priority === "URGENT" ? "Khẩn cấp" :
                                                     t.priority === "HIGH" ? "Ưu tiên cao" : "Bình thường"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    status === "RESOLVED" ? "badge-success" :
                                                    status === "IN_PROGRESS" ? "badge-pending" :
                                                    status === "CLOSED" ? "badge-neutral" : "badge"
                                                }`}>
                                                    {status === "OPEN" ? "Chờ xử lý" :
                                                     status === "IN_PROGRESS" ? "Đang xử lý" :
                                                     status === "RESOLVED" ? "Đã giải quyết" : "Đã đóng"}
                                                </span>
                                                {t.rating && (
                                                    <div style={{ fontSize: "11px", color: "#D97706", marginTop: "2px" }}>
                                                        {"★".repeat(t.rating)} ({t.rating}★)
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <small style={{ color: "#64748B" }}>{display(t.createdAt)}</small>
                                            </td>
                                            <td>
                                                {status === "OPEN" && (
                                                    <button
                                                        type="button"
                                                        className="btn-figma btn-primary-dark btn-sm"
                                                        onClick={() => handleTakeTask(t)}
                                                        disabled={actionBusy}
                                                    >
                                                        Tiếp nhận xử lý
                                                    </button>
                                                )}

                                                {status === "IN_PROGRESS" && (
                                                    <div>
                                                        {resolvingTicketId === t.id ? (
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "220px" }}>
                                                                <textarea
                                                                    rows={2}
                                                                    placeholder="Ghi chú cách thức đã khắc phục..."
                                                                    value={resolutionNotes}
                                                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                                                    style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #CBD5E1" }}
                                                                />
                                                                <div style={{ display: "flex", gap: "6px" }}>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-figma btn-primary-dark btn-sm"
                                                                        onClick={() => handleResolve(t.id)}
                                                                        disabled={actionBusy}
                                                                    >
                                                                        Xác nhận xong
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="secondary"
                                                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                                                        onClick={() => setResolvingTicketId(null)}
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn-figma btn-primary-dark btn-sm"
                                                                onClick={() => { setResolvingTicketId(t.id); setResolutionNotes(""); }}
                                                                disabled={actionBusy}
                                                            >
                                                                ✓ Hoàn tất xử lý
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {["RESOLVED", "CLOSED"].includes(status) && (
                                                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>
                                                        ✓ Đã hoàn tất
                                                    </span>
                                                )}
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
