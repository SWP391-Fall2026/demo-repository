import { request, json } from "../../../shared/api/http-client";
export const policyApi = {
    get: () => request("/policies"),
    save: (d) => request("/policies", json("PATCH", d)),
    cap: (d) => request("/policies/facility-cap", json("PATCH", d)),
};
