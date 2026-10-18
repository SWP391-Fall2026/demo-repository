import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const workforceApi = {
  list: () => request<Row[]>("/tasks"),
  assign: (d: Row) => request("/tasks/dispatch", json("POST", d)),
  progress: (d: Row) => request(`/tasks/${d.id}/status`, json("PATCH", d)),
};
