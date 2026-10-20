import type { Role } from "../../../shared/types/api";

export function facilityFilterForSession(
  role: Role | undefined,
  facilityCode: string | null | undefined,
): string {
  return role === "CUSTOMER" ? facilityCode?.trim() ?? "" : "";
}
