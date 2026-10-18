import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const rentalApi = {
  list: () => request<Row[]>("/contracts"),
  handover: (d: Row) => request("/contracts/handover", json("POST", d)),
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
