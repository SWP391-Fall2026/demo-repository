import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function ManageFacilitiesPage() {
    return (<ResourcePage title="Chuỗi chi nhánh" description="Tạo mới hoặc cập nhật chi nhánh: tên không trùng, hotline hợp lệ, giờ mở cửa tối đa 255 ký tự, ảnh HTTPS tối đa 2048 ký tự, trạng thái ACTIVE/INACTIVE/MAINTENANCE." load={facilityApi.facilities}>
      <Form fields={[
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
            { name: "openingHours", label: "Giờ mở cửa", type: "text" },
            { name: "imageUrl", label: "Ảnh đại diện (HTTPS)", type: "text" },
        ]} submit={facilityApi.createFacility}/>
      <Form label="Cập nhật chi nhánh" fields={[
            { name: "code", label: "Mã chi nhánh cần sửa", type: "text", required: true },
            { name: "name", label: "Tên cơ sở", type: "text" },
            { name: "address", label: "Địa chỉ", type: "text" },
            { name: "city", label: "Tỉnh/thành phố", type: "text" },
            { name: "hotline", label: "Hotline", type: "text" },
            { name: "openingHours", label: "Giờ mở cửa", type: "text" },
            { name: "imageUrl", label: "Ảnh đại diện (HTTPS)", type: "text" },
            { name: "status", label: "Trạng thái (ACTIVE/INACTIVE/MAINTENANCE)", type: "text" },
        ]} submit={facilityApi.updateFacility}/>
    </ResourcePage>);
}
