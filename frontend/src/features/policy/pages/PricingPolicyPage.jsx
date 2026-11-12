import { useRemote } from "../../../shared/api/use-remote";
import { display, sortByNewest } from "../../../shared/lib/format";
import { formatPolicyValue, policyLabel } from "../../../shared/lib/policy-format";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";

const LEGACY_KEYS = new Set(["basePrices", "durationDiscounts", "extraFees", "depositRule", "generalRules"]);

async function loadPricingPolicies() {
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
    ["name", "Tên chính sách & Phạm vi áp dụng"],
    ["value", "Giá trị hiện hành"],
];

export default function PricingPolicyPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / VẬN HÀNH CHUỖI"
            title="Biểu giá & Chính sách toàn chuỗi"
            description="Xem bảng giá chuẩn, chiết khấu kỳ hạn và phụ phí toàn chuỗi; cấu hình biểu giá riêng từng chi nhánh cho các đơn đặt chỗ mới."
            load={loadPricingPolicies}
            columns={policyColumns}
            childrenTitle="Cập nhật biểu giá & Chính sách"
        >
            <div className="policy-config-grid">
                <section className="policy-config-section">
                    <h3>Giá riêng theo chi nhánh</h3>
                    <p>Mức giá tại cơ sở sẽ ưu tiên áp dụng cho các đơn đặt mới thay vì giá chuẩn chuỗi.</p>
                    <Form
                        label="Lưu giá riêng tại cơ sở"
                        fields={[
                            { name: "facilityCode", label: "Mã cơ sở (vd: HN-CG, HCM-Q7, HCM-TB)", type: "text", required: true },
                            { name: "unitType", label: "Loại kho", options: ["S", "M", "L", "CLIMATE"], required: true },
                            { name: "pricePerMonth", label: "Giá thuê mỗi tháng (VND)", type: "number", required: true },
                        ]}
                        submit={policyApi.saveFacilityPrice}
                    />
                </section>
                <section className="policy-config-section">
                    <h3>Điều chỉnh khóa chính sách chuỗi</h3>
                    <p>Cập nhật giá chuẩn hoặc tỷ lệ chiết khấu áp dụng cho toàn hệ thống.</p>
                    <Form
                        label="Lưu thay đổi chính sách"
                        fields={[
                            {
                                name: "key",
                                label: "Khóa chính sách cần đổi (vd: price.S, cleaningFee)",
                                type: "text",
                                required: true,
                            },
                            { name: "value", label: "Giá trị mới", type: "number", required: true },
                        ]}
                        submit={policyApi.save}
                    />
                </section>
            </div>
            <PolicyHistory />
        </ResourcePage>
    );
}

function PolicyHistory() {
    const history = useRemote(policyApi.history);
    const rows = sortByNewest(history.data);
    if (history.busy) return <p style={{ padding: "16px", color: "#64748B" }}>Đang tải lịch sử điều chỉnh…</p>;
    if (history.error) return <p className="error alert-banner alert-danger">{history.error}</p>;
    if (!rows.length) return <p style={{ padding: "16px", color: "#64748B" }}>Chưa có lần đổi chính sách nào.</p>;
    return (
        <div className="table-scroll" style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B192C", marginBottom: "12px" }}>
                Lịch sử điều chỉnh chính sách (Audit Trail)
            </h3>
            <table>
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Chính sách thay đổi</th>
                        <th>Chi tiết biến động</th>
                        <th>Người thực hiện</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={String(r.id)}>
                            <td>{display(r.createdAt ?? r.timeStr)}</td>
                            <td><strong>{display(r.entityId || r.action)}</strong></td>
                            <td>{display(r.detail)}</td>
                            <td><span className="badge" style={{ background: "#EFF6FF", color: "#0066FF" }}>{display(r.userName)}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
