import { useSyncExternalStore } from "react";
const key = "storage-rental.session";
const roles = new Set(["CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN"]);
export function tokenExpiry(token) {
    try {
        const part = token.split(".")[1];
        if (!part)
            return null;
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), c => c.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        return typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
    }
    catch {
        return null;
    }
}
function validSession(candidate) {
    if (!candidate || typeof candidate !== "object")
        return null;
    const session = candidate;
    const user = session.user;
    if (typeof session.token !== "string" || !user || !roles.has(user.role)
        || typeof user.id !== "string" || !user.id || typeof user.username !== "string")
        return null;
    const expires = tokenExpiry(session.token);
    if (expires === null || expires <= Date.now())
        return null;
    // Persist only the minimal session view, not CCCD/phone returned by the profile API.
    return { token: session.token, user: {
            id: user.id, username: user.username, name: user.name, email: user.email,
            role: user.role, facilityCode: user.facilityCode, facility: user.facility,
        } };
}
function restore() {
    try {
        const session = validSession(JSON.parse(localStorage.getItem(key) || "null"));
        if (!session)
            localStorage.removeItem(key);
        return session;
    }
    catch {
        return null;
    }
}
let value = restore();
const listeners = new Set();
let expiryTimer;
function scheduleExpiry() {
    if (expiryTimer !== undefined)
        clearTimeout(expiryTimer);
    if (!value)
        return;
    const expires = tokenExpiry(value.token);
    if (expires !== null && typeof window !== "undefined") {
        expiryTimer = setTimeout(() => sessionStore.set(null), Math.min(2_147_483_647, Math.max(0, expires - Date.now())));
    }
}
export const sessionStore = {
    get: () => value,
    set: (next) => {
        const validated = next === null ? null : validSession(next);
        if (next !== null && validated === null)
            throw new Error("Phiên đăng nhập thiếu thông tin hoặc đã hết hạn.");
        value = validated;
        try {
            if (value)
                localStorage.setItem(key, JSON.stringify(value));
            else
                localStorage.removeItem(key);
        }
        catch {
            // Memory session still works when browser storage is unavailable.
        }
        scheduleExpiry();
        listeners.forEach(fn => fn());
    },
    subscribe: (fn) => {
        listeners.add(fn);
        return () => { listeners.delete(fn); };
    },
};
if (typeof window !== "undefined") {
    window.addEventListener("storage", event => {
        if (event.key !== key && event.key !== null)
            return;
        value = restore();
        scheduleExpiry();
        listeners.forEach(fn => fn());
    });
}
scheduleExpiry();
export function useSession() {
    return useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
}
