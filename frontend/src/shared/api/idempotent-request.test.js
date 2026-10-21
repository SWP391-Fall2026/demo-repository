import { afterEach, expect, it, vi } from "vitest";
import { idempotentRequest } from "./idempotent-request";
afterEach(() => vi.unstubAllGlobals());
it("reuses a payment key after a lost response, then starts a fresh submission", async () => {
    const success = () => new Response(JSON.stringify({ success: true, data: { id: "PAY-1" } }), {
        status: 200,
    });
    const fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("connection lost"))
        .mockImplementation(success);
    vi.stubGlobal("fetch", fetch);
    const body = { invoiceId: "INV-retry", paymentMethod: "MOCK_CARD" };
    await expect(idempotentRequest("/payments/simulate", body)).rejects.toThrow();
    await idempotentRequest("/payments/simulate", body);
    await idempotentRequest("/payments/simulate", body);
    const keys = fetch.mock.calls.map(([, options]) => options.headers.get("Idempotency-Key"));
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[1]);
});
