import { useContext, useState } from "react";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { ReloadContext } from "../../../shared/ui/resource-context";
import { identityApi } from "../api/identity.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";
const roleOptions = [
    ["FMANAGER", "Facility Manager"],
    ["STAFF", "Facility Staff"],
    ["OPS_MGR", "Business Operation Manager"],
    ["ADMIN", "Admin"],
];
export default function UserManagementPage() {
    const facilities = useRemote(facilityApi.facilities);
    const reloadUsers = useContext(ReloadContext);
    const [role, setRole] = useState("STAFF");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    async function createStaff(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        data.role = role;
        if (role === "ADMIN" || role === "OPS_MGR")
            delete data.facilityCode;
        setBusy(true);
        setError("");
        setMessage("");
        try {
            await identityApi.createUser(data);
            form.reset();
            setRole("STAFF");
            reloadUsers();
            setMessage("Tài khoản đã hoạt động. Gửi mật khẩu tạm thời cho nhân sự qua kênh riêng an toàn.");
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không tạo được tài khoản.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<ResourcePage title="Quản trị tài khoản" description="Chỉ Admin được tạo tài khoản nội bộ. Mật khẩu tạm do Admin cấp và gửi riêng cho nhân sự." load={identityApi.users}>
      <form className="form-grid" onSubmit={(event) => void createStaff(event)}>
        <label>Họ và tên<input name="name" required minLength={2} maxLength={50}/></label>
        <label>Email<input name="email" type="email" autoComplete="email" required/></label>
        <label>Số điện thoại<input name="phone" type="tel" inputMode="numeric" required pattern="(03|05|07|08|09)[0-9]{8}"/></label>
        <label>CCCD<input name="cccd" inputMode="numeric" required pattern="[0-9]{12}" maxLength={12}/></label>
        <label>Tên đăng nhập<input name="username" autoComplete="off" required minLength={4} maxLength={20} pattern="[A-Za-z_][A-Za-z0-9_]{3,19}"/></label>
        <label>Loại tài khoản<select value={role} onChange={(event) => setRole(event.target.value)}>{roleOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {(role === "FMANAGER" || role === "STAFF") && <label>Cơ sở phụ trách<select name="facilityCode" required defaultValue="" disabled={facilities.busy || Boolean(facilities.error)}><option value="" disabled>{facilities.busy ? "Đang tải cơ sở..." : "Chọn cơ sở"}</option>{(facilities.data || []).filter((facility) => String(facility.status).toUpperCase() === "ACTIVE").map((facility) => <option key={String(facility.code)} value={String(facility.code)}>{String(facility.name)} ({String(facility.code)})</option>)}</select>{facilities.error && <small role="alert" className="error">{facilities.error}</small>}</label>}
        <label>Mật khẩu tạm thời<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="notice" role="status">{message}</p>}
        <p className="notice">Tài khoản hoạt động ngay sau khi tạo. Mật khẩu không được gửi qua API lần nữa; Admin cần chuyển cho nhân sự qua kênh riêng.</p>
        <button disabled={busy || ((role === "FMANAGER" || role === "STAFF") && !(facilities.data || []).length)}>{busy ? "Đang tạo..." : "Tạo tài khoản nội bộ"}</button>
      </form>
    </ResourcePage>);
}
