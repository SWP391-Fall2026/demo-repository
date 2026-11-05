export const money = (value) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
}).format(Number(value) || 0);

export function display(value) {
    if (value == null || value === "")
        return "—";
    if (typeof value === "boolean")
        return value ? "Có" : "Không";
    if (typeof value === "object")
        return JSON.stringify(value);
    return String(value);
}

const statusTranslations = {
    ACTIVE: "Đang hoạt động",
    AVAILABLE: "Còn trống",
    OCCUPIED: "Đang thuê",
    RESERVED: "Đang giữ chỗ",
    PENDING: "Chờ xử lý",
    IN_PROGRESS: "Đang thực hiện",
    COMPLETED: "Đã hoàn thành",
    RESOLVED: "Đã giải quyết",
    CANCELLED: "Đã hủy",
    REJECTED: "Đã từ chối",
    APPROVED: "Đã duyệt",
    PAID: "Đã thanh toán",
    UNPAID: "Chưa thanh toán",
    OPEN: "Chờ tiếp nhận",
    OVERDUE: "Quá hạn",
    CLOSED: "Đã đóng",
    LOCKED: "Tạm khóa",
    DISABLED: "Vô hiệu hóa",
    SUCCESS: "Thành công",
    FAILED: "Thất bại",
    MAINTENANCE: "Bảo trì",
    CLEANING: "Đang vệ sinh",
    NO_SHOW: "Vắng mặt (No-show)",
    CHECKOUT_REQUESTED: "Yêu cầu trả kho",
    EXPIRING_SOON: "Sắp hết hạn",
    PENDING_HANDOVER: "Chờ bàn giao",
    PENDING_MANAGER: "Chờ Manager duyệt",
    OFFERED: "Đã gửi đề xuất",
    EVIDENCE_SUBMITTED: "Đã nộp bằng chứng",
};

export function statusLabel(value) {
    if (value == null || value === "") return "—";
    const key = String(value).trim().toUpperCase();
    return statusTranslations[key] || display(value);
}

export function statusClass(value) {
    const v = String(value).toUpperCase();
    return ["PAID", "ACTIVE", "AVAILABLE", "COMPLETED", "RESOLVED", "SUCCESS", "APPROVED"].includes(v)
        ? "success"
        : ["FAILED", "REJECTED", "CANCELLED", "OVERDUE", "NO_SHOW", "LOCKED", "DISABLED"].includes(v)
            ? "danger"
            : "pending";
}
