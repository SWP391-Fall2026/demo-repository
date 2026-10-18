import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const facilityApi = {
  updateUnit: (d: Row) =>
    request(`/facilities/units/${d.code}`, json("PUT", d)),
  facilities: () => request<Row[]>("/facilities"),
  units: () => request<Row[]>("/facilities/units"),
  managedUnits: () => request<Row[]>("/facilities/units/manage"),
  createFacility: (d: Row) => request("/facilities", json("POST", d)),
  createUnit: (d: Row) => request("/facilities/units", json("POST", d)),
  ready: (d: Row) =>
    request(`/facilities/units/${d.code}/ready`, json("POST", d)),
  approveReady: (d: Row) =>
    request(`/facilities/units/${d.code}/ready/approve`, json("POST", d)),
};
