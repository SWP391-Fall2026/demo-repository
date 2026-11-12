import { request, json } from "../../../shared/api/http-client";

export const FALLBACK_FACILITIES = [
    { code: "HN-CG", name: "Cơ sở Cầu Giấy", address: "15 Duy Tân, Cầu Giấy", city: "Hà Nội", status: "ACTIVE" },
    { code: "HN-NTL", name: "Cơ sở Nam Từ Liêm", address: "28 Phạm Hùng, Nam Từ Liêm", city: "Hà Nội", status: "ACTIVE" },
    { code: "HCM-TB", name: "Cơ sở Tân Bình", address: "45 Cộng Hòa, Tân Bình", city: "TP.HCM", status: "ACTIVE" },
    { code: "HCM-Q7", name: "Cơ sở Quận 7", address: "128 Nguyễn Thị Thập, Quận 7", city: "TP.HCM", status: "ACTIVE" },
    { code: "DN-HC", name: "Cơ sở Hải Châu", address: "60 Bạch Đằng, Hải Châu", city: "Đà Nẵng", status: "ACTIVE" },
];

const FACILITIES_CACHE_TTL_MS = 30_000;
let cachedFacilities = null;
let cachedFacilitiesAt = 0;
let facilitiesInFlight = null;

export function clearFacilitiesCache() {
    cachedFacilities = null;
    cachedFacilitiesAt = 0;
    facilitiesInFlight = null;
}

export const facilityApi = {
    updateUnit: (d) => request(`/facilities/units/${d.code}`, json("PUT", d)),
    facilities: async (options = {}) => {
        const force = Boolean(options?.force);
        if (!force && cachedFacilities && Date.now() - cachedFacilitiesAt < FACILITIES_CACHE_TTL_MS) {
            return cachedFacilities;
        }
        if (!force && facilitiesInFlight) {
            return facilitiesInFlight;
        }
        facilitiesInFlight = request("/facilities")
            .then((data) => {
                cachedFacilities = data;
                cachedFacilitiesAt = Date.now();
                return data;
            })
            .finally(() => {
                facilitiesInFlight = null;
            });
        return facilitiesInFlight;
    },
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
    createFacility: async (d) => {
        const result = await request("/facilities", json("POST", d));
        clearFacilitiesCache();
        return result;
    },
    updateFacility: async (d) => {
        const result = await request(`/facilities/${d.code}`, json("PUT", d));
        clearFacilitiesCache();
        return result;
    },
    createUnit: (d) => request("/facilities/units", json("POST", d)),
    ready: (d) => request(`/facilities/units/${d.code}/ready`, json("POST", d)),
    approveReady: (d) => request(`/facilities/units/${d.code}/ready/approve`, json("POST", d)),
    accessLogs: (code) => request(`/facilities/${encodeURIComponent(code)}/access-logs`),
    approveAccessRequest: (code, requestId, d = {}) => request(`/facilities/${encodeURIComponent(code)}/access-requests/${encodeURIComponent(requestId)}/approve`, json("POST", d)),
    rejectAccessRequest: (code, requestId, d = {}) => request(`/facilities/${encodeURIComponent(code)}/access-requests/${encodeURIComponent(requestId)}/reject`, json("POST", d)),
};
