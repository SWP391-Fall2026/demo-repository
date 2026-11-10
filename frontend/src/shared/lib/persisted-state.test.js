import { describe, expect, it } from "vitest";
import {
    PAGE_SESSION_TTL_MS,
    clearAllPageState,
    clearPageState,
    readPageState,
    writePageState,
} from "./persisted-state";

function createMemoryStorage() {
    const map = new Map();
    return {
        get length() {
            return map.size;
        },
        key(index) {
            return Array.from(map.keys())[index] ?? null;
        },
        getItem(k) {
            return map.has(k) ? map.get(k) : null;
        },
        setItem(k, v) {
            map.set(k, String(v));
        },
        removeItem(k) {
            map.delete(k);
        },
    };
}

describe("persisted page session state", () => {
    it("retains state across reads within the 30-minute window", () => {
        const storage = createMemoryStorage();
        const t0 = 1_700_000_000_000;
        writePageState("reservation.create.draft", { unitType: "M" }, { scope: "USR-01", now: t0, storage });

        const within30m = readPageState(
            "reservation.create.draft",
            { unitType: "S" },
            { scope: "USR-01", now: t0 + 25 * 60 * 1000, storage }
        );
        expect(within30m).toEqual({ unitType: "M" });

        // Sliding refresh extended the window by another 30m from t0 + 25m
        const extended = readPageState(
            "reservation.create.draft",
            { unitType: "S" },
            { scope: "USR-01", now: t0 + 50 * 60 * 1000, storage }
        );
        expect(extended).toEqual({ unitType: "M" });
    });

    it("expires saved page state after 30 minutes of inactivity", () => {
        const storage = createMemoryStorage();
        const t0 = 1_700_000_000_000;
        writePageState("invoice.selected-id", "INV-123", { scope: "USR-01", now: t0, storage });

        const after30m = readPageState(
            "invoice.selected-id",
            "",
            { scope: "USR-01", now: t0 + PAGE_SESSION_TTL_MS + 1, storage }
        );
        expect(after30m).toBe("");
    });

    it("isolates scopes per user and clears all page state on logout", () => {
        const storage = createMemoryStorage();
        writePageState("draft", "customer-a", { scope: "USR-01", storage });
        writePageState("draft", "customer-b", { scope: "USR-02", storage });

        expect(readPageState("draft", "", { scope: "USR-01", storage })).toBe("customer-a");
        expect(readPageState("draft", "", { scope: "USR-02", storage })).toBe("customer-b");

        clearPageState("draft", { scope: "USR-01", storage });
        expect(readPageState("draft", "", { scope: "USR-01", storage })).toBe("");
        expect(readPageState("draft", "", { scope: "USR-02", storage })).toBe("customer-b");

        clearAllPageState(storage);
        expect(readPageState("draft", "", { scope: "USR-02", storage })).toBe("");
    });
});

