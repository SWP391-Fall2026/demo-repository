import { useState } from "react";
import { Link } from "react-router-dom";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
export default function MyRentalsPage() {
  const { data, reload } = useRemote(rentalApi.list);
  const [visible, setVisible] = useState<string | null>(null);
  return (
    <>
      <ResourcePage
        title="Kho đang thuê và hợp đồng"
        description="Yêu cầu trả kho giữ nguyên hiệu lực hợp đồng và PIN cho đến khi Staff hoàn tất nghiệm thu."
        load={rentalApi.list}
      >
        <Form
          fields={[
            { name: "unitCode", label: "Mã kho", required: true },
            {
              name: "newPin",
              label: "PIN mới 6 chữ số",
              type: "password",
              required: true,
            },
          ]}
          submit={rentalApi.updatePin}
          onSuccess={reload}
        />
        <Link className="button secondary" to="/rentals/return">
          Yêu cầu trả kho
        </Link>{" "}
        <Link className="button secondary" to="/rentals/renew">
          Gia hạn
        </Link>
      </ResourcePage>
      <div className="metric-grid">
        {data?.map((c) => (
          <article className="card" key={String(c.id)}>
            <h2>{display(c.unitCode)}</h2>
            <p>{display(c.id)}</p>
            <p>
              {display(c.status)} · {money(c.monthlyFee)}/tháng
            </p>
            <p>Hết hạn: {display(c.endAt)}</p>
            {Boolean(c.pinCode) && (
              <>
                <button
                  className="secondary"
                  onClick={() =>
                    setVisible(visible === c.id ? null : String(c.id))
                  }
                >
                  {visible === c.id ? "Ẩn PIN" : "Xem PIN truy cập"}
                </button>
                {visible === c.id && (
                  <p className="pin-display">{display(c.pinCode)}</p>
                )}
              </>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
