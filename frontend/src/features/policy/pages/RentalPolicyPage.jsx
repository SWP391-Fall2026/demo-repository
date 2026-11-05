import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";

const policyLabels = {
    "discount.3": "Chiết khấu kỳ hạn 3 tháng (5%)",
    "discount.6": "Chiết khấu kỳ hạn 6 tháng (10%)",
    "discount.12": "Chiết khấu kỳ hạn 12 tháng (15%)",
    "price.S": "Giá chuẩn kho S (2 m²)",
    "price.M": "Giá chuẩn kho M (5 m²)",
    "price.L": "Giá chuẩn kho L (10 m²)",
    "price.CLIMATE": "Giá chuẩn kho lạnh CLIMATE",
    "depositMonths": "Số tháng tiền cọc đảm bảo",
    "reservationHoldDays": "Thời gian giữ buồng sau khi cọc (ngày)",
    "refundCancelHours": "Thời gian báo trước hủy để hoàn cọc (giờ)",
    "renewalMaxMonths": "Kỳ hạn gia hạn hợp đồng tối đa (tháng)",
    "gracePeriodDays": "Số ngày ân hạn trước khi phạt quá hạn (ngày)",
    "cleaningFee": "Phí vệ sinh buồng kho (VND)",
    "overdueDailyFee": "Phí phạt quá hạn mỗi ngày (VND)",
    "newLockFee": "Phí cấp mã khóa / chìa mới (VND)",
};

async function loadRentalPolicies() {
    const data = await policyApi.get();
    if (!data || typeof data !== "object") return [];
    return Object.entries(data).map(([key, value]) => ({
        key,
        name: policyLabels[key] || key,
        value: Number.isFinite(Number(value)) && (/price|fee/i.test(key) || Number(value) >= 1000) ? Number(value) : value,
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
