export function facilityFilterForSession(role, facilityCode) {
    return role === "CUSTOMER" ? facilityCode?.trim() ?? "" : "";
}
