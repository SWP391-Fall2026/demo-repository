import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
import { sessionStore } from "../../identity/session";
export const rentalApi = {
  list: () => request<Row[]>("/contracts"),
  detail: (id: string) => request<Row>(`/contracts/${encodeURIComponent(id)}`),
  handover: (d: Row, evidence?: File) => {
    const body = new FormData();
    Object.entries(d).forEach(([key, value]) => body.append(key, String(value ?? "")));
    if (evidence) body.append("evidence", evidence);
    return request("/contracts/handover", { method: "POST", body });
  },
  eligibleHandovers: () => request<Row[]>("/contracts/handover/eligible"),
  confirmHandover: (id: string, confirmations: Row) => request<Row>(`/contracts/${encodeURIComponent(id)}/handover/confirm`, json("POST", confirmations)),
  reportHandoverIssue: (id: string) => request<Row>(`/contracts/${encodeURIComponent(id)}/handover/issue`, json("POST", { reported: true })),
  loadHandoverEvidence: async (id: string) => {
    const token = sessionStore.get()?.token;
    const response = await fetch(`/api/contracts/${encodeURIComponent(id)}/handover/evidence`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error("Không tải được ảnh hiện trạng.");
    return URL.createObjectURL(await response.blob());
  },
  returnRequest: (d: Row) =>
    request("/contracts/checkout-request", json("POST", d)),
  inspect: (d: Row) => request("/contracts/return-inspection", json("POST", d)),
  verifyPin: (d: Row) => request<Row>("/contracts/verify-pin", json("POST", d)),
  updatePin: (d: Row) =>
    request(`/contracts/${d.unitCode}/pin`, json("PATCH", d)),
  confirmRenewal: (d: Row) =>
    request<Row>(`/contracts/${d.contractId}/renewal-invoice`, json("POST", d)),
  renew: (d: Row) =>
    request<Row>(`/contracts/${d.contractId}/renewal-quote?months=${d.months}`),
};
