import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";

const assignmentColumns = [
    ["name", "Họ và tên"],
    ["username", "Tên đăng nhập"],
    ["role", "Vai trò"],
    ["facilityCode", "Cơ sở phụ trách"],
    ["status", "Trạng thái"],
    ["phone", "Số điện thoại"],
    ["email", "Email"],
];

export default function StaffFacilityAssignmentPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / PHÂN HỆ QUẢN TRỊ"
            title="Phân công cơ sở & Trạng thái tài khoản"
            description="Điều chỉnh chi nhánh trực thuộc, cập nhật nhóm vai trò và kích hoạt hoặc tạm khóa tài khoản nhân sự."
            load={identityApi.users}
            columns={assignmentColumns}
            childrenTitle="Cập nhật vai trò & cơ sở trực thuộc"
        >
            <Form
                fields={[
                    { name: "id", label: "Mã người dùng (ID tài khoản trong bảng dưới)", type: "text", required: true },
                    {
                        name: "role",
                        label: "Vai trò cập nhật",
                        type: "text",
                        options: ["STAFF", "FMANAGER", "OPS_MGR", "ADMIN", "CUSTOMER"],
                    },
                    { name: "facilityCode", label: "Mã cơ sở chi nhánh (vd: HN-CG, HCM-Q7, HCM-TB)", type: "text" },
                    {
                        name: "status",
                        label: "Trạng thái tài khoản",
                        type: "text",
                        options: ["ACTIVE", "LOCKED", "DISABLED"],
                    },
                ]}
                label="Lưu phân công"
                submit={identityApi.updateUser}
            />
        </ResourcePage>
    );
}
