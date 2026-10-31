import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function ReturnRequestPage() {
    return (<ResourcePage title="Yêu cầu trả kho" description="Khách chọn kho cần trả, chọn ngày hẹn trả kho thực tế, nhập lý do kết thúc thuê và gửi yêu cầu. Kho đang có công nợ chưa thanh toán thì bị từ chối. Yêu cầu tạo ở trạng thái CHECKOUT_REQUESTED; chưa dừng tính tiền hoặc khóa PIN cho đến khi Staff nghiệm thu." load={rentalApi.list} columns={[
            ["id", "Mã hợp đồng"],
            ["facilityCode", "Cơ sở"],
            ["status", "Trạng thái"],
            ["endAt", "Ngày kết thúc dự kiến"],
        ]}>
      <Form label="Gửi yêu cầu trả kho" fields={[
            {
                name: "contractId",
                label: "Mã hợp đồng",
                type: "text",
                required: true,
            },
            {
                name: "requestedDate",
                label: "Ngày hẹn trả kho thực tế",
                type: "date",
                required: true,
            },
            {
                name: "reason",
                label: "Lý do kết thúc thuê",
                type: "textarea",
                required: true,
            },
        ]} submit={rentalApi.returnRequest}/>
    </ResourcePage>);
}
