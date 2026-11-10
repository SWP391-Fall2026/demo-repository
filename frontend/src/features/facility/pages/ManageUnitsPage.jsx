import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
import UnitReadinessAction from "../components/UnitReadinessAction";

const unitColumns = [
    ["code", "Mã kho"],
    ["type", "Loại kho"],
    ["sizeSqm", "Diện tích (m²)"],
    ["pricePerMonth", "Giá thuê / tháng"],
    ["floor", "Tầng"],
    ["status", "Trạng thái kho"],
    ["readinessStatus", "Duyệt sẵn sàng", (row, reload) => <UnitReadinessAction row={row} reload={reload} mode="approve" />],
];

export default function ManageUnitsPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / QUẢN LÝ CƠ SỞ"
            title="Quản lý khoang lưu trữ tại chi nhánh"
            description="Tạo mới buồng kho vật lý, cập nhật biểu giá cho phép và theo dõi hiện trạng vận hành. Kho sau trả phòng (CLEANING / MAINTENANCE) sau khi Staff báo hoàn tất vệ sinh sẽ hiện nút 'Duyệt sẵn sàng' ngay trong bảng."
            load={facilityApi.managedUnits}
            columns={unitColumns}
            childrenTitle="Tạo mới & Điều chỉnh biểu giá khoang"
        >
            <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B192C", margin: "0 0 12px" }}>
                    Tạo mới khoang lưu trữ
                </h3>
                <Form
                    fields={[
                        { name: "code", label: "Mã kho (vd: HN-CG-015)", type: "text", required: true },
                        {
                            name: "type",
                            label: "Loại kho",
                            type: "text",
                            options: ["S", "M", "L", "CLIMATE"],
                        },
                        {
                            name: "sizeSqm",
                            label: "Diện tích (m²)",
                            type: "number",
                            required: true,
                        },
                        {
                            name: "pricePerMonth",
                            label: "Giá thuê tháng (VND)",
                            type: "number",
                            required: true,
                        },
                        { name: "floor", label: "Tầng", type: "number" },
                        { name: "imageUrl", label: "Link ảnh khoang (tùy chọn)", type: "url" },
                        { name: "imageAltText", label: "Mô tả ảnh", type: "text" },
                    ]}
                    label="Tạo khoang mới"
                    submit={facilityApi.createUnit}
                />
            </div>

            <div style={{ paddingTop: "20px", borderTop: "1px solid #E2E8F0" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B192C", margin: "0 0 12px" }}>
                    Cập nhật giá thuê khoang (trong biên độ cho phép)
                </h3>
                <Form
                    fields={[
                        { name: "code", label: "Mã kho cần đổi giá", required: true },
                        {
                            name: "pricePerMonth",
                            label: "Giá thuê tháng mới (VND)",
                            type: "number",
                            required: true,
                        },
                        { name: "imageUrl", label: "Cập nhật link ảnh (tùy chọn)", type: "url" },
                        { name: "imageAltText", label: "Mô tả ảnh mới", type: "text" },
                    ]}
                    label="Lưu giá mới"
                    submit={facilityApi.updateUnit}
                />
            </div>
        </ResourcePage>
    );
}
