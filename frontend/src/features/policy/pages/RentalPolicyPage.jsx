import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";
export default function RentalPolicyPage() {
    return (<ResourcePage title="Chính sách cho thuê" description="" load={policyApi.get}>
      <Form fields={[
            {
                name: "key",
                label: "Khóa chính sách",
                type: "text",
                required: true,
            },
            { name: "value", label: "Giá trị", type: "text", required: true },
        ]} submit={policyApi.save}/>
    </ResourcePage>);
}
