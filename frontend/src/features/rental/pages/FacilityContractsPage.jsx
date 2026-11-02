import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { rentalApi } from "../api/rental.api";
export default function FacilityContractsPage() {
    return (<ResourcePage title="Hợp đồng tại cơ sở" description="Theo dõi hợp đồng, ngày hết hạn và các trường hợp quá hạn trong phạm vi cơ sở." load={rentalApi.list} filters={[{ key: "status", label: "Trạng thái", options: ["ACTIVE", "EXPIRING_SOON", "OVERDUE", "CHECKOUT_REQUESTED", "TERMINATED"] }]} columns={[["id", "Mã hợp đồng"], ["unitCode", "Mã kho"], ["customerName", "Khách hàng"], ["startDate", "Bắt đầu"], ["endDate", "Kết thúc"], ["status", "Trạng thái"]]} />);
}
