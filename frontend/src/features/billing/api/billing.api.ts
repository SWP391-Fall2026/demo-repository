import { idempotentRequest } from "../../../shared/api/idempotent-request";
import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const billingApi = {
  invoices: () => request<Row[]>("/invoices"),
  payments: () => request<Row[]>("/payments/transactions"),
  pay: (d: Row) => idempotentRequest("/payments/simulate", d),
  refunds: () => request<Row[]>("/refunds"),
  requestRefund: (d: Row) => idempotentRequest("/refunds", d),
  cancelRefund: (d: Row) => request(`/refunds/${d.id}/cancel`, json("POST", d)),
  decideRefund: (d: Row) =>
    request(`/refunds/${d.id}/decision`, json("POST", d)),
  confirmRefund: (d: Row) =>
    request(`/refunds/${d.id}/confirm`, json("POST", d)),
  upload: (id: string, file: File, reference: string) => {
    const data = new FormData();
    data.append("file", file);
    data.append("reference", reference);
    return request(`/refunds/${id}/evidence`, { method: "POST", body: data });
  },
};
