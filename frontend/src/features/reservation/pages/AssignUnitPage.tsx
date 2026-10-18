import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";
export default function AssignUnitPage() {
  return (
    <ResourcePage
      title="Gán phòng cho đơn đặt"
      description=""
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
          {
            name: "unitCode",
            label: "Mã phòng phù hợp",
            type: "text",
            required: true,
          },
        ]}
        submit={reservationApi.assign}
      />
    </ResourcePage>
  );
}
