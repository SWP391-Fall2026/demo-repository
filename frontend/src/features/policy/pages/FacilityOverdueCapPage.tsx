import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";
export default function FacilityOverdueCapPage() {
  return (
    <ResourcePage
      title="Trần phí quá hạn tại cơ sở"
      description="Trần áp dụng trên giá thuê tháng hiện hành tại thời điểm tính phí; không có grace period."
      load={policyApi.get}
    >
      <Form
        fields={[
          {
            name: "percentage",
            label: "Tỷ lệ trần (%)",
            type: "number",
            defaultValue: 50,
            required: true,
          },
        ]}
        submit={policyApi.cap}
      />
    </ResourcePage>
  );
}
