import { formatPolicyValue, policyLabel } from "../../../shared/lib/policy-format";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";

const LEGACY_KEYS = new Set(["basePrices", "durationDiscounts", "extraFees", "depositRule", "generalRules"]);

async function loadRentalPolicies() {
    const data = await policyApi.get();
    if (!data || typeof data !== "object") return [];
    return Object.entries(data)
        .filter(([key]) => !LEGACY_KEYS.has(key))
        .map(([key, value]) => ({
            key,
            name: policyLabel(key),
            value: formatPolicyValue(key, value),
        }));
}

const policyColumns = [
    ["key", "Khóa chính sách"],
    ["name", "Tên chính sách & Quy định"],
    ["value", "Giá trị áp dụng"],
];

export default function RentalPolicyPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / VẬN HÀNH CHUỖI"
            title="Chính sách cho thuê & Điều kiện dịch vụ"
            description="Quy định số ngày giữ chỗ đặt trước, thời gian thông báo hủy để hoàn cọc, thời hạn gia hạn tối đa và thời gian ân hạn áp dụng toàn chuỗi."
            load={loadRentalPolicies}
            columns={policyColumns}
            childrenTitle="Điều chỉnh tham số chính sách thuê"
        >
            <Form
                fields={[
                    {
                        name: "key",
                        label: "Khóa chính sách cần sửa (vd: reservationHoldDays, refundCancelHours, renewalMaxMonths)",
                        type: "text",
                        required: true,
                    },
                    { name: "value", label: "Giá trị mới (số ngày / số giờ / số tháng)", type: "text", required: true },
                ]}
                label="Lưu tham số chính sách"
                submit={policyApi.save}
            />
        </ResourcePage>
    );
}
