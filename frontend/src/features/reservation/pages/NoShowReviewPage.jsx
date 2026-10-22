import { ResourcePage, Form, } from "../../../shared/ui/ResourcePage";
import { useSession } from "../../identity/session";
import { reservationApi } from "../api/reservation.api";
export default function NoShowReviewPage() {
    const session = useSession();
    const id = {
        name: "reservationId",
        label: "Mã đặt chỗ",
        required: true,
    };
    const reason = {
        name: "reason",
        label: "Lý do",
        type: "textarea",
        required: true,
    };
    return (<ResourcePage title="Kiểm tra NO_SHOW" description="Cảnh báo sau 30 phút. Ghi nhận khách đã đến quầy trước khi xác nhận NO_SHOW; sự cố sẽ tạm chặn xử lý." load={reservationApi.list}>
      {session?.user.role === "STAFF" && (<>
          <h3>Khách đã đến quầy</h3>
          <Form fields={[id]} label="Ghi nhận đã đến" submit={reservationApi.arrived}/>
          <h3>Gia hạn thời gian chờ (một lần)</h3>
          <Form fields={[
                id,
                {
                    name: "minutes",
                    label: "Số phút thêm vào hạn cơ bản (1–30)",
                    type: "number",
                    defaultValue: 30,
                    required: true,
                },
                reason,
            ]} submit={reservationApi.extend}/>
          <h3>Xác nhận NO_SHOW</h3>
          <Form fields={[id, reason]} label="Xác nhận NO_SHOW" submit={reservationApi.noShow}/>
        </>)}
      <h3>Sự cố hệ thống hoặc cơ sở</h3>
      <Form fields={[id, reason]} label="Tạm chặn NO_SHOW" submit={reservationApi.incident}/>
      {session?.user.role === "FMANAGER" && (<>
          <h3>Phê duyệt lịch hẹn / hạn giữ mới</h3>
          <Form fields={[
                id,
                {
                    name: "appointmentAt",
                    label: "Giờ hẹn mới (để trống nếu chỉ giữ chỗ)",
                    type: "datetime-local",
                },
                { name: "holdUntil", label: "Giữ đến", type: "datetime-local" },
                reason,
            ]} label="Phê duyệt điều chỉnh" submit={reservationApi.reschedule}/>
        </>)}
    </ResourcePage>);
}
