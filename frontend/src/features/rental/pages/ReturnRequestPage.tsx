import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function ReturnRequestPage() {
  return (
    <ResourcePage
      title="Yêu cầu trả kho"
      description="Gửi yêu cầu chưa dừng tính tiền hoặc khóa PIN. Staff nghiệm thu thực tế để kết thúc thuê."
      load={rentalApi.list}
    >
      <Form
        fields={[
          {
            name: "contractId",
            label: "Mã hợp đồng",
            type: "text",
            required: true,
          },
          {
            name: "requestedDate",
            label: "Ngày hẹn trả",
            type: "date",
            required: true,
          },
        ]}
        submit={rentalApi.returnRequest}
      />
    </ResourcePage>
  );
}
