import { useCallback, useEffect, useRef, useState } from "react";

export const PAGE_SESSION_TTL_MS = 30 * 60 * 1000;
const PAGE_STORAGE_PREFIX = "storage-rental.page.";
const SESSION_KEY = "storage-rental.session";

function defaultStorage() {
    try {
        return typeof localStorage !== "undefined" ? localStorage : null;
    }
    catch {
        return null;
    }
}

export function activeSessionScope(storage = defaultStorage()) {
    if (!storage)
        return "anon";
    try {
        const raw = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        const id = raw?.user?.id;
        return typeof id === "string" && id ? id : "anon";
    }
    catch {
        return "anon";
    }
}

function storageKey(key, scope) {
    return `${PAGE_STORAGE_PREFIX}${scope}.${key}`;
}

function resolveValue(fallback) {
    return typeof fallback === "function" ? fallback() : fallback;
}

export function readPageState(key, fallback, options = {}) {
    const {
        scope = activeSessionScope(options.storage),
        ttlMs = PAGE_SESSION_TTL_MS,
        now = Date.now(),
        storage = defaultStorage(),
    } = options;
    if (!storage)
        return resolveValue(fallback);
    const fullKey = storageKey(key, scope);
    try {
        const parsed = JSON.parse(storage.getItem(fullKey) || "null");
        if (!parsed || typeof parsed !== "object" || !("value" in parsed))
            return resolveValue(fallback);
        if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= now) {
            storage.removeItem(fullKey);
            return resolveValue(fallback);
        }
        if (ttlMs > 0) {
            storage.setItem(fullKey, JSON.stringify({ value: parsed.value, expiresAt: now + ttlMs }));
        }
        return parsed.value;
    }
    catch {
        return resolveValue(fallback);
    }
}

export function writePageState(key, value, options = {}) {
    const {
        scope = activeSessionScope(options.storage),
        ttlMs = PAGE_SESSION_TTL_MS,
        now = Date.now(),
        storage = defaultStorage(),
    } = options;
    if (!storage)
        return;
    const fullKey = storageKey(key, scope);
    try {
        storage.setItem(fullKey, JSON.stringify({ value, expiresAt: now + ttlMs }));
    }
    catch {
        // Ignore storage quota or private-mode errors.
    }
}

export function clearPageState(key, options = {}) {
    const {
        scope = activeSessionScope(options.storage),
        storage = defaultStorage(),
    } = options;
    if (!storage)
        return;
    try {
        storage.removeItem(storageKey(key, scope));
    }
    catch {
        // Ignore storage unavailability.
    }
}

export function clearAllPageState(storage = defaultStorage()) {
    if (!storage)
        return;
    try {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i += 1) {
            const k = storage.key(i);
            if (typeof k === "string" && k.startsWith(PAGE_STORAGE_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach((k) => storage.removeItem(k));
    }
    catch {
        // Ignore storage unavailability.
    }
}

export function usePersistedState(key, initialValue, options = {}) {
    const { enabled = true, ttlMs = PAGE_SESSION_TTL_MS } = options;
    const scope = options.scope || activeSessionScope();
    const initialRef = useRef(initialValue);
    initialRef.current = initialValue;

    const [value, setValue] = useState(() => (
        enabled ? readPageState(key, () => resolveValue(initialRef.current), { scope, ttlMs }) : resolveValue(initialRef.current)
    ));
    const hydratedRef = useRef(false);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }
        if (!enabled)
            return;
        setValue(readPageState(key, () => resolveValue(initialRef.current), { scope, ttlMs }));
    }, [key, scope, ttlMs, enabled]);

    const setPersisted = useCallback((updater) => {
        setValue((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            if (enabled) {
                writePageState(key, next, { scope, ttlMs });
            }
            return next;
        });
    }, [key, scope, ttlMs, enabled]);

    const resetPersisted = useCallback(() => {
        const base = resolveValue(initialRef.current);
        clearPageState(key, { scope });
        setValue(base);
    }, [key, scope]);

    return [value, setPersisted, resetPersisted];
}

