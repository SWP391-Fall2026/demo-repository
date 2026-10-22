import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function RefundApprovalPage() {
    return (<ResourcePage title="Duyệt yêu cầu hoàn tiền" description="" load={billingApi.refunds}>
      <Form fields={[
            { name: "id", label: "Mã yêu cầu", type: "text", required: true },
            {
                name: "decision",
                label: "Quyết định",
                type: "text",
                options: ["APPROVE", "REJECT"],
            },
            { name: "approvedAmount", label: "Số tiền duyệt", type: "number" },
            {
                name: "reason",
                label: "Lý do quyết định",
                type: "textarea",
                required: true,
            },
        ]} submit={billingApi.decideRefund}/>
    </ResourcePage>);
}
