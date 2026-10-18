import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";
export default function ReservationLookupPage() {
  return (
    <ResourcePage
      title="Tra cứu và tiếp nhận khách"
      description="Ghi nhận khách đã đến quầy để tránh NO_SHOW nhầm khi đang làm thủ tục."
      load={reservationApi.list}
    >
      <Form
        fields={[
          {
            name: "reservationId",
            label: "Mã đặt chỗ",
            type: "text",
            required: true,
          },
        ]}
        submit={reservationApi.arrived}
      />
    </ResourcePage>
  );
}
