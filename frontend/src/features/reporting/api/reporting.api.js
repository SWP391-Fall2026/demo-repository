import { request } from "../../../shared/api/http-client";
export const reportingApi = {
    chain: () => request("/policies/stats"),
    facility: () => request("/reports/facility"),
    system: () => request("/reports/system"),
    revenue: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value)
                params.set(key, value);
        });
        const query = params.toString();
        return request("/reports/revenue" + (query ? "?" + query : ""));
    },
    occupancy: (facilityCode) => request("/reports/occupancy" + (facilityCode ? "?facilityCode=" + encodeURIComponent(facilityCode) : "")),
};
