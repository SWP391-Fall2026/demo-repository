import { afterEach, expect, it } from "vitest";
import { sessionStore, tokenExpiry } from "./session";

function fixtureToken(exp: number) {
  const payload = btoa(JSON.stringify({ exp })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return "unsigned-fixture." + payload + ".not-a-real-signature";
}
afterEach(() => sessionStore.set(null));

it("decodes expiry for UX without pretending to verify a JWT signature", () => {
  const exp = Math.floor(Date.now() / 1000) + 600;
  expect(tokenExpiry(fixtureToken(exp))).toBe(exp * 1000);
  expect(tokenExpiry("malformed")).toBeNull();
});

it("rejects expired sessions and persists only the minimal profile view", () => {
  const user = {
    id: "synthetic-user", name: "Khach Thu Nghiem", username: "synthetic_user",
    email: "auth@example.invalid", role: "CUSTOMER" as const,
    cccd: "synthetic-private-field",
  };
  expect(() => sessionStore.set({ user, token: fixtureToken(1) })).toThrow();
  sessionStore.set({ user, token: fixtureToken(Math.floor(Date.now() / 1000) + 600) });
  expect(sessionStore.get()?.user).not.toHaveProperty("cccd");
});
