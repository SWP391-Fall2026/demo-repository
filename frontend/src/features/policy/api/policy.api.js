import { request, json } from "../../../shared/api/http-client";
export const policyApi = {
    get: () => request("/policies"),
    history: () => request("/policies/history"),
    save: (d) => request("/policies", json("PATCH", d)),
    saveFacilityPrice: (d) => request("/policies/facility-price", json("PATCH", d)),
    cap: (d) => request("/policies/facility-cap", json("PATCH", d)),
};
