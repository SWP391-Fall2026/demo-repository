import { Navigate, Link, useLocation } from "react-router-dom";
import { useSession } from "../../features/identity/session";
export function RoleGuard({ roles, children }) {
  const session = useSession();
  const location = useLocation();
  if (!roles.length) return children;
  if (!session)
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
          requiredRoles: roles,
        }}
      />
    );
  if (!roles.includes(session.user.role))
    return (
      <section className="card empty">
        <h1>Không có quyền truy cập</h1>
        <p>Trang này thuộc vai trò khác.</p>
        <Link to="/">Về trang chủ</Link>
      </section>
    );
  return children;
}
