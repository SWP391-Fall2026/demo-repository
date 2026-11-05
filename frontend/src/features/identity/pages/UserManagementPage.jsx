import { useContext, useState } from "react";
import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { ReloadContext } from "../../../shared/ui/resource-context";
import { identityApi } from "../api/identity.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useRemote } from "../../../shared/api/use-remote";

const roleOptions = [
    ["FMANAGER", "Facility Manager (Quản lý chi nhánh)"],
    ["STAFF", "Facility Staff (Nhân viên vận hành)"],
    ["OPS_MGR", "Operations Manager (Quản lý chuỗi)"],
    ["ADMIN", "System Admin (Quản trị viên)"],
];

const userColumns = [
    ["name", "Họ và tên"],
    ["username", "Tên đăng nhập"],
    ["role", "Vai trò"],
    ["facilityCode", "Cơ sở phụ trách"],
    ["status", "Trạng thái"],
    ["phone", "Số điện thoại"],
    ["email", "Email"],
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
            setMessage("Tài khoản đã hoạt động thành công. Vui lòng gửi mật khẩu tạm thời cho nhân sự qua kênh bảo mật nội bộ.");
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không tạo được tài khoản.");
        }
        finally {
            setBusy(false);
        }
    }

    return (
        <ResourcePage
            eyebrow="STORAGE / PHÂN HỆ QUẢN TRỊ"
            title="Quản trị người dùng & nhân sự"
            description="Chỉ Admin được tạo tài khoản nội bộ. Mật khẩu tạm do Admin cấp và gửi riêng cho nhân sự qua kênh an toàn."
            load={identityApi.users}
            columns={userColumns}
            childrenTitle="Tạo tài khoản nhân sự mới"
        >
            <form className="form-grid" onSubmit={(event) => void createStaff(event)}>
                <label>
                    Họ và tên
                    <input name="name" required minLength={2} maxLength={50} placeholder="vd: Nguyễn Văn A" />
                </label>
                <label>
                    Email liên hệ
                    <input name="email" type="email" autoComplete="email" required placeholder="nhansu@storage.vn" />
                </label>
                <label>
                    Số điện thoại
                    <input name="phone" type="tel" inputMode="numeric" required pattern="(03|05|07|08|09)[0-9]{8}" placeholder="0901234567" />
                </label>
                <label>
                    Số CCCD (12 số)
                    <input name="cccd" inputMode="numeric" required pattern="[0-9]{12}" maxLength={12} placeholder="001099012345" />
                </label>
                <label>
                    Tên đăng nhập
                    <input name="username" autoComplete="off" required minLength={4} maxLength={20} pattern="[A-Za-z_][A-Za-z0-9_]{3,19}" placeholder="vd: staff_caugiay_02" />
                </label>
                <label>
                    Loại vai trò
                    <select value={role} onChange={(event) => setRole(event.target.value)}>
                        {roleOptions.map(([value, label]) => (
                            <option value={value} key={value}>{label}</option>
                        ))}
                    </select>
                </label>
                {(role === "FMANAGER" || role === "STAFF") && (
                    <label>
                        Cơ sở phụ trách
                        <select name="facilityCode" required defaultValue="" disabled={facilities.busy || Boolean(facilities.error)}>
                            <option value="" disabled>{facilities.busy ? "Đang tải cơ sở..." : "Chọn cơ sở chi nhánh"}</option>
                            {(facilities.data || []).filter((facility) => String(facility.status).toUpperCase() === "ACTIVE").map((facility) => (
                                <option key={String(facility.code)} value={String(facility.code)}>
                                    {String(facility.name)} ({String(facility.code)})
                                </option>
                            ))}
                        </select>
                        {facilities.error && <small role="alert" className="error">{facilities.error}</small>}
                    </label>
                )}
                <label>
                    Mật khẩu tạm thời
                    <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} placeholder="Tối thiểu 8 ký tự an toàn" />
                </label>

                {error && <p className="error alert-banner alert-danger" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
                {message && <p className="notice alert-banner alert-success" role="status" style={{ gridColumn: "1 / -1" }}>{message}</p>}

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
                        🔒 Tài khoản hoạt động ngay sau khi tạo. Admin lưu trữ và bàn giao mật khẩu bảo mật cho nhân sự.
                    </p>
                    <button
                        className="btn-figma btn-primary-dark"
                        disabled={busy || ((role === "FMANAGER" || role === "STAFF") && !(facilities.data || []).length)}
                    >
                        {busy ? "Đang xử lý…" : "Tạo tài khoản nội bộ"}
                    </button>
                </div>
            </form>
        </ResourcePage>
    );
}
