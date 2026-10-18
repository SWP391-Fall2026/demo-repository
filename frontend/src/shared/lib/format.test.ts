import { describe, it, expect } from "vitest";
import { money, statusClass } from "./format";
describe("presentation boundaries", () => {
  it("formats VND without fractional amounts", () => {
    expect(money(1450000)).toContain("1.450.000");
  });
  it("distinguishes failed/refunded workflow states", () => {
    expect(statusClass("FAILED")).toBe("danger");
    expect(statusClass("COMPLETED")).toBe("success");
  });
});
