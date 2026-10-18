import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";
export default function CheckinPassPage() {
  return (
    <ResourcePage
      title="Đơn đặt và lịch hẹn nhận kho"
      description=""
      load={reservationApi.list}
    >
      <Form
        fields={[
          {
            name: "reservationId",
            label: "Mã đơn cần hủy",
            type: "text",
            required: true,
          },
          {
            name: "reason",
            label: "Lý do hủy",
            type: "textarea",
            required: true,
          },
        ]}
        submit={reservationApi.cancel}
      />
    </ResourcePage>
  );
}
