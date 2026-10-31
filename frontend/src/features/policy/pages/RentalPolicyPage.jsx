import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { policyApi } from "../api/policy.api";
export default function RentalPolicyPage() {
    return (<ResourcePage title="Chính sách cho thuê" description="reservationHoldDays: số ngày giữ reservation sau khi thanh toán cọc (phải > 0); refundCancelHours: số giờ báo trước để được hoàn cọc khi hủy (>= 0); renewalMaxMonths: số tháng gia hạn tối đa; gracePeriodDays: ngày ân hạn. Các giá trị áp dụng cho reservation mới; reservation hết hạn chuyển NO_SHOW." load={policyApi.get}>
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
