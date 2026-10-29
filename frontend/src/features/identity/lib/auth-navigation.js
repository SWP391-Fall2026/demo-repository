const destinations = {
  CUSTOMER: "/storage",
  STAFF: "/facility/tasks/my",
  FMANAGER: "/facility/overview",
  OPS_MGR: "/operations/overview",
  ADMIN: "/admin/overview",
};

const authPaths = ["/login", "/register", "/verify-otp"];
const roles = Object.keys(destinations);

/**
 * Accept only an internal path that can be used after authentication.
 * Router state is user-controlled in a browser session, so never pass an
 * absolute URL or an auth route back into navigate().
 */
export function safeReturnPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    return "";
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "";
  }
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(decoded)
  )
    return "";
  let parsed;
  try {
    parsed = new URL(value, "http://storage.local");
  } catch {
    return "";
  }
  const pathname = decodeURIComponent(parsed.pathname).toLowerCase();
  if (
    parsed.origin !== "http://storage.local" ||
    pathname.startsWith("//") ||
    authPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return "";
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function authNavigationState(state) {
  const from = safeReturnPath(state?.from);
  if (!from) return undefined;
  const requiredRoles = Array.isArray(state?.requiredRoles)
    ? state.requiredRoles.filter((role) => roles.includes(role))
    : [];
  if (!requiredRoles.length) return undefined;
  return { from, requiredRoles };
}

export function returnToForRole(state, role) {
  const navigation = authNavigationState(state);
  if (!navigation) return "";
  if (!navigation.requiredRoles.includes(role)) return "";
  return navigation.from;
}

export function landingForRole(role) {
  if (!Object.prototype.hasOwnProperty.call(destinations, role))
    throw new Error("Vai trò tài khoản chưa được hỗ trợ.");
  return destinations[role];
}
