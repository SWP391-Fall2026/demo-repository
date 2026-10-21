import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function RefundConfirmationPage() {
    return (<ResourcePage title="Xác nhận kết quả hoàn thủ công" description="Staff tải bằng chứng; Facility Manager xác nhận kết quả. Hai vai trò được tách biệt." load={billingApi.refunds}>
      <Form fields={[
            { name: "id", label: "Mã yêu cầu", type: "text", required: true },
            {
                name: "reason",
                label: "Ghi chú xác minh bằng chứng",
                type: "textarea",
                required: true,
            },
        ]} submit={billingApi.confirmRefund}/>
    </ResourcePage>);
}
