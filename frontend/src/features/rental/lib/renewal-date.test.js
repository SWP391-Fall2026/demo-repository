import { expect, it } from "vitest";
import { renewalEndDate } from "./renewal-date";

it("keeps month-end renewal previews aligned with backend plusMonths", () => {
    const february = renewalEndDate("2027-01-31T14:30:00", 1);
    expect([february.getFullYear(), february.getMonth() + 1, february.getDate()]).toEqual([2027, 2, 28]);
    expect([february.getHours(), february.getMinutes()]).toEqual([14, 30]);
    const leapFebruary = renewalEndDate("2028-01-31T14:30:00", 1);
    expect(leapFebruary.getDate()).toBe(29);
    const nextYear = renewalEndDate("2028-02-29T14:30:00", 12);
    expect([nextYear.getFullYear(), nextYear.getMonth() + 1, nextYear.getDate()]).toEqual([2029, 2, 28]);
});

it("preserves ordinary dates and rejects missing or malformed dates", () => {
    const result = renewalEndDate("2026-10-15T09:00:00", 3);
    expect([result.getFullYear(), result.getMonth() + 1, result.getDate()]).toEqual([2027, 1, 15]);
    expect(renewalEndDate(null, 1)).toBeNull();
    expect(renewalEndDate("invalid", 1)).toBeNull();
});
