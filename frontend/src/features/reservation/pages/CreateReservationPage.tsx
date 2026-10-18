import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";
export default function CreateReservationPage() {
  const [params] = useSearchParams();
  const [created, setCreated] = useState("");
  return (
    <ResourcePage
      title="Đặt giữ chỗ"
      description="Giá được giữ trong 24 giờ chờ cọc. Đơn hết hạn cần đặt lại theo giá mới."
      load={reservationApi.list}
    >
      <Form
        fields={[
          {
            name: "facilityCode",
            label: "Mã cơ sở",
            defaultValue:
              params.get("facility") || params.get("facilityCode") || "HN-CG",
            type: "text",
            required: true,
          },
          {
            name: "unitType",
            label: "Loại kho",
            defaultValue: params.get("type") || "S",
            type: "text",
            options: ["S", "M", "L", "CLIMATE"],
          },
          {
            name: "startDate",
            label: "Ngày bắt đầu thuê",
            type: "date",
            required: true,
          },
          {
            name: "rentalStartAt",
            label: "Thời điểm bắt đầu thuê",
            type: "datetime-local",
            required: true,
          },
          {
            name: "appointmentAt",
            label: "Giờ hẹn nhận kho",
            type: "datetime-local",
            required: true,
          },
          {
            name: "durationMonths",
            label: "Số tháng thuê",
            type: "number",
            defaultValue: 1,
            required: true,
          },
        ]}
        submit={async (d) => {
          const r = await reservationApi.create(d);
          setCreated(String(r.id));
          return r;
        }}
      />
      {created && (
        <Link className="button" to="/invoices/all/pay">
          Xem hóa đơn và thanh toán cọc
        </Link>
      )}
    </ResourcePage>
  );
}
