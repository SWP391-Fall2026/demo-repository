import { Navigate, Link } from "react-router-dom";
import { useSession } from "../../features/identity/session";
import { landingForRole } from "../../features/identity/lib/auth-navigation";

export function RoleGuard({ roles, children }) {
    const session = useSession();
    if (!roles.length)
        return children;
    if (!session)
        return <Navigate to="/login" replace />;
    if (!roles.includes(session.user.role)) {
        const isBackoffice = session.user.role && session.user.role !== "CUSTOMER";
        const homeUrl = isBackoffice ? landingForRole(session.user.role) : "/";
        return (
            <section className="card empty">
                <h1>Không có quyền truy cập</h1>
                <p>Trang này thuộc vai trò khác trong hệ thống.</p>
                <Link to={homeUrl}>{isBackoffice ? "Về bàn làm việc" : "Về trang chủ"}</Link>
            </section>
        );
    }
    return children;
}
