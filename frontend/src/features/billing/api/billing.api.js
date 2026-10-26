import { idempotentRequest } from "../../../shared/api/idempotent-request";
import { request, json } from "../../../shared/api/http-client";
import { sessionStore } from "../../identity/session";
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
    loadRefundEvidence: async (id) => {
        const token = sessionStore.get()?.token;
        const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
        const response = await fetch(`${base}/refunds/${encodeURIComponent(id)}/evidence`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new Error(response.status === 404 ? "Chưa có bằng chứng cho yêu cầu này." : "Không tải được bằng chứng hoàn tiền.");
        const blob = await response.blob();
        return { url: URL.createObjectURL(blob), contentType: blob.type };
    },
    upload: (id, file, reference) => {
        const data = new FormData();
        data.append("file", file);
        data.append("reference", reference);
        return request(`/refunds/${id}/evidence`, { method: "POST", body: data });
    },
};
