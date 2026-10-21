import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function CustomerRefundRequestsPage() {
    return (<ResourcePage title="Yêu cầu hoàn tiền" description="Tách khoản tiền thuê và tiền cọc. Yêu cầu chờ duyệt giữ hạn mức ngay khi tạo." load={billingApi.refunds}>
      <Form fields={[
            {
                name: "paymentId",
                label: "Giao dịch gốc",
                type: "text",
                required: true,
            },
            {
                name: "amount",
                label: "Số tiền yêu cầu",
                type: "number",
                required: true,
            },
            {
                name: "exceptionRequested",
                label: "Yêu cầu hoàn ngoại lệ",
                type: "checkbox",
            },
            { name: "reason", label: "Lý do", type: "textarea", required: true },
        ]} submit={billingApi.requestRefund}/>
      <h3>Hủy yêu cầu đang chờ duyệt</h3>
      <Form fields={[{ name: "id", label: "Mã yêu cầu hoàn", required: true }]} label="Hủy yêu cầu và giải phóng hạn mức" submit={billingApi.cancelRefund}/>
    </ResourcePage>);
}
