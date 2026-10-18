import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
export default function CatalogPage() {
  return (
    <ResourcePage
      title="Danh mục kho khả dụng"
      description="Chọn cơ sở và kiểm tra giá, diện tích, trạng thái trước khi đặt."
      load={facilityApi.units}
      columns={[
        ["code", "Mã kho"],
        ["facilityCode", "Chi nhánh"],
        ["type", "Loại"],
        ["sizeSqm", "Diện tích m²"],
        ["pricePerMonth", "Giá/tháng"],
        ["status", "Trạng thái"],
      ]}
    ></ResourcePage>
  );
}
