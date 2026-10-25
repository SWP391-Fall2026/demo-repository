import { useState } from "react";
import { Link } from "react-router-dom";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
const activeStatuses = ["ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED"];
const statusLabels = {
    ACTIVE: "Đang thuê",
    EXPIRING_SOON: "Sắp hết hạn",
    OVERDUE: "Tạm khóa nợ cước",
    CHECKOUT_REQUESTED: "Đã yêu cầu trả kho",
    TERMINATED: "Đã kết thúc",
};
export default function MyRentalsPage() {
    const loadRentals = () => rentalApi.list().then((rows) => rows.filter((row) => activeStatuses.includes(String(row.status))));
    const { data, reload } = useRemote(loadRentals);
    const [visible, setVisible] = useState(null);
    return (<>
      <ResourcePage title="Kho đang thuê và hợp đồng" description="Hiển thị toàn bộ kho khách đang thuê: tên cơ sở, mã kho, ngày bắt đầu, ngày kết thúc dự kiến, trạng thái hợp đồng và mã PIN truy cập. Yêu cầu trả kho giữ nguyên hiệu lực hợp đồng và PIN cho đến khi Staff nghiệm thu." load={loadRentals} columns={[
            ["unitCode", "Mã kho"],
            ["facilityCode", "Cơ sở"],
            ["status", "Trạng thái hợp đồng"],
            ["startDate", "Ngày bắt đầu"],
            ["endAt", "Ngày kết thúc dự kiến"],
            ["monthlyFee", "Giá thuê / tháng"],
            ["checkoutRequestedDate", "Ngày hẹn trả"],
        ]}>
        <Form fields={[
            { name: "unitCode", label: "Mã kho", required: true },
            {
                name: "newPin",
                label: "PIN mới 6 chữ số",
                type: "password",
                required: true,
            },
        ]} label="Đổi PIN cá nhân" submit={rentalApi.updatePin} onSuccess={reload}/>
        <Link className="button secondary" to="/rentals/access-code">
          Tra cứu mã truy cập
        </Link>{" "}
        <Link className="button secondary" to="/rentals/return">
          Yêu cầu trả kho
        </Link>{" "}
        <Link className="button secondary" to="/rentals/renew">
          Gia hạn
        </Link>
      </ResourcePage>
      {!data?.length && (<section className="card"><h2>Chưa thuê kho nào</h2><p>Khách chưa thuê kho nào. Danh sách sẽ xuất hiện khi có hợp đồng hiệu lực.</p></section>)}
      <div className="metric-grid">
        {data?.map((c) => {
            const locked = String(c.status) === "OVERDUE";
            return (<article className="card" key={String(c.id)}>
            <h2>{display(c.unitCode)}</h2>
            <p>Cơ sở: {display(c.facilityCode)}</p>
            <p>Mã hợp đồng: {display(c.id)}</p>
            <p>
              {statusLabels[String(c.status)] || display(c.status)} · {money(c.monthlyFee)}/tháng
            </p>
            <p>Bắt đầu: {display(c.startDate || c.startAt)}</p>
            <p>Hết hạn dự kiến: {display(c.endAt || c.endDate)}</p>
            {c.checkoutRequestedDate && (<p>Ngày hẹn trả: {display(c.checkoutRequestedDate)}</p>)}
            {locked && (<p role="alert">Kho đang trong trạng thái tạm khóa nợ cước: PIN bị hạn chế.</p>)}
            <Link className="button" to={`/rentals/${encodeURIComponent(String(c.id))}`}>Xem chi tiết hợp đồng</Link>
            {Boolean(c.pinCode) && !locked && (<>
                <button className="secondary" onClick={() => setVisible(visible === c.id ? null : String(c.id))}>
                  {visible === c.id ? "Ẩn PIN" : "Xem PIN truy cập"}
                </button>
                {visible === c.id && (<>
                    <p className="pin-display">{display(c.pinCode)}</p>
                    <p>Hướng dẫn an ninh: không chia sẻ PIN, đổi PIN cá nhân khi nghi lộ.</p>
                  </>)}
              </>)}
          </article>);
        })}
      </div>
    </>);
}
