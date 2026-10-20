import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const workforceApi = {
  list: () => request<Row[]>("/tasks"),
  staffOptions: () => request<Row[]>("/tasks/staff-options"),
  managerDashboard: () => request<Row>("/tasks/manager-dashboard"),
  assign: (d: Row) => request("/tasks/dispatch", json("POST", d)),
  assignExisting: (id: string, d: Row) => request(`/tasks/${id}/assign`, json("PATCH", d)),
  credentials: (id: string) => request<Row>(`/tasks/${id}/checkin/credentials`),
  verifyCheckin: (id: string, d: Row) => request<Row>(`/tasks/${id}/checkin/verify`, json("POST", d)),
  progress: (d: Row) => request(`/tasks/${d.id}/status`, json("PATCH", d)),
};
