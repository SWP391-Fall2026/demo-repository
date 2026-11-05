import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { useSession } from "../../identity/session";
import { reservationApi } from "../api/reservation.api";

const reservationColumns = [
    ["id", "Mã đặt chỗ"],
    ["customerName", "Khách hàng"],
    ["unitCode", "Kho đã chọn"],
    ["facilityCode", "Cơ sở"],
    ["appointmentAt", "Giờ hẹn check-in"],
    ["status", "Trạng thái đơn"],
];

export default function NoShowReviewPage() {
    const session = useSession();
    const id = {
        name: "reservationId",
        label: "Mã đặt chỗ",
        required: true,
    };
    const reason = {
        name: "reason",
        label: "Lý do và ghi chú",
        type: "textarea",
        required: true,
    };

    return (
        <ResourcePage
            eyebrow="STORAGE / VẬN HÀNH CƠ SỞ"
            title="Kiểm tra & Xử lý đơn quá hẹn (NO_SHOW)"
            description="Cảnh báo sau 30 phút quá hẹn nhận kho. Ghi nhận khách đã đến quầy, gia hạn thời gian chờ hoặc xác nhận hủy do vắng mặt."
            load={reservationApi.list}
            columns={reservationColumns}
            childrenTitle="Tác vụ xử lý đơn quá hạn"
        >
            {session?.user.role === "STAFF" && (
                <>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0B192C", margin: "16px 0 8px" }}>
                        1. Khách hàng đã đến quầy nhận kho
                    </h3>
                    <Form fields={[id]} label="Ghi nhận khách đã đến quầy" submit={reservationApi.arrived} />

                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0B192C", margin: "20px 0 8px" }}>
                        2. Gia hạn thêm thời gian chờ (tối đa 1 lần)
                    </h3>
                    <Form
                        fields={[
                            id,
                            {
                                name: "minutes",
                                label: "Số phút gia hạn thêm (1–30 phút)",
                                type: "number",
                                defaultValue: 30,
                                required: true,
                            },
                            reason,
                        ]}
                        label="Lưu gia hạn thời gian chờ"
                        submit={reservationApi.extend}
                    />

                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0B192C", margin: "20px 0 8px" }}>
                        3. Xác nhận khách vắng mặt (NO_SHOW)
                    </h3>
                    <Form fields={[id, reason]} label="Xác nhận hủy đơn do NO_SHOW" submit={reservationApi.noShow} />
                </>
            )}

            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0B192C", margin: "20px 0 8px" }}>
                Báo cáo sự cố hệ thống / cơ sở (Tạm hoãn NO_SHOW)
            </h3>
            <Form fields={[id, reason]} label="Tạm hoãn hủy do sự cố" submit={reservationApi.incident} />

            {session?.user.role === "FMANAGER" && (
                <>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0B192C", margin: "20px 0 8px" }}>
                        Phê duyệt lịch hẹn / hạn giữ khoang mới (Manager)
                    </h3>
                    <Form
                        fields={[
                            id,
                            {
                                name: "appointmentAt",
                                label: "Giờ hẹn nhận kho mới",
                                type: "datetime-local",
                            },
                            { name: "holdUntil", label: "Gia hạn giữ chỗ đến", type: "datetime-local" },
                            reason,
                        ]}
                        label="Phê duyệt điều chỉnh lịch hẹn"
                        submit={reservationApi.reschedule}
                    />
                </>
            )}
        </ResourcePage>
    );
}
