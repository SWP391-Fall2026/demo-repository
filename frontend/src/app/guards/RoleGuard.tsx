import { Navigate, Link } from "react-router-dom";
import { useSession } from "../../features/identity/session";
import type { Role } from "../../shared/types/api";
export function RoleGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const session = useSession();
  if (!roles.length) return children;
  if (!session) return <Navigate to="/login" replace />;
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
