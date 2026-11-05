import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function ManageFacilitiesPage() {
    return (<ResourcePage eyebrow="STORAGE / VẬN HÀNH CHUỖI" title="Quản lý mạng lưới chi nhánh cơ sở" description="Quản trị thông tin chi nhánh, địa chỉ, đường dây nóng và quy mô diện tích mặt bằng kho." load={facilityApi.facilities} columns={[
      ["code", "Mã cơ sở"],
      ["name", "Tên cơ sở"],
      ["address", "Địa chỉ"],
      ["city", "Tỉnh / thành phố"],
      ["totalAreaSqm", "Diện tích mặt bằng (m²)"],
      ["status", "Trạng thái"],
    ]} childrenTitle="Thêm hoặc cập nhật cơ sở">
      <Form fields={[
            { name: "code", label: "Mã chi nhánh", type: "text", required: true },
            { name: "name", label: "Tên cơ sở", type: "text", required: true },
            { name: "address", label: "Địa chỉ", type: "text", required: true },
            { name: "totalAreaSqm", label: "Diện tích mặt bằng (m²)", type: "number", required: true },
            {
                name: "city",
                label: "Tỉnh/thành phố",
                type: "text",
                required: true,
            },
            { name: "hotline", label: "Hotline", type: "text" },
            { name: "openingHours", label: "Giờ mở cửa", type: "text" },
            { name: "imageUrl", label: "Ảnh đại diện (HTTPS)", type: "text" },
        ]} submit={facilityApi.createFacility}/>
      <Form label="Cập nhật chi nhánh" fields={[
            { name: "code", label: "Mã chi nhánh cần sửa", type: "text", required: true },
            { name: "name", label: "Tên cơ sở", type: "text" },
            { name: "address", label: "Địa chỉ", type: "text" },
            { name: "totalAreaSqm", label: "Diện tích mặt bằng (m²)", type: "number" },
            { name: "city", label: "Tỉnh/thành phố", type: "text" },
            { name: "hotline", label: "Hotline", type: "text" },
            { name: "openingHours", label: "Giờ mở cửa", type: "text" },
            { name: "imageUrl", label: "Ảnh đại diện (HTTPS)", type: "text" },
            { name: "status", label: "Trạng thái (ACTIVE/INACTIVE/MAINTENANCE)", type: "text" },
        ]} submit={facilityApi.updateFacility}/>
    </ResourcePage>);
}
