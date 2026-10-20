import type { Role } from "../../../shared/types/api";

const destinations: Record<Role, string> = {
  CUSTOMER: "/storage",
  STAFF: "/facility/tasks/my",
  FMANAGER: "/facility/overview",
  OPS_MGR: "/operations/overview",
  ADMIN: "/admin/overview",
};

export function landingForRole(role: string): string {
  if (!Object.prototype.hasOwnProperty.call(destinations, role))
    throw new Error("Vai trò tài khoản chưa được hỗ trợ.");
  return destinations[role as Role];
}
