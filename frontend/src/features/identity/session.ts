import { useSyncExternalStore } from "react";
import type { Session } from "../../shared/types/api";
const key = "storage-rental.session";
function restore(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    if (!s?.token) return null;
    const payload = JSON.parse(atob(s.token.split(".")[1]));
    return payload.exp * 1000 > Date.now() ? s : null;
  } catch {
    return null;
  }
}
let value: Session | null = restore();
const listeners = new Set<() => void>();
export const sessionStore = {
  get: () => value,
  set: (next: Session | null) => {
    value = next;
    if (next) localStorage.setItem(key, JSON.stringify(next));
    else localStorage.removeItem(key);
    listeners.forEach((fn) => fn());
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
}
