import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function ManageUnitsPage() {
  return (
    <ResourcePage
      title="Quản lý kho tại chi nhánh"
      description=""
      load={facilityApi.managedUnits}
    >
      <Form
        fields={[
          { name: "code", label: "Mã kho", type: "text", required: true },
          {
            name: "type",
            label: "Loại kho",
            type: "text",
            options: ["S", "M", "L", "CLIMATE"],
          },
          {
            name: "sizeSqm",
            label: "Diện tích m²",
            type: "number",
            required: true,
          },
          {
            name: "pricePerMonth",
            label: "Giá thuê tháng",
            type: "number",
            required: true,
          },
          { name: "floor", label: "Tầng", type: "number" },
        ]}
        submit={facilityApi.createUnit}
      />
      <h3>Cập nhật giá kho (trong khoảng Ops cho phép)</h3>
      <Form
        fields={[
          { name: "code", label: "Mã kho", required: true },
          {
            name: "pricePerMonth",
            label: "Giá thuê tháng",
            type: "number",
            required: true,
          },
        ]}
        submit={facilityApi.updateUnit}
      />
    </ResourcePage>
  );
}
