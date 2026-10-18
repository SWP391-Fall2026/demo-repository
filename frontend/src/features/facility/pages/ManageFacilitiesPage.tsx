import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function ManageFacilitiesPage() {
  return (
    <ResourcePage
      title="Chuỗi chi nhánh"
      description=""
      load={facilityApi.facilities}
    >
      <Form
        fields={[
          { name: "code", label: "Mã chi nhánh", type: "text", required: true },
          { name: "name", label: "Tên cơ sở", type: "text", required: true },
          { name: "address", label: "Địa chỉ", type: "text", required: true },
          {
            name: "city",
            label: "Tỉnh/thành phố",
            type: "text",
            required: true,
          },
          { name: "hotline", label: "Hotline", type: "text" },
        ]}
        submit={facilityApi.createFacility}
      />
    </ResourcePage>
  );
}
