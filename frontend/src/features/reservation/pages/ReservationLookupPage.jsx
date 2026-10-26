import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { reservationApi } from "../api/reservation.api";
export default function ReservationLookupPage() {
    return (<ResourcePage title="Tra cứu đơn đặt chỗ" description="Tìm kiếm và xem thông tin đơn đặt chỗ tại cơ sở. Để xác nhận khách đến, mở task được giao trong Công việc và chọn Xác nhận check-in." load={reservationApi.list}/>);
}
