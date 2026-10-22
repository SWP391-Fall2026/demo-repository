import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function PaymentHistoryPage() {
    return (<ResourcePage title="Lịch sử thanh toán" description="Mỗi dòng là một lần thanh toán. Dùng mã giao dịch PAID gốc khi gửi yêu cầu hoàn tiền thuê hoặc tiền cọc." load={billingApi.payments} columns={[
            ["id", "Giao dịch gốc"],
            ["facilityCode", "Cơ sở"],
            ["invoiceType", "Khoản thu"],
            ["amount", "Số tiền"],
            ["status", "Trạng thái"],
            ["paymentMethod", "Phương thức"],
            ["createdAt", "Thời điểm"],
        ]}/>);
}
