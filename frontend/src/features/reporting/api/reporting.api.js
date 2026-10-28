import { request } from "../../../shared/api/http-client";
import { sessionStore } from "../../identity/session";
export const reportingApi = {
    chain: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/policies/stats?${query}`);
    },
    facility: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/facility?${query}`);
    },
    system: () => request("/reports/system"),
    exportFile: async (params = {}, format = "csv") => {
        const query = new URLSearchParams({ ...params, format }).toString();
        const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
        const token = sessionStore.get()?.token;
        const response = await fetch(`${base}/reports/export?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new Error("Không xuất được báo cáo.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `storage-report.${format}`; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};
