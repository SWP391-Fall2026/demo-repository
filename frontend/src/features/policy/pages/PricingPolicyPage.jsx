import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";
export default function PricingPolicyPage() {
    return (<ResourcePage title="Khung giá và phụ phí" description="Giá chuẩn: price.S/M/L/CLIMATE; khoảng cho phép: price.min.S và price.max.S (tương tự các loại khác). Phụ phí: cleaningFee, overdueDailyFee, newLockFee; discount.3/6/12 dùng tỷ lệ 0–1." load={policyApi.get}>
      <Form fields={[
            {
                name: "key",
                label: "Khóa giá hoặc phí",
                type: "text",
                required: true,
            },
            { name: "value", label: "Giá trị", type: "number", required: true },
        ]} submit={policyApi.save}/>
    </ResourcePage>);
}
