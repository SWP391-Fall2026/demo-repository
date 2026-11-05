import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";

const accessColumns = [
    ["id", "Mã hợp đồng"],
    ["unitCode", "Kho lưu trữ"],
    ["facilityCode", "Cơ sở"],
    ["customerName", "Khách hàng"],
    ["status", "Trạng thái hợp đồng"],
];

export default function AccessSimulatorPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / KIỂM TRA TRUY CẬP"
            title="Mô phỏng kiểm tra mã PIN điện tử"
            description="Kiểm tra xác thực quyền truy cập cửa và buồng kho tự phục vụ dựa trên mã PIN 6 chữ số hợp lệ."
            load={rentalApi.list}
            columns={accessColumns}
            childrenTitle="Mô phỏng nhập mã PIN cửa / buồng kho"
        >
            <Form
                fields={[
                    { name: "unitCode", label: "Mã buồng kho (vd: HN-CG-001)", type: "text", required: true },
                    { name: "pin", label: "Mã PIN 6 chữ số cần thử", type: "text", required: true },
                ]}
                label="Kiểm tra quyền mở khóa"
                submit={rentalApi.verifyPin}
            />
        </ResourcePage>
    );
}
