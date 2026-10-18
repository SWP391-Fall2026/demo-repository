import { request } from "../../../shared/api/http-client";
import type { Row } from "../../../shared/types/api";
export const auditApi = { list: () => request<Row[]>("/audit-logs") };
