import { describe, expect, it } from "vitest";
import { registrationError, registrationPayload } from "./auth-validation";
import { landingForRole } from "./auth-navigation";
import { facilityFilterForSession } from "../../facility/lib/catalog-filters";

const fixture = {
  name: "Khach Thu Nghiem", username: "synthetic_user", email: "auth@example.invalid",
  phone: "09" + "1".repeat(8), cccd: "001" + "2".repeat(9), facilityCode: "HN-CG",
  password: "fixture-value", confirmPassword: "fixture-value",
};

describe("registration contract", () => {
  it("normalizes identity fields while preserving raw credential edges", () => {
    const password = " " + fixture.password + " ";
    const data = registrationPayload({ ...fixture, username: " Synthetic_User ", password, confirmPassword: password });
    expect(data.username).toBe("synthetic_user");
    expect(data.password).toBe(password);
    expect(data.confirmPassword).toBe(password);
    expect(registrationError(data)).toBeUndefined();
  });
  it("rejects mismatched confirmation and whitespace-only passwords", () => {
    expect(registrationError({ ...fixture, password: fixture.password + " " })).toBeDefined();
    expect(registrationError({ ...fixture, password: " ".repeat(6), confirmPassword: " ".repeat(6) })).toBeDefined();
  });
  it("does not remove whitespace in the middle", () => {
    const password = "fixture value";
    expect(registrationPayload({ ...fixture, password, confirmPassword: password }).password).toBe(password);
  });
  it("allows registration without choosing a facility", () => {
    const { facilityCode: _facilityCode, ...withoutFacility } = fixture;
    const data = registrationPayload(withoutFacility);
    expect(data.facilityCode).toBeUndefined();
    expect(registrationError(data)).toBeUndefined();
  });
  it("applies the approved limit to UTF-8 bytes without truncation", () => {
    const malformed = String.fromCharCode(0xD800) + "a".repeat(6);
    expect(registrationError({ ...fixture, password: malformed, confirmPassword: malformed })).toBeDefined();
    expect(registrationError({ ...fixture, password: "đ".repeat(36), confirmPassword: "đ".repeat(36) })).toBeUndefined();
    expect(registrationError({ ...fixture, password: "đ".repeat(37), confirmPassword: "đ".repeat(37) })).toBeDefined();
  });
  it("routes all five roles to an existing role-specific page", () => {
    expect(landingForRole("CUSTOMER")).toBe("/storage");
    expect(landingForRole("STAFF")).toBe("/facility/tasks/my");
    expect(landingForRole("FMANAGER")).toBe("/facility/overview");
    expect(landingForRole("OPS_MGR")).toBe("/operations/overview");
    expect(landingForRole("ADMIN")).toBe("/admin/overview");
    expect(() => landingForRole("UNKNOWN")).toThrow();
  });
  it("scopes catalog by customer facility and leaves unassigned customers unfiltered", () => {
    expect(facilityFilterForSession("CUSTOMER", " HN-CG ")).toBe("HN-CG");
    expect(facilityFilterForSession("CUSTOMER", null)).toBe("");
    expect(facilityFilterForSession("CUSTOMER", "")).toBe("");
    expect(facilityFilterForSession("ADMIN", "HN-CG")).toBe("");
  });
});
