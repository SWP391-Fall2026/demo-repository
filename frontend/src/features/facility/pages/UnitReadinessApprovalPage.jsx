import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";

const readinessColumns = [
    ["code", "Mã kho"],
    ["type", "Loại kho"],
    ["sizeSqm", "Diện tích (m²)"],
    ["status", "Trạng thái hiện tại"],
    ["readinessStatus", "Duyệt sẵn sàng"],
    ["pricePerMonth", "Giá thuê / tháng"],
];

export default function UnitReadinessApprovalPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / PHÊ DUYỆT VẬN HÀNH"
            title="Duyệt kho sẵn sàng kinh doanh"
            description="Facility Manager kiểm tra xác nhận kho đã hoàn tất vệ sinh và sửa chữa kỹ thuật để đưa trở lại trạng thái khả dụng cho thuê."
            load={facilityApi.managedUnits}
            columns={readinessColumns}
            childrenTitle="Phê duyệt khoang lưu trữ"
        >
            <Form
                fields={[
                    { name: "code", label: "Mã kho cần duyệt (vd: HN-CG-001)", type: "text", required: true },
                    {
                        name: "reason",
                        label: "Ghi chú phê duyệt / Biên bản kiểm tra",
                        type: "textarea",
                        required: true,
                    },
                ]}
                label="Xác nhận duyệt kho AVAILABLE"
                submit={facilityApi.approveReady}
            />
        </ResourcePage>
    );
}
