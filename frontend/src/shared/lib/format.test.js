import { describe, it, expect } from "vitest";
import { display, formatDate, formatDateTime, money, statusClass, statusLabel } from "./format";
describe("presentation boundaries", () => {
    it("formats VND without fractional amounts", () => {
        expect(money(1450000)).toContain("1.450.000");
    });
    it("distinguishes failed/refunded workflow states", () => {
        expect(statusClass("FAILED")).toBe("danger");
        expect(statusClass("COMPLETED")).toBe("success");
    });
    it("separates ISO timestamps and dates cleanly instead of glomming T onto hours", () => {
        expect(display("2026-11-10T17:17:04.222668")).toBe("17:17 · 10/11/2026");
        expect(formatDateTime("2026-11-10T09:05:00")).toBe("09:05 · 10/11/2026");
        expect(formatDate("2026-11-10")).toBe("10/11/2026");
        expect(display("2026-11-10")).toBe("10/11/2026");
    });
    it("translates billing and return workflow statuses cleanly", () => {
        expect(statusLabel("CANCELLED")).toBe("Đã hủy");
        expect(statusLabel("CUSTOMER_ACCEPTED")).toBe("Khách đã xác nhận");
        expect(statusLabel("PIN_ISSUED")).toBe("Đã cấp PIN");
    });
});
