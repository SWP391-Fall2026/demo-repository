import { idempotentRequest } from "../../../shared/api/idempotent-request";
import { request, json } from "../../../shared/api/http-client";
export const billingApi = {
    invoices: () => request("/invoices"),
    payments: () => request("/payments/transactions"),
    pay: (d) => idempotentRequest("/payments/simulate", d),
    createVnPay: (invoiceId) => request("/payments/vnpay/create", json("POST", { invoiceId })),
    refunds: () => request("/refunds"),
    requestRefund: (d) => idempotentRequest("/refunds", d),
    cancelRefund: (d) => request(`/refunds/${d.id}/cancel`, json("POST", d)),
    decideRefund: (d) => request(`/refunds/${d.id}/decision`, json("POST", d)),
    confirmRefund: (d) => request(`/refunds/${d.id}/confirm`, json("POST", d)),
    upload: (id, file, reference) => {
        const data = new FormData();
        data.append("file", file);
        data.append("reference", reference);
        return request(`/refunds/${id}/evidence`, { method: "POST", body: data });
    },
};
