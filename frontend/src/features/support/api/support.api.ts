import { request, json } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const supportApi = {
  list: () => request<Row[]>("/tickets"),
  create: (d: Row) => request("/tickets", json("POST", d)),
  progress: (d: Row) => request(`/tickets/${d.id}`, json("PATCH", d)),
};
