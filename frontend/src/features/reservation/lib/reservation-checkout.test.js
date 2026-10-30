import { afterEach, expect, it, vi } from "vitest";
import { createReservationCheckout } from "./reservation-checkout";

afterEach(() => vi.unstubAllGlobals());

it("retries invoice lookup without creating another reservation after network failure", async () => {
    const response = data => new Response(JSON.stringify({ success: true, data }), { status: 200 });
    const fetch = vi.fn()
        .mockResolvedValueOnce(response({ id: "RSV-checkout" }))
        .mockRejectedValueOnce(new Error("connection lost"))
        .mockResolvedValueOnce(response([{ id: "INV-checkout", reservationId: "RSV-checkout", invoiceType: "DEPOSIT" }]));
    vi.stubGlobal("fetch", fetch);
    const checkout = createReservationCheckout();
    const onCreated = vi.fn();
    const payload = { facilityCode: "HN-CG", unitType: "S" };
    await expect(checkout(payload, onCreated)).rejects.toThrow();
    const result = await checkout(payload, onCreated);
    expect(result.invoice.id).toBe("INV-checkout");
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls.map(([url, options]) => `${options.method || "GET"} ${url}`))
        .toEqual(["POST /api/reservations", "GET /api/invoices", "GET /api/invoices"]);
});
