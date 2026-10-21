import { request } from "../../../shared/api/http-client";
export const reportingApi = {
    chain: () => request("/policies/stats"),
    facility: () => request("/reports/facility"),
    system: () => request("/reports/system"),
};
