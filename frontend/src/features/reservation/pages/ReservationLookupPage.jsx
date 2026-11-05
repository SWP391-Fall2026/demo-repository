import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";

const reservationColumns = [
    ["id", "Mã đặt chỗ"],
    ["customerName", "Khách hàng"],
    ["customerPhone", "Số điện thoại"],
    ["unitCode", "Kho đã đặt"],
    ["facilityCode", "Cơ sở"],
    ["appointmentAt", "Giờ hẹn check-in"],
    ["depositAmount", "Tiền cọc"],
    ["status", "Trạng thái đơn"],
];

export default function ReservationLookupPage() {
    return (
        <ResourcePage
            eyebrow="STORAGE / NHÂN VIÊN CA TRỰC"
            title="Tra cứu đơn đặt chỗ tại cơ sở"
            description="Tìm kiếm nhanh đơn đặt chỗ của khách hàng theo tên, số điện thoại, mã đơn hoặc buồng kho phân bổ."
            load={reservationApi.list}
            columns={reservationColumns}
        />
    );
}
