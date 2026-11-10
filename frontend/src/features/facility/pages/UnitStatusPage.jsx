import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
import UnitReadinessAction from "../components/UnitReadinessAction";

const unitStatusColumns = [
    ["code", "Mã kho"],
    ["type", "Loại kho"],
    ["sizeSqm", "Diện tích (m²)"],
    ["status", "Trạng thái hiện tại"],
    ["readinessStatus", "Duyệt sẵn sàng", (row, reload) => <UnitReadinessAction row={row} reload={reload} mode="report" />],
    ["floor", "Tầng"],
];

export default function UnitStatusPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / VẬN HÀNH CƠ SỞ"
            title="Tình trạng và vệ sinh khoang lưu trữ"
            description="Staff kiểm tra buồng kho sau trả phòng hoặc bảo trì định kỳ, ghi nhận hoàn tất vệ sinh và trình Facility Manager phê duyệt."
            load={facilityApi.managedUnits}
            columns={unitStatusColumns}
            childrenTitle="Báo cáo hoàn tất vệ sinh"
        >
            <Form
                fields={[
                    { name: "code", label: "Mã kho đã dọn dẹp (vd: HN-CG-001)", type: "text", required: true },
                    {
                        name: "notes",
                        label: "Chi tiết hiện trạng vệ sinh & khử khuẩn",
                        type: "textarea",
                        required: true,
                    },
                ]}
                label="Gửi báo cáo vệ sinh"
                submit={facilityApi.ready}
            />
        </ResourcePage>
    );
}
