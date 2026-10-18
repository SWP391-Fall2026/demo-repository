import { useParams } from "react-router-dom";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function InvoicePaymentPage() {
  const { invoiceId } = useParams();
  return (
    <ResourcePage
      title="Hóa đơn và thanh toán"
      description="Thanh toán hiện chạy mô phỏng. Chọn mã hóa đơn PENDING trong danh sách; thanh toán tiền thuê kỳ đầu sau khi Manager gán kho."
      load={billingApi.invoices}
    >
      <Form
        fields={[
          {
            name: "invoiceId",
            label: "Mã hóa đơn",
            defaultValue: invoiceId === "all" ? "" : invoiceId,
            type: "text",
            required: true,
          },
          {
            name: "paymentMethod",
            label: "Phương thức mô phỏng",
            type: "text",
            options: ["MOCK_CARD", "BANK_TRANSFER_QR", "CASH_AT_COUNTER"],
          },
        ]}
        submit={billingApi.pay}
      />
    </ResourcePage>
  );
}
