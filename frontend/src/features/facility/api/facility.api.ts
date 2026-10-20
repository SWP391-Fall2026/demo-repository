import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const facilityApi = {
  updateUnit: (d: Row) =>
    request(`/facilities/units/${d.code}`, json("PUT", d)),
  facilities: () => request<Row[]>("/facilities"),
  setCheckinPin: (code: string) => request(`/facilities/${encodeURIComponent(code)}/checkin-pin`, { method: "PUT" }),
  units: (filters?: { facilityCode?: string; minSize?: string; maxSize?: string; minPrice?: string; maxPrice?: string }) => {
    const params = new URLSearchParams();
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return request<Row[]>(`/facilities/units?${params.toString()}`);
  },
  managedUnits: () => request<Row[]>("/facilities/units/manage"),
  createFacility: (d: Row) => request("/facilities", json("POST", d)),
  createUnit: (d: Row) => request("/facilities/units", json("POST", d)),
  ready: (d: Row) =>
    request(`/facilities/units/${d.code}/ready`, json("POST", d)),
  approveReady: (d: Row) =>
    request(`/facilities/units/${d.code}/ready/approve`, json("POST", d)),
};
