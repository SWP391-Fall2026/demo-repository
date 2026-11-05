import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { billingApi } from "../api/billing.api";

const refundColumns = [
    ["id", "Mã yêu cầu"],
    ["reservationId", "Mã đặt chỗ"],
    ["contractId", "Mã hợp đồng"],
    ["refundType", "Khoản hoàn"],
    ["requestedAmount", "Tiền yêu cầu hoàn"],
    ["approvedAmount", "Tiền duyệt hoàn"],
    ["status", "Trạng thái hồ sơ"],
    ["reason", "Lý do hoàn"],
];

export default function RefundApprovalPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / TÀI CHÍNH CƠ SỞ"
            title="Duyệt yêu cầu hoàn tiền"
            description="Facility Manager xem xét yêu cầu hoàn cọc hoặc hoàn tiền thuê, thẩm định lý do và quyết định duyệt hoặc từ chối."
            load={billingApi.refunds}
            columns={refundColumns}
            childrenTitle="Quyết định phê duyệt hoàn tiền"
        >
            <Form
                fields={[
                    { name: "id", label: "Mã yêu cầu hoàn tiền (ID trong bảng dưới)", type: "text", required: true },
                    {
                        name: "decision",
                        label: "Quyết định xử lý",
                        type: "text",
                        options: ["APPROVE", "REJECT"],
                    },
                    { name: "approvedAmount", label: "Số tiền phê duyệt hoàn (VND)", type: "number" },
                    {
                        name: "reason",
                        label: "Lý do và ghi chú quyết định",
                        type: "textarea",
                        required: true,
                    },
                ]}
                label="Lưu quyết định hoàn tiền"
                submit={billingApi.decideRefund}
            />
        </ResourcePage>
    );
}
