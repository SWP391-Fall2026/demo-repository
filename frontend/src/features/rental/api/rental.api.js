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
    reportHandoverIssue: (id) => request(`/contracts/${encodeURIComponent(id)}/handover/issue`, json("POST", { reported: true })),
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
