import { describe, it, expect } from "vitest";
import { formatPolicyValue, policyLabel } from "./policy-format";

describe("policy formatting", () => {
    it("translates technical policy keys to clear Vietnamese labels", () => {
        expect(policyLabel("basePrices")).toBe("Bảng giá thuê chuẩn theo loại kho");
        expect(policyLabel("cap.HN-CG")).toBe("Trần phí quá hạn cơ sở HN-CG");
        expect(policyLabel("overdueDailyFee")).toBe("Phí phạt quá hạn mỗi ngày");
    });

    it("formats raw JSON strings, quotes, fees, and percentages readably", () => {
        expect(formatPolicyValue("basePrices", '{"S":800000,"CLIMATE":2200000}')).toContain("800.000");
        expect(formatPolicyValue("depositRule", '"1_MONTH"')).toBe("Tương đương 1 tháng tiền thuê");
        expect(formatPolicyValue("cleaningFee", "200000")).toContain("200.000");
        expect(formatPolicyValue("cap.HN-CG", "50")).toBe("50% giá thuê tháng");
        expect(formatPolicyValue("discount.6", "0.10")).toBe("10%");
        expect(formatPolicyValue("gracePeriodDays", "3")).toBe("3 ngày");
    });
});

