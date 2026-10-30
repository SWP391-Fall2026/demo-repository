import { describe, expect, it } from "vitest";
import {
  authNavigationState,
  landingForRole,
  returnToForRole,
  safeReturnPath,
} from "./auth-navigation";

describe("authenticated return navigation", () => {
  it("keeps internal path, query, and hash", () => {
    const from = "/reservations/new?facility=HN-CG&type=M#schedule";
    expect(safeReturnPath(from)).toBe(from);
    expect(
      returnToForRole({ from, requiredRoles: ["CUSTOMER"] }, "CUSTOMER"),
    ).toBe(from);
  });

  it("rejects external, protocol-relative, escaped, and auth-loop paths", () => {
    for (const value of [
      "https://evil.example/steal",
      "//evil.example/steal",
      "/\\\\evil.example/steal",
      "/%2F%2Fevil.example/steal",
      "/a/..//evil.example/steal",
      "/login?from=/storage",
      "/register",
      "/verify-otp",
    ]) {
      expect(safeReturnPath(value)).toBe("");
    }
  });

  it("requires destination role and falls back to role landing", () => {
    const state = authNavigationState({
      from: "/facility/overview",
      requiredRoles: ["FMANAGER"],
    });
    expect(returnToForRole(state, "CUSTOMER")).toBe("");
    expect(returnToForRole(state, "FMANAGER")).toBe("/facility/overview");
    expect(landingForRole("CUSTOMER")).toBe("/storage");
  });

  it("drops unrecognized required roles instead of widening access", () => {
    expect(
      authNavigationState({ from: "/storage", requiredRoles: ["UNKNOWN"] }),
    ).toBeUndefined();
  });
});
