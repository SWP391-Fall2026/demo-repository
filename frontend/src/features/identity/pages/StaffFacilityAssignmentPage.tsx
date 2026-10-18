import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { identityApi } from "../api/identity.api";
export default function StaffFacilityAssignmentPage() {
  return (
    <ResourcePage
      title="Phân quyền và chi nhánh"
      description=""
      load={identityApi.users}
    >
      <Form
        fields={[
          { name: "id", label: "Mã người dùng", type: "text", required: true },
          {
            name: "role",
            label: "Vai trò",
            type: "text",
            options: ["STAFF", "FMANAGER", "OPS_MGR", "ADMIN", "CUSTOMER"],
          },
          { name: "facilityCode", label: "Mã cơ sở", type: "text" },
          {
            name: "status",
            label: "Trạng thái",
            type: "text",
            options: ["ACTIVE", "LOCKED", "DISABLED"],
          },
        ]}
        submit={identityApi.updateUser}
      />
    </ResourcePage>
  );
}
