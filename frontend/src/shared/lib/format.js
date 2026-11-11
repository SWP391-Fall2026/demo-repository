export const money = (value) => new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
}).format(Number(value) || 0);

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateTime(value) {
    if (value == null || value === "") return "—";
    if (ISO_DATE_RE.test(String(value))) {
        const [y, m, d] = String(value).split("-");
        return `${d}/${m}/${y}`;
    }
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())} · ${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

export function formatDate(value) {
    if (value == null || value === "") return "—";
    const str = String(value);
    if (ISO_DATE_RE.test(str)) {
        const [y, m, d] = str.split("-");
        return `${d}/${m}/${y}`;
    }
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return str;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

export function display(value) {
    if (value == null || value === "")
        return "—";
    if (typeof value === "boolean")
        return value ? "Có" : "Không";
    if (typeof value === "object")
        return JSON.stringify(value);
    const str = String(value);
    if (ISO_DATETIME_RE.test(str)) {
        return formatDateTime(str);
    }
    if (ISO_DATE_RE.test(str)) {
        return formatDate(str);
    }
    return str;
}

const statusTranslations = {
    ACTIVE: "Đang hoạt động",
    AVAILABLE: "Còn trống",
    OCCUPIED: "Đang thuê",
    RESERVED: "Đang giữ chỗ",
    PENDING: "Chờ xử lý",
    PENDING_APPROVAL: "Chờ duyệt",
    PENDING_CONFIRM: "Chờ khách xác nhận",
    PENDING_CUSTOMER: "Chờ khách xác nhận",
    CUSTOMER_ACCEPTED: "Khách đã xác nhận",
    PIN_ISSUED: "Đã cấp PIN",
    GRANTED: "Đang trong kho",
    CHECKED_OUT: "Đã check-out",
    IN_PROGRESS: "Đang thực hiện",
    COMPLETED: "Đã hoàn thành",
    CONFIRMED: "Đã xác nhận",
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
    TERMINATED: "Đã kết thúc",
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
    return ["PAID", "ACTIVE", "AVAILABLE", "COMPLETED", "RESOLVED", "SUCCESS", "APPROVED", "CONFIRMED", "GRANTED"].includes(v)
        ? "success"
        : ["FAILED", "REJECTED", "CANCELLED", "OVERDUE", "NO_SHOW", "LOCKED", "DISABLED", "TERMINATED"].includes(v)
            ? "danger"
            : "pending";
}
