import { request, json } from "../../../shared/api/http-client";
import { sessionStore } from "../../identity/session";
export const rentalApi = {
    list: () => request("/contracts"),
    detail: (id) => request(`/contracts/${encodeURIComponent(id)}`),
    handover: (d, evidence) => {
        const body = new FormData();
        Object.entries(d).forEach(([key, value]) => body.append(key, String(value ?? "")));
        if (evidence)
            body.append("evidence", evidence);
        return request("/contracts/handover", { method: "POST", body });
    },
    eligibleHandovers: () => request("/contracts/handover/eligible"),
    confirmHandover: (id, confirmations) => request(`/contracts/${encodeURIComponent(id)}/handover/confirm`, json("POST", confirmations)),
    reportHandoverIssue: (id, reason, file) => {
        const body = new FormData(); body.append("reason", reason);
        if (file) body.append("file", file);
        return request(`/contracts/${encodeURIComponent(id)}/handover/issue`, { method: "POST", body });
    },
    handoverReviews: () => request("/handover-reviews"),
    handoverReview: (id) => request(`/handover-reviews/${encodeURIComponent(id)}`),
    requestHandoverCancellation: (body) => request("/handover-reviews", { method: "POST", body }),
    addReviewEvidence: (id, body) => request(`/handover-reviews/${encodeURIComponent(id)}/evidence`, { method: "POST", body }),
    decideHandoverReview: (id, d) => request(`/handover-reviews/${encodeURIComponent(id)}/decision`, json("POST", d)),
    respondHandoverReview: (id, d) => request(`/handover-reviews/${encodeURIComponent(id)}/response`, json("POST", d)),
    downloadReviewEvidence: async (id) => {
        const token = sessionStore.get()?.token;
        const response = await fetch(`/api/handover-reviews/evidence/${encodeURIComponent(id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new Error("Không tải được bằng chứng.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a"); link.href = url; link.download = "bang-chung-ban-giao"; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    loadHandoverEvidence: async (id) => {
        const token = sessionStore.get()?.token;
        const response = await fetch(`/api/contracts/${encodeURIComponent(id)}/handover/evidence`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok)
            throw new Error("Không tải được ảnh hiện trạng.");
        return URL.createObjectURL(await response.blob());
    },
    returnRequest: (d) => request("/contracts/checkout-request", json("POST", d)),
    inspect: (d) => request("/contracts/return-inspection", json("POST", d)),
    verifyPin: (d) => request("/contracts/verify-pin", json("POST", d)),
    updatePin: (d) => request(`/contracts/${d.unitCode}/pin`, json("PATCH", d)),
    confirmRenewal: (d) => request(`/contracts/${d.contractId}/renewal-invoice`, json("POST", d)),
    renew: (d) => request(`/contracts/${d.contractId}/renewal-quote?months=${d.months}`),
};
