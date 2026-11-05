import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";

async function loadCapPolicy() {
    const data = await policyApi.get();
    if (!data || typeof data !== "object") return [];
    return Object.entries(data).map(([key, value]) => ({
        key,
        value,
    }));
}

const capColumns = [
    ["key", "Khóa chính sách"],
    ["value", "Giá trị thiết lập"],
];

export default function FacilityOverdueCapPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / CHÍNH SÁCH CƠ SỞ"
            title="Trần phí quá hạn tại cơ sở"
            description="Mức trần áp dụng trên giá thuê tháng hiện hành tại thời điểm phát sinh phí quá hạn nhằm đảm bảo quyền lợi khách hàng."
            load={loadCapPolicy}
            columns={capColumns}
            childrenTitle="Cập nhật tỷ lệ trần phí"
        >
            <Form
                fields={[
                    {
                        name: "percentage",
                        label: "Tỷ lệ trần phí quá hạn (%) so với giá thuê tháng",
                        type: "number",
                        defaultValue: 50,
                        required: true,
                    },
                ]}
                label="Lưu tỷ lệ trần"
                submit={policyApi.cap}
            />
        </ResourcePage>
    );
}
