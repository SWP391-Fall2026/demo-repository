import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const policyApi = {
  get: () => request<Row>("/policies"),
  save: (d: Row) => request("/policies", json("PATCH", d)),
  cap: (d: Row) => request("/policies/facility-cap", json("PATCH", d)),
};
