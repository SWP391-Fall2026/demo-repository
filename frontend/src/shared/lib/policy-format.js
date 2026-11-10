import { money } from "./format";

const UNIT_NAMES = {
    S: "Nhỏ (S)",
    M: "Vừa (M)",
    L: "Lớn (L)",
    CLIMATE: "Kiểm soát nhiệt",
};

const DEPOSIT_RULE_LABELS = {
    "1_MONTH": "Tương đương 1 tháng tiền thuê",
};

const STATIC_POLICY_LABELS = {
    "discount.3": "Chiết khấu kỳ hạn 3 tháng",
    "discount.6": "Chiết khấu kỳ hạn 6 tháng",
    "discount.12": "Chiết khấu kỳ hạn 12 tháng",
    "price.S": "Giá chuẩn kho loại S (nhỏ)",
    "price.M": "Giá chuẩn kho loại M (vừa)",
    "price.L": "Giá chuẩn kho loại L (lớn)",
    "price.CLIMATE": "Giá chuẩn kho kiểm soát nhiệt (CLIMATE)",
    basePrices: "Bảng giá thuê chuẩn theo loại kho",
    depositMonths: "Số tháng tiền cọc đảm bảo",
    depositRule: "Quy tắc đặt cọc",
    durationDiscounts: "Bảng chiết khấu theo kỳ hạn thuê",
    reservationHoldDays: "Thời gian giữ chỗ sau khi đặt cọc",
    refundCancelHours: "Thời hạn báo hủy trước để hoàn cọc",
    renewalMaxMonths: "Kỳ hạn gia hạn hợp đồng tối đa",
    gracePeriodDays: "Số ngày ân hạn trước khi tính phí quá hạn",
    cleaningFee: "Phí vệ sinh buồng kho",
    overdueDailyFee: "Phí phạt quá hạn mỗi ngày",
    newLockFee: "Phí cấp mã khóa / thay khóa mới",
    extraFees: "Biểu phụ phí phát sinh",
    generalRules: "Quy định vận hành & an toàn chung",
};

function parseJsonSafe(raw) {
    if (typeof raw !== "string") return raw;
    const trimmed = raw.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[") && !trimmed.startsWith('"')) {
        return trimmed;
    }
    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
}

export function policyLabel(key) {
    if (STATIC_POLICY_LABELS[key]) return STATIC_POLICY_LABELS[key];
    if (key.startsWith("cap.")) {
        return `Trần phí quá hạn cơ sở ${key.slice("cap.".length)}`;
    }
    if (key.startsWith("price.facility.")) {
        const rest = key.slice("price.facility.".length);
        const parts = rest.split(".");
        const unitType = parts.pop();
        const facilityCode = parts.join(".");
        return `Giá riêng cơ sở ${facilityCode} · ${UNIT_NAMES[unitType] || unitType}`;
    }
    if (key.startsWith("price.min.")) {
        const t = key.slice("price.min.".length);
        return `Giá sàn cho phép · ${UNIT_NAMES[t] || t}`;
    }
    if (key.startsWith("price.max.")) {
        const t = key.slice("price.max.".length);
        return `Giá trần cho phép · ${UNIT_NAMES[t] || t}`;
    }
    return key;
}

export function formatPolicyValue(key, rawValue) {
    if (rawValue == null || rawValue === "") return "—";
    const parsed = parseJsonSafe(String(rawValue));

    if (key === "basePrices" && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed)
            .map(([t, price]) => `${UNIT_NAMES[t] || t}: ${money(price)}/tháng`)
            .join(" · ");
    }
    if (key === "durationDiscounts" && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed)
            .map(([months, rate]) => `${months} tháng: giảm ${Math.round(Number(rate) * 100)}%`)
            .join(" · ");
    }
    if (key === "extraFees" && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const names = {
            cleaning: "Vệ sinh",
            newLock: "Thay khóa mới",
            overduePenaltyPerDay: "Phạt quá hạn/ngày",
        };
        return Object.entries(parsed)
            .map(([k, v]) => `${names[k] || k}: ${money(v)}`)
            .join(" · ");
    }
    if (key === "generalRules" && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return "Áp dụng camera an ninh 24/7, kiểm soát ra vào PIN & PCCC; cấm lưu trữ chất cháy nổ, độc hại hoặc động vật sống.";
    }
    if (key === "depositRule") {
        const text = String(parsed);
        return DEPOSIT_RULE_LABELS[text] || text;
    }
    if (key.startsWith("cap.")) {
        return `${Number(parsed)}% giá thuê tháng`;
    }
    if (key.startsWith("discount.")) {
        const num = Number(parsed);
        return Number.isFinite(num) ? `${Math.round(num * 100)}%` : String(parsed);
    }
    if (key === "depositMonths" || key === "renewalMaxMonths") {
        return `${Number(parsed)} tháng`;
    }
    if (key === "reservationHoldDays" || key === "gracePeriodDays") {
        return `${Number(parsed)} ngày`;
    }
    if (key === "refundCancelHours") {
        return `${Number(parsed)} giờ`;
    }
    if (
        key.startsWith("price.") ||
        key === "cleaningFee" ||
        key === "overdueDailyFee" ||
        key === "newLockFee"
    ) {
        return money(parsed);
    }
    if (typeof parsed === "object") {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
    }
    return String(parsed);
}

