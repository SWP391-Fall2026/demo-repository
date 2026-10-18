import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";
export default function UserManagementPage() {
  return (
    <ResourcePage
      title="Quản trị tài khoản"
      description=""
      load={identityApi.users}
    >
      <Form
        fields={[
          { name: "name", label: "Họ và tên", type: "text", required: true },
          {
            name: "username",
            label: "Tên đăng nhập",
            type: "text",
            required: true,
          },
          { name: "email", label: "Email", type: "email", required: true },
          {
            name: "password",
            label: "Mật khẩu ban đầu",
            type: "password",
            required: true,
          },
          {
            name: "role",
            label: "Vai trò",
            type: "text",
            options: ["CUSTOMER", "STAFF", "FMANAGER", "OPS_MGR", "ADMIN"],
          },
          { name: "facilityCode", label: "Mã chi nhánh", type: "text" },
        ]}
        submit={identityApi.createUser}
      />
    </ResourcePage>
  );
}
