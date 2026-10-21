import { request } from "../../../shared/api/http-client";
export const auditApi = { list: () => request("/audit-logs") };
