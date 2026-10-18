import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function HandoverPage() {
  return (
    <ResourcePage
      title="Check-in và bàn giao kho"
      description="Chỉ hoàn tất khi đã có phòng được gán, cọc và tiền thuê kỳ đầu đã thanh toán."
      load={rentalApi.list}
    >
      <Form
        fields={[
          {
            name: "reservationId",
            label: "Mã đặt chỗ",
            type: "text",
            required: true,
          },
          {
            name: "unitConditionNotes",
            label: "Hiện trạng kho",
            type: "textarea",
            required: true,
          },
          {
            name: "customerSignatureConfirmed",
            label: "Khách đã kiểm tra và đồng ý nhận bàn giao",
            type: "checkbox",
            required: true,
          },
        ]}
        submit={rentalApi.handover}
      />
    </ResourcePage>
  );
}
