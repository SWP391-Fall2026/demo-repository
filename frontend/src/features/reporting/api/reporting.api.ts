import { request } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const reportingApi = {
  chain: () => request<Row>("/policies/stats"),
  facility: () => request<Row>("/reports/facility"),
  system: () => request<Row>("/reports/system"),
};
