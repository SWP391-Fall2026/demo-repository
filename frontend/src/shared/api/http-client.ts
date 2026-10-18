import type { Envelope } from "../types/api";
import { sessionStore } from "../../features/identity/session";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export async function envelope<T>(
  path: string,
  options: RequestInit = {},
): Promise<Envelope<T>> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const token = sessionStore.get()?.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers,
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("Không kết nối được máy chủ. Vui lòng thử lại.", 0);
  }
  let result: Envelope<T>;
  try {
    result = await response.json();
  } catch {
    throw new ApiError("Máy chủ trả dữ liệu không hợp lệ.", response.status);
  }
  if (!response.ok || !result.success) {
    if (response.status === 401) sessionStore.set(null);
    throw new ApiError(
      result.message || `Yêu cầu không thành công (${response.status})`,
      response.status,
    );
  }
  return result;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (await envelope<T>(path, options)).data;
}
export function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(body),
  };
}
