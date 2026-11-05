import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";
export default function PaymentHistoryPage() {
    return (<ResourcePage eyebrow="STORAGE / LỊCH SỬ THANH TOÁN" title="Lịch sử thanh toán & Hóa đơn" description="Tra cứu chi tiết các giao dịch thanh toán tiền cọc, tiền thuê kho và phụ phí phát sinh." load={billingApi.payments} columns={[
            ["id", "Mã giao dịch"],
            ["facilityCode", "Cơ sở"],
            ["invoiceType", "Khoản thu"],
            ["amount", "Số tiền"],
            ["status", "Trạng thái"],
            ["paymentMethod", "Phương thức"],
            ["createdAt", "Thời điểm"],
        ]}/>);
}
