import { request, json } from "../../../shared/api/http-client";
export const facilityApi = {
    updateUnit: (d) => request(`/facilities/units/${d.code}`, json("PUT", d)),
    facilities: () => request("/facilities"),
    setCheckinPin: (code) => request(`/facilities/${encodeURIComponent(code)}/checkin-pin`, { method: "PUT" }),
    units: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value)
                params.set(key, value);
        });
        return request(`/facilities/units?${params.toString()}`);
    },
    managedUnits: () => request("/facilities/units/manage"),
    createFacility: (d) => request("/facilities", json("POST", d)),
    createUnit: (d) => request("/facilities/units", json("POST", d)),
    ready: (d) => request(`/facilities/units/${d.code}/ready`, json("POST", d)),
    approveReady: (d) => request(`/facilities/units/${d.code}/ready/approve`, json("POST", d)),
};
